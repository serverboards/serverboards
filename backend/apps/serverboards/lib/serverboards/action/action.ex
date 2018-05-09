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

    GenServer.start_link __MODULE__, %{}, [name: Serverboards.Action] ++ options
  end

  def action_update_started(action) do
    import Ecto.Query
    #Logger.warn("Trigger start saved #{inspect action}")
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
  end

  def action_update_finished(action) do
    import Ecto.Query
    #Logger.warn("Action finished #{inspect action.uuid}", action: action)
    case Repo.all(from h in Model.History, where: h.uuid == ^action.uuid) do
      [prev] ->
        case Repo.update( Model.History.changeset(prev, action) ) do
          {:ok, hist} -> {:ok, hist}
          {:error, %{ errors: errors } } ->
            Logger.error("Error storing action result: #{ inspect errors }. Storing as error finished.")
            Repo.update( Model.History.changeset(prev, %{ status: "error", result: %{ database_error: Map.new(errors) } } ) )
        end
      [] ->
        Logger.warn("Storing action finished on non yet started action (or not registered yet). May be a fast action. #{inspect action}", action: action)
        Logger.debug("Also happens in tests, where the database may be cleaned and after some time the action finished.")
        user_id = case Repo.all(from u in Serverboards.Auth.Model.User, where: u.email == ^action.user, select: u.id ) do
          [] -> nil
          [id] -> id
        end
        action = Map.merge( action, %{ type: action[:id], user_id: user_id } )
        {:ok, _res} = Repo.insert( Model.History.changeset(%Model.History{}, action) )
    end
  end

  @doc ~S"""
  Searchs for actions that fulfill this catalog.

  ## Example

    iex> user = Test.User.system
    iex> Enum.count catalog([trait: "test"], user)
    1
    iex> [%{id: action_id} | _rest ] = catalog([trait: "test"], user)
    iex> action_id
    "serverboards.test.auth/action"

  """
  def catalog(q, _user) do
    Plugin.Registry.filter_component([type: "action"] ++ q)
  end

  @doc ~S"""
  Returns the action history with some filtering
  """
  def list(filter, _user) do
    import Ecto.Query
    count = Map.get(filter,:count, 100)
    start = Map.get(filter,:start)
    query = from h in Model.History,
    left_join: u in Serverboards.Auth.Model.User,
           on: u.id == h.user_id,
      order_by: [desc: h.inserted_at],
      limit: ^count,
      select: {h, u.email}

    query = if start do
      [id] = Repo.all( from h in Model.History, where: h.uuid == ^start, select: h.id )

      where(query, [l], l.id < ^id )
    else
      query
    end

    list = Repo.all( query )
      |> Enum.map(fn {h, user_email} ->
        action = Plugin.Registry.find(h.type)
        %{
          uuid: h.uuid,
          date: DateTime.to_iso8601(h.inserted_at),
          elapsed: h.elapsed,
          action: if action do action.name else "Unknown Action" end,
          user: user_email,
          status: h.status,
          type: h.type
        }
      end)
    count = Repo.one( from h in Model.History, select: count("*"))
    %{
      list: list,
      count: count
    }
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
            date: DateTime.to_iso8601(h.inserted_at),
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
    iex> [%{id: action_id} | _rest ] = catalog([trait: "test"], user)
    iex> {:ok, uuid} = trigger(action_id, %{ url: "https://serverboards.io" }, user)
    iex> String.length uuid
    36

  """
  def trigger(action_id, params, user) when is_map(user) do
    trigger(action_id, params, user.email)
  end
  def trigger(action_id, params, me) do
    action = Plugin.Registry.find(action_id)
    if action do
      uuid = UUID.uuid4
      EventSourcing.dispatch :action, :trigger,
        %{ uuid: uuid, action: action_id, params: params }, me
      {:ok, uuid}
    else
      {:error, :unknown_action}
    end
  end

  @doc ~S"""
  Executes and action (normal trigger), and waits for result

  Returns the result.
  """
  def trigger_wait(action_id, params, me) do
    {:ok, uuid} = trigger(action_id, params, me)
    GenServer.call(Serverboards.Action, {:wait, uuid}, 300_000 ) # 5 min to do it. Else fail
  end

  @doc ~S"""
  Returns a list of currently running actions

    iex> require Logger
    iex> user = Test.User.system
    iex> Logger.info("start action")
    iex> {:ok, uuid} = trigger("serverboards.test.auth/action", %{ url: "https://serverboards.io", sleep: 1 }, user)
    iex> :timer.sleep 300
    iex> list = ps(user)
    iex> uuid_list = list |> Enum.map(&(&1.uuid))
    iex> Logger.info("#{inspect uuid} in #{inspect uuid_list}")
    iex> uuid in uuid_list
    true

  """
  def ps(_user) do
    GenServer.call(Serverboards.Action, {:ps})
  end

  @doc ~S"""
  Updates the label and or progress of a running action
  """
  def update(uuid, params, _user) do
    #Logger.info("Updating action status: #{inspect uuid}: #{inspect params}", uuid: uuid, params: params, user: user)
    GenServer.cast(Serverboards.Action, {:update, uuid, params})
  end

  ## Server impl
  def init(%{}) do
    Process.flag(:trap_exit, true)
    server = self()

    {:ok, es} = EventSourcing.start_link name: :action
    EventSourcing.Model.subscribe es, :action, Serverboards.Repo

    EventSourcing.subscribe es, :trigger, fn
      %{ action: action, params: params, uuid: uuid}, me ->
          GenServer.call(server, {:trigger, uuid, action, params, me})
    end

    {:ok, _} = Serverboards.Action.RPC.start_link
    {:ok, %{ running: %{}, waiting: %{} }}
  end

  # first part, bookeeping and start the trigger_real in another Task
  def handle_call({:trigger, uuid, action_id, params, user}, _from, status) do
    action_component = Plugin.Registry.find(action_id)
    if (action_component != nil and action_component.extra["command"] !=nil ) do
      #Logger.info("Trigger action #{action_component.id} by #{inspect user}")
      command_id = if String.contains?(action_component.extra["command"], "/") do
        action_component.extra["command"]
      else
        "#{action_component.plugin.id}/#{action_component.extra["command"]}"
      end
      method = action_component.extra["call"]

      action = %{
       uuid: uuid,
       name: action_component.name,
       id: action_component.id,
       user: user,
       params: params,
       timer_start: DateTime.utc_now,
       progress: nil,
       label: nil
       }

      action_update_started(action)
      Event.emit("action.started", action, ["action.watch"] )

      server = self()
      {:ok, task} = Task.start_link fn ->
        #Process.put(:name, Serverboards.Action.Running)
        # time and run
        #Logger.debug("Action start #{inspect uuid}: #{inspect command_id}")
        params = Map.put(params, "action_id", uuid)
        {ok, ret} = Plugin.Runner.call(command_id, method, params)
        GenServer.call(server, {:trigger_stop, {uuid, ok, ret}})
      end
      Process.monitor(task)
      {:reply, :ok, %{
        status |
        running: Map.put(status.running, uuid, action)
      } }
    else
      {:reply, {:error, :invalid_action}, status}
    end
  end
  # second part, bookkeeping
  def handle_call({:trigger_stop, {uuid, ok, ret} }, _from, status) do
    #Logger.debug("Trigger stop #{inspect uuid}: #{inspect ret}")
    action = status.running[uuid]
    elapsed = Timex.diff(DateTime.utc_now, action.timer_start, :milliseconds)

    if ok == :error do
      Logger.error("Error running #{action.id}: #{inspect ret}", action: action)
    end
    ret = case ret do
      %{} -> ret
      _s -> %{ result: ret }
    end
    action = Map.merge(action, %{
      elapsed: elapsed,
      status: ok,
      result: ret
    })

    action_update_finished(action)
    Event.emit("action.stopped", action, ["action.watch"] )

    #Logger.debug("Has it waiting? #{inspect status.waiting} #{inspect uuid}, #{inspect (status.waiting[uuid])}")
    waiting = if status.waiting[uuid] != nil do
      GenServer.reply(status.waiting[uuid], ret)
      Map.drop(status.waiting, [uuid])
    else
      status.waiting
    end

    {:reply, :ok, %{
      status |
        running: Map.drop(status.running, [uuid]),
        waiting: waiting,
    } }
  end

  def handle_call({:wait, uuid}, from, status) do
    status_result = if not Map.has_key?(status.running, uuid) do # If not running, may be in database as finished
      import Ecto.Query
      case Repo.all( from h in Model.History, where: h.uuid == ^uuid, select: {h.status, h.result} ) do
        nil -> nil
        [{"error", result}] -> {:error, result}
        [{"ok", result}] -> {:ok, result}
        [{code, _}] -> {:error, code}
        [] -> {:error, :unknown_action}
      end
    else
      nil
    end

    if status_result != nil do
      {:reply, status_result, status}
    else
      {:noreply, %{
        status |
        waiting: Map.put(status.waiting, uuid, from)
        } }
    end
  end

  def handle_call({:ps}, _from, status) do
    ret = status.running
      |> Enum.map( fn {uuid, %{ id: action_id, params: params, progress: progress, label: label } } ->
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
          uuid: uuid,
          progress: progress,
          label: label
        }
      end )
    {:reply, ret, status}
  end
  def handle_cast({:update, uuid, params}, status) do
    action = status.running[uuid]
    if action do
      action = Map.merge(action, Map.take(params, ~w"progress label"a))
      Event.emit("action.updated", action, ["action.watch"] )
      {:noreply, %{ status |
        running: Map.put(status.running, uuid, action)
        }}
    else
      {:noreply, status}
    end
  end
  def handle_info({:DOWN, _, :process, _, :normal}, status) do
    #Logger.debug("Got process down // This is the command port")
    # All ok
    {:noreply, status}
  end
  def handle_info({:EXIT, _, :normal}, status) do
    #Logger.debug("Got process exit #{inspect reason}")
    # All ok
    {:noreply, status}
  end

  def handle_info(info, status) do
    Logger.warn("Got unexpected info: #{inspect info, pretty: true}")
    {:noreply, status}
  end

end
