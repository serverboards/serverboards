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
  use GenServer

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
        Logger.info("Stopped action #{inspect action}")
        prev = Repo.get_by!( Model.History, uuid: action.uuid )
        case Repo.update( Model.History.changeset(prev, action) ) do
          {:ok, hist} -> {:ok, hist}
          {:error, %{ errors: errors } } ->
            Logger.error("Error storing action result: #{ inspect errors }. Storing as error finished.")
            Repo.update( Model.History.changeset(prev, %{ status: "error", result: %{ database_error: Map.new(errors) } } ) )
        end
        :ok
      _ -> :ok
    end)

    GenServer.start_link __MODULE__, %{}, [name: Serverboards.Action] ++ options
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
  Returns the action history with some filtering
  """
  def history(_filter, _user) do
    import Ecto.Query
    Repo.all(from h in Model.History,
    left_join: u in Serverboards.Auth.Model.User,
           on: u.id == h.user_id,
      order_by: [desc: h.inserted_at],
      select: {h, u.email} )
      |> Enum.map(fn {h, user_email} ->
        action = Plugin.Registry.find(h.type)
        %{
          uuid: h.uuid,
          date: Ecto.DateTime.to_iso8601(h.inserted_at),
          elapsed: h.elapsed,
          action: if action do action.name else "Unknown Action" end,
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
      case Repo.one(
              from h in Model.History,
              where: h.uuid == ^uuid,
              left_join: u in Serverboards.Auth.Model.User,
                     on: u.id == h.user_id,
                select: { h, u.email }
              ) do
        nil ->
          {:error, :not_found}
        {h, user_email} ->
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
      e in Elixir.Ecto.CastError ->
        Logger.debug("Invalid UUID #{inspect uuid}: #{inspect e}")
        {:error, :invalid_uuid}
    end
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

  @doc ~S"""
  Performs the trigger executing the plugin and calling the method, but nothing else

  Called by the server
  """
  def trigger_real(command_id, method, params) do
    {:ok, plugin} = Plugin.Runner.start( command_id )
    #Logger.debug("Call method #{method}")
    ret = try do
      ret = Plugin.Runner.call(plugin, method, params)
      Plugin.Runner.stop(plugin)
      ret
    catch
      :exit, _ ->
        {:error, :abort}
    end

    #Logger.debug("Call method #{method} -> #{inspect ret}")
    ret
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
    GenServer.call(Serverboards.Action, {:ps})
  end

  ## Server impl
  def init(%{}) do
    Process.flag(:trap_exit, true)
    server = self

    {:ok, es} = EventSourcing.start_link name: :action
    EventSourcing.Model.subscribe es, :action, Serverboards.Repo

    EventSourcing.subscribe es, :trigger, fn
      %{ action: action, params: params, uuid: uuid}, me ->
          GenServer.call(server, {:trigger, {uuid, action, params, me}})
    end

    {:ok, _} = Serverboards.Action.RPC.start_link
    {:ok, %{}}
  end

  # first part, bookeeping and start the trigger_real in another Task
  def handle_call({:trigger, {uuid, action_id, params, user}}, _from, status) do
    action_component = Plugin.Registry.find(action_id)
    if (action_component != nil and action_component.extra["command"] !=nil ) do
      #Logger.info("Trigger action #{action_component.id} by #{inspect user}")
      command_id = if String.contains?(action_component.extra["command"], "/") do
        action_component.extra["command"]
      else
        "#{action_component.plugin.id}/#{action_component.extra["command"]}"
      end
      method = action_component.extra["call"]["method"]

      action = %{
       uuid: uuid, name: action_component.name,
       id: action_component.id,
       user: user, params: params,
       timer_start: Timex.Time.now
       }
      Event.emit("action.started", action, ["action.watch"] )

      server = self
      {:ok, task} = Task.start_link fn ->
        Process.put(:name, Serverboards.Action.Running)
        # time and run
        {ok, ret} = trigger_real(command_id, method, params)
        GenServer.call(server, {:trigger_stop, {uuid, ok, ret}})
      end
      Process.monitor(task)
      {:reply, :ok, Map.put(status, uuid, action)}
    else
      {:reply, {:error, :invalid_action}, status}
    end
  end
  # second part, bookkeeping
  def handle_call({:trigger_stop, {uuid, ok, ret} }, _from, status) do
    action = status[uuid]

    elapsed = round(
      Timex.Time.to_milliseconds(Timex.Time.elapsed(action.timer_start))
      )

    if ok == :error do
      Logger.error("Error running #{action.id} #{inspect action.params}: #{inspect ret}")
    end
    ret = case ret do
      %{} -> ret
      _s -> %{ data: ret }
    end
    action = Map.merge(action, %{
      elapsed: elapsed,
      status: ok,
      result: ret
    })

    Event.emit("action.stopped", action, ["action.watch"] )

    {:reply, :ok, Map.drop(status, [uuid])}
  end

  def handle_call({:ps}, _from, status) do
    ret = status
      |> Enum.map( fn {uuid, %{ id: action_id, params: params } } ->
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
    {:reply, ret, status}
  end

  def handle_info({:DOWN, _, :process, _, :normal}, status) do
    #Logger.debug("Got process down // This is the command port")
    # All ok
    {:noreply, status}
  end
  def handle_info({:EXIT, _, :normal}, status) do
    #Logger.debug("Got process exit normal")
    # All ok
    {:noreply, status}
  end

  def handle_info(info, status) do
    Logger.warn("Got unexpected info: #{inspect info}")
    {:noreply, status}
  end

end
