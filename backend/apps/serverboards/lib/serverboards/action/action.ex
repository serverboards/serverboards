require Logger

defmodule Serverboards.Action do
  @moduledoc ~S"""
  Executes and tracks execution of actions.

  Actions can be manually triggered, or via a rule.

  Actions are method calls inside plugins, so it must first run the plugin,
  then execute the command, and shutdown the plugin.
  """
  alias Serverboards.{Plugin, Event, Repo}
  alias Serverboards.Action.Model

  def start_link(options) do
    import Ecto.Query

    from( h in Model.History, where: h.status == "running" )
      |> Repo.update_all( set: [
        status: "aborted",
        result: %{ reason: "Serverboards restart"}
      ] )

    MOM.Channel.subscribe(:client_events, fn
      %{ payload: %{ type: "action.started", data: action }  } ->
        user_id = case Repo.all(from u in Serverboards.Auth.Model.User, where: u.email == ^action.user, select: u.id ) do
          [] -> nil
          [id] -> id
        end

        action=Map.merge( action, %{
          type: action.id,
          status: "running",
          user_id: user_id
        })

        {:ok, _res} = Repo.insert( Model.History.changeset(%Model.History{}, action) )
        #Logger.info("Saved #{inspect _res}")
        :ok
      _ ->
         :ok
    end)
    MOM.Channel.subscribe(:client_events, fn
      %{ payload: %{ type: "action.stopped", data: action }  } ->
        Logger.info("Action #{inspect action} stopped")
        prev = Repo.get_by( Model.History, uuid: action.uuid )
        case Repo.update( Model.History.changeset(prev, action) ) do
          {:ok, hist} -> {:ok, hist}
          {:error, %{ errors: errors } } ->
            Logger.error("Error storing action result: #{ inspect errors }. Storing as error finished.")
            Repo.update( Model.History.changeset(prev, %{ status: "error", result: %{ database_error: Map.new(errors) } } ) )
        end
        :ok
      _ -> :ok
    end)

    {:ok, es} = EventSourcing.start_link name: :action
    EventSourcing.Model.subscribe es, :action, Serverboards.Repo

    EventSourcing.subscribe es, :trigger, fn
      %{ action: action, params: params, uuid: uuid}, me ->
        trigger_real(uuid, action, params, me)
    end

    {:ok, _} = Serverboards.Action.RPC.start_link
    Agent.start_link &Map.new/0, [name: Serverboards.Action] ++ options
  end

  @doc ~S"""
  Searchs for actions that fulfill this filter.

  ## Example

    iex> user = Test.User.system
    iex> Enum.count filter([trait: "test"], user)
    1
    iex> [%{id: action_id} | _rest ] = filter([trait: "test"], user)
    iex> action_id
    "serverboards.test.auth/action"

  """
  def filter(q, _user) do
    Plugin.Registry.filter_component([type: "action"] ++ q)
  end

  @doc ~S"""
  Excutes an action

    iex> user = Test.User.system
    iex> [%{id: action_id} | _rest ] = filter([trait: "test"], user)
    iex> {:ok, uuid} = trigger(action_id, %{ url: "https://serverboards.io" }, user)
    iex> String.length uuid
    36

  """
  def trigger(action_id, params, me) do
    Logger.info("Pre Trigger action #{action_id} by #{inspect me}")
    action = Plugin.Registry.find(action_id)
    if action do
      uuid = UUID.uuid4
      EventSourcing.dispatch :action, :trigger,
        %{ uuid: uuid, action: action_id, params: params }, me.email
      {:ok, uuid}
    else
      {:error, :unknown_action}
    end
  end

  def trigger_real(uuid, action_id, params, user) do
    Logger.info("Trigger action #{action_id} by #{inspect user}")
    action = Plugin.Registry.find(action_id)

    if (!(action==nil)) and (!(action.extra["command"]==nil)) do
      task = Task.start_link(fn ->
        Agent.update(Serverboards.Action, fn actions ->
          Map.put(actions, uuid, %{action: action_id, pid: self, params: params})
        end)
        Event.emit("action.started", %{
          uuid: uuid, name: action.name, id: action_id, user: user, params: params
          }, ["action.watch"] )
        command_id = if String.contains?(action.extra["command"], "/") do
          action.extra["command"]
        else
          "#{action.plugin.id}/#{action.extra["command"]}"
        end

        timer_start = Timex.Time.now
        {ok, ret} =
          with {:ok, plugin} <- Plugin.Runner.start( command_id ),
            do: Plugin.Runner.call(plugin, action.extra["call"]["method"], params)
        elapsed = round(
          Timex.Time.to_milliseconds(Timex.Time.elapsed(timer_start))
          )

        if ok == :error do
          Logger.error("Error running #{action_id} #{inspect params}: #{inspect ret}")
        end

        ret = case ret do
          %{} -> ret
          _s -> %{ data: ret }
        end

        Event.emit("action.stopped",
          %{uuid: uuid, name: action.name, id: action_id,
            status: ok, result: ret, elapsed: elapsed
            }, ["action.watch"] )

        Agent.update(Serverboards.Action, fn actions ->
          Map.drop(actions, [uuid])
        end)
      end)
      :ok
    else
      {:error, :invalid_action}
    end
  end

  @doc ~S"""
  Returns a list of currently running actions

    iex> user = Test.User.system
    iex> {:ok, uuid} = trigger("serverboards.test.auth/action", %{ url: "https://serverboards.io", sleep: 1 }, user)
    iex> :timer.sleep 300
    iex> list = ps(user)
    iex> uuid_list = list |> Enum.map(&(&1.uuid))
    iex> uuid in uuid_list
    true

  """
  def ps(_user) do
    Agent.get(Serverboards.Action, &(&1))
      |> Enum.map( fn {uuid, %{ action: action_id, params: params } } ->
        component = Plugin.Registry.find(action_id)
        #Logger.debug("ps: #{inspect component}/#{inspect action_id}")
        %{
          id: action_id,
          name: component.name,
          plugin: component.plugin.id,
          params: component.extra["call"]["params"] |> Enum.map( fn param ->
            Map.put(param, :value, params[param["name"]])
          end),
          returns: component.extra["call"]["returns"],
          uuid: uuid
        }
      end )
  end

  @doc ~S"""
  Returns the action history with some filtering
  """
  def history(_filter, _user) do
    import Ecto.Query
    Repo.all(from h in Model.History, order_by: [desc: h.inserted_at] )
      |> Enum.map(fn h ->
        [user_email] = Repo.all(from u in Serverboards.Auth.Model.User, where: u.id == ^h.user_id, select: u.email )
        action = Plugin.Registry.find(h.type)
        %{
          uuid: h.uuid,
          date: Ecto.DateTime.to_iso8601(h.inserted_at),
          elapsed: h.elapsed,
          action: action.name,
          user: user_email,
          status: h.status,
          type: h.type
        }
      end)
  end

  @doc ~S"""
  Get detailed information about a specific action
  """
  def details(uuid, _user) do
    import Ecto.Query
    try do
      case Repo.one(from h in Model.History, where: h.uuid == ^uuid) do
        nil ->
          {:error, :not_found}
        h ->
          [user_email] = Repo.all(
              from u in Serverboards.Auth.Model.User,
             where: u.id == ^h.user_id,
            select: u.email
            )
          action = Plugin.Registry.find(h.type)

          %{
            uuid: h.uuid,
            date: Ecto.DateTime.to_iso8601(h.inserted_at),
            params: h.params,
            elapsed: h.elapsed,
            action: action.name,
            user: user_email,
            status: h.status,
            type: h.type,
            result: h.result,
          }
      end
    rescue
      Elixir.Ecto.CastError ->
        Logger.debug("Invalid UUID #{inspect uuid}")
        {:error, :invalid_uuid}
    end
  end
end
