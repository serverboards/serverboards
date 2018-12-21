require Logger

defmodule Serverboards.Plugin.Runner do
  @moduledoc ~S"""
  Server that stats plugins and connects the RPC channels.

  Every started plugin has an UUID as id, and that UUID is later used
  for succesive calls using the runner.

  An UUID is used as ID as it can be considered an opaque secret token to
  identify the clients that can be passed around.
  """
  use GenServer
  alias Serverboards.Plugin

  def start_link(options \\ []) do
    {:ok, pid} = GenServer.start_link(__MODULE__, :ok, options)

    method_caller = Serverboards.Plugin.Runner.method_caller()

    MOM.Channel.subscribe(:auth_authenticated, fn %{user: _user, client: client} ->
      MOM.RPC.Client.add_method_caller(client, method_caller)
      :ok
    end)

    {:ok, pid}
  end

  @doc ~S"""
  Starts a component by name and adds it to the running registry.

  Example:

    iex> {:ok, cmd} = start("serverboards.test.auth/fake", "test")
    iex> call cmd, "ping"
    {:ok, "pong"}
    iex> stop(cmd)
    true

  Or if does not exist:

    iex> start("nonexistantplugin", "test")
    {:error, :not_found}

  It can also be called with a component struct:

    iex> component = hd (Serverboards.Plugin.Registry.filter_component trait: "auth")
    iex> {:ok, cmd} = start(component, "test")
    iex> call cmd, "ping"
    {:ok, "pong"}
    iex> stop(cmd)
    true

  """
  def start(%Serverboards.Plugin.Component{} = component, user) do
    plugin_id =
      cond do
        is_map(component.plugin) -> component.plugin.id
        true -> component.plugin
      end

    component = %Serverboards.Plugin.Component{component | plugin: plugin_id}
    # Logger.info("Start component #{inspect component.id}")
    GenServer.call(Serverboards.Plugin.Runner, {:start, component, user})
  end

  def start(plugin_component_id, user)
      when is_binary(plugin_component_id) do
    case Serverboards.Plugin.Registry.find(plugin_component_id) do
      nil ->
        Logger.error("Plugin component #{plugin_component_id} not found")
        {:error, :not_found}

      c ->
        start(c, user)
    end
  end

  def stop(uuid) do
    case GenServer.call(Serverboards.Plugin.Runner, {:stop, uuid}) do
      # just do not log it, as it is quite normal
      {:error, :cant_stop} ->
        # Logger.debug("Non stoppable plugin to stop #{inspect uuid}")
        {:error, :cant_stop}

      {:error, e} ->
        Logger.error("Error stopping component #{inspect(uuid)}: #{inspect(e)}")
        {:error, e}

      {:ok, cmd} ->
        # Logger.debug("Stop plugin #{inspect uuid}")
        Serverboards.IO.Cmd.stop(cmd)
        true
    end
  end

  @doc ~S"""
  Forces stop of the command, even for init and singleton commands

  This is required in some situations, as reloading of plugin code.
  """
  def kill(uuid) do
    case get(uuid) do
      %{pid: pid} = data when is_pid(pid) ->
        Logger.info("Kill process #{uuid} / #{inspect(data.component.id)}")
        GenServer.call(Serverboards.Plugin.Runner, {:exit, uuid})
        # should be running, but have found the bug in the wild.
        if Process.alive?(pid) do
          Serverboards.IO.Cmd.stop(pid)
        end

        :ok

      other ->
        {:error, other}
    end
  end

  def get_by_component_id(component_id) do
    GenServer.call(Serverboards.Plugin.Runner, {:get_by_component_id, component_id})
  end

  @doc ~S"""
  Marks that this plugin has been used, for timeout pourposes
  """
  def ping(uuid) do
    GenServer.cast(Serverboards.Plugin.Runner, {:ping, uuid})
    :ok
  end

  @doc ~S"""
  Returns method caller, so that it can be added to an authenticated client

  ## Example:

    iex> alias Test.Client
    iex> {:ok, client} = Client.start_link as: "dmoreno@serverboards.io"
    iex> {:ok, pl} = Client.call client, "plugin.start", ["serverboards.test.auth/fake"]
    iex> is_binary(pl)
    true
    iex> Client.call client, "plugin.call", [pl, "ping",[]]
    {:ok, "pong"}
    iex> Client.call client, "plugin.call", [pl, "ping"]
    {:ok, "pong"}
    iex> Client.call client, "plugin.stop", [pl]
    {:ok, true}

  """
  def method_caller() do
    GenServer.call(Serverboards.Plugin.Runner, {:method_caller})
  end

  @doc ~S"""
  Rerurns the RPC client of a given uuid
  """
  def client(uuid) when is_binary(uuid) do
    case get(uuid) do
      %{pid: pid} ->
        client = Serverboards.IO.Cmd.client(pid)
        {:ok, client}

      nil ->
        {:error, :not_found}
    end
  end

  @doc ~S"""
  Returns the associated cmd struct to this uuid
  """
  def get(uuid) when is_binary(uuid) do
    GenServer.call(Serverboards.Plugin.Runner, {:get, uuid})
  end

  @doc ~S"""
  Calls a runner started command method.

  id is an opaque id that can be passed around to give access to this command.

  Examples:

    iex> {:ok, cmd} = start "serverboards.test.auth/fake", "test"
    iex> call cmd, "ping"
    {:ok, "pong"}
    iex> call cmd, "unknown"
    {:error, "unknown_method unknown"}
    iex> stop cmd
    true

  If passing and unknown or already stopped cmdid

    iex> call "nonvalid", "ping"
    {:error, :unknown_plugin}

    iex> {:ok, cmd} = start "serverboards.test.auth/fake", "test"
    iex> stop cmd
    iex> call cmd, "ping"
    {:error, :unknown_plugin}

  The method can be both a binary or a map, if the method is a map, it is a map
  in the form

      %{ "method" => "...", "params" => [ %{ "name" => "...", ...} ] }

  Then then params in the method definition are used to filter the passed `params`,
  and the method name is at `method`. This enables the use of simple method
  calls or more complex with a list of possible parameters, and then filter.
  Necessary for triggers with service config as values, for example.

    iex> {:ok, cmd} = start "serverboards.test.auth/fake", "test"
    iex> call cmd, %{ "method" => "pingm", "params" => [ %{ "name" => "message" } ] }, %{ "message" => "Pong", "ingored" => "ignore me"}
    {:ok, "Pong"}

  """
  def call(id, method, params, user) when is_binary(id) and is_binary(method) do
    {pid, uuid} =
      if String.contains?(id, "/") do
        case start(id, user) do
          {:ok, uuid} ->
            pid = GenServer.call(Serverboards.Plugin.Runner, {:get, uuid})
            {pid, uuid}

          other ->
            {other, nil}
        end
      else
        pid = GenServer.call(Serverboards.Plugin.Runner, {:get, id})
        {pid, id}
      end

    case pid do
      :not_found ->
        Logger.error("Could not find plugin id #{inspect(id)}: :not_found")
        {:error, :unknown_plugin}

      :exit ->
        {:error, :exit}

      %{pid: pid} when is_pid(pid) ->
        GenServer.cast(Serverboards.Plugin.Runner, {:ping, id})
        # Logger.debug("Plugin runner call #{inspect method}(#{inspect(params)})")
        case Serverboards.IO.Cmd.call(pid, method, params) do
          {:error, :exit} ->
            Logger.error("Unexpected exit process while calling #{id}.#{method}")
            # just exitted, mark it
            GenServer.call(Serverboards.Plugin.Runner, {:exit, uuid})
            {:error, :exit}

          {:error, :unknown_method} ->
            Logger.error("Could not call method #{inspect(method)} at #{inspect(id)}")
            {:error, [:unknown_method, method]}

          other ->
            other
        end

      other ->
        other
    end
  end

  # map version
  def call(id, %{"method" => method, "extra" => true}, defparams, user) when is_binary(id) do
    # If extra is true means that the method can get any extra parameter that is passed to it
    # This is necesary for example for send_notification where it may get many extra params
    # to fill as template
    call(id, method, defparams, user)
  end

  def call(id, %{"method" => method} = defcall, defparams, user) when is_binary(id) do
    # This version (no extra) filters which parameters to pass to the method.
    # Logger.debug("Call using map version: #{inspect defcall} // #{inspect defparams}")
    defparams = Map.new(Map.to_list(defparams) |> Enum.map(fn {k, v} -> {to_string(k), v} end))

    params =
      Map.get(defcall, "params", [])
      |> Enum.map(fn %{"name" => name} = param ->
        # this with is just to try to fetch in order or nil
        value =
          with :error <- Map.fetch(defparams, to_string(name)),
               :error <- Map.fetch(param, "default"),
               :error <- Map.fetch(param, "value") do
            nil
          else
            {:ok, value} -> value
          end

        {name, value}
      end)
      |> Map.new()

    call(id, method, params, user)
  end

  def call(id, method, params) do
    call(id, method, params, :system)
  end

  def call(id, method) do
    call(id, method, %{}, :system)
  end

  @doc ~S"""
  Simple call to do the full cycle of start a plugin, call a method and stop it.
  """
  def start_call_stop(command_id, method, params, user) do
    case start(command_id, user) do
      {:error, e} ->
        {:error, e}

      {:ok, uuid} ->
        res = call(uuid, method, params)
        stop(uuid)
        res
    end
  end

  # def cast(id, method, params, cont) do
  #  runner = Serverboards.Plugin.Runner
  #  case GenServer.call(runner, {:get, id}) do
  #    :not_found ->
  #      Logger.error("Could not find plugin id #{inspect id}: :not_found")
  #      cont.({:error, :unknown_method})
  #    cmd when is_pid(cmd) ->
  #      Serverboards.IO.Cmd.cast cmd, method, params, cont
  #  end
  # end

  def status(uuid) do
    GenServer.call(Serverboards.Plugin.Runner, {:status, uuid})
  end

  def ps() do
    GenServer.call(Serverboards.Plugin.Runner, {:ps})
  end

  ## server impl
  def init(:ok) do
    # Logger.info("Plugin runner ready #{inspect self()}")

    {:ok, method_caller} = Serverboards.Plugin.RPC.start_link()

    {:ok,
     %{
       method_caller: method_caller,
       # UUID -> %{ pid, component, timeout }
       running: %{},
       # component_id -> UUID, only last
       by_component_id: %{},
       timeouts: %{}
     }}
  end

  # only applicable to one_for_one
  defp drop_uuid(state, uuid) do
    :timer.cancel(state.timeouts[uuid])

    %{
      state
      | running: Map.drop(state.running, [uuid]),
        timeouts: Map.drop(state.timeouts, [uuid])
    }
  end

  def handle_call({:get_by_component_id, component_id}, _from, state) do
    ret =
      case Map.get(state.by_component_id, component_id, false) do
        false -> {:error, :not_found}
        uuid -> {:ok, uuid}
      end

    {:reply, ret, state}
  end

  def handle_call({:start, uuid, pid, component, user}, _from, state) do
    # Logger.debug("Component start #{component.id}")
    # get strategy and timeout
    {timeout, strategy} =
      case Map.get(component.extra, "strategy", "one_for_one") do
        "one_for_one" ->
          timeout = Serverboards.Utils.timespec_to_ms!(Map.get(component.extra, "timeout", "5m"))
          {timeout, :one_for_one}

        "singleton" ->
          timeout = Serverboards.Utils.timespec_to_ms!(Map.get(component.extra, "timeout", "5m"))
          {timeout, :singleton}

        "init" ->
          {:never, :init}
      end

    # prepare timeout
    state =
      if timeout != :never do
        {:ok, timeout_ref} = :timer.send_after(timeout, self(), {:timeout, uuid})
        # Logger.debug("new timer #{inspect timeout_ref} #{inspect timeout} #{inspect strategy}")
        %{state | timeouts: Map.put(state.timeouts, uuid, timeout_ref)}
      else
        state
      end

    # add entry to main running dict
    entry = %{
      pid: pid,
      component: component,
      timeout: timeout,
      strategy: strategy,
      user: user
    }

    state = %{state | running: Map.put(state.running, uuid, entry)}

    # if singleton or init, add to by component_id dict
    state =
      if strategy in [:singleton, :init] do
        %{state | by_component_id: Map.put(state.by_component_id, component.id, uuid)}
      else
        state
      end

    # all systems go
    {:reply, :ok, state}
  end

  def handle_call({:start, component, user}, from, state) do
    # it may come from partial or full component, just get the id
    plugin_id =
      case component.plugin do
        plugin when is_binary(plugin) -> plugin
        %{id: id} -> id
      end

    {res, state} =
      case Map.get(state.by_component_id, component.id, false) do
        false ->
          res = Plugin.Component.run(component)

          case res do
            {:ok, pid} ->
              require UUID
              uuid = UUID.uuid4()
              Logger.debug("Adding runner #{uuid} #{inspect(component.id)}")

              try do
                client = Serverboards.IO.Cmd.client(pid)

                MOM.RPC.Client.set(client, :plugin, %{
                  plugin_id: plugin_id,
                  component_id: component.id
                })

                # Call the start pt2, which updates the state
                {:reply, :ok, state} =
                  handle_call({:start, uuid, pid, component, user}, from, state)

                {{:ok, uuid}, state}
              catch
                :exit, _ ->
                  Logger.error("Command exitted unexpectedly: #{component.id}", command: component)

                  {{:error, :cant_run}, state}
              end

            {:error, {:timeout, _where}} ->
              Logger.error("Timeout starting plugin component #{inspect(component.id)}")
              {{:error, :timeout}, state}

            {:error, e} ->
              Logger.error(
                "Error starting plugin component #{inspect(component.id)}: #{inspect(e)}"
              )

              {{:error, e}, state}
          end

        uuid ->
          # Logger.debug("Already running: #{inspect component.id} / #{inspect uuid}")
          # delay this
          GenServer.cast(self(), {:ping, uuid})
          {{:ok, uuid}, state}
      end

    {:reply, res, state}
  end

  def handle_call({:stop, uuid}, _from, state) do
    entry = state.running[uuid]
    # Logger.debug("Stop plugin #{uuid}: #{inspect entry}")
    case entry do
      nil ->
        {:reply, {:error, :not_running}, state}

      :exit ->
        state = drop_uuid(state, uuid)
        {:reply, {:error, :exit}, state}

      %{strategy: :one_for_one} ->
        # Maybe remove from timeouts
        state = drop_uuid(state, uuid)

        {:reply, {:ok, entry.pid}, state}

      _ ->
        # Logger.debug("Will not stop plugin, strategy is #{entry.strategy}")
        {:reply, {:error, :cant_stop}, state}
    end
  end

  def handle_call({:method_caller}, _from, state) do
    {:reply, state.method_caller, state}
  end

  def handle_call({:get, id}, _from, state) do
    {:reply, Map.get(state.running, id, :not_found), state}
  end

  def handle_call({:status, id}, _from, state) do
    uuid =
      case Map.get(state.by_component_id, id, false) do
        false -> id
        uuid -> uuid
      end

    # Logger.debug("Running #{inspect id} #{inspect uuid}? // #{inspect state.by_component_id}")
    status =
      if Map.has_key?(state.running, uuid) do
        :running
      else
        :not_running
      end

    {:reply, status, state}
  end

  def handle_call({:exit, uuid}, _from, state) do
    state =
      case state.running[uuid] do
        nil ->
          state

        :exit ->
          state

        %{component: component} ->
          :timer.cancel(state.timeouts[uuid])

          state = %{
            state
            | running: Map.put(state.running, uuid, :exit),
              by_component_id: Map.drop(state.by_component_id, [component.id]),
              timeouts: Map.drop(state.timeouts, [uuid])
          }

          MOM.Channel.send(:plugin_down, %{uuid: uuid, id: component.id})
          :timer.send_after(60000, {:remove_uuid, uuid})
          state
      end

    {:reply, :ok, state}
  end

  def handle_call({:ps}, _from, state) do
    ps =
      for {uuid, p} when is_map(p) <- state.running do
        %{
          uuid: uuid,
          component: p.component.id,
          name: p.component.name,
          timeout: p.timeout,
          strategy: p.strategy,
          user: p.user
        }
      end

    {:reply, {:ok, ps}, state}
  end

  def handle_cast({:ping, uuid}, state) do
    # Logger.debug("ping #{inspect uuid }")
    case state.timeouts[uuid] do
      nil ->
        {:noreply, state}

      oldref ->
        {:ok, :cancel} = :timer.cancel(oldref)
        timeout = state.running[uuid].timeout
        {:ok, newref} = :timer.send_after(timeout, self(), {:timeout, uuid})
        # Logger.debug("update timer #{inspect oldref} -> #{inspect newref}")
        timeouts = Map.put(state.timeouts, uuid, newref)
        {:noreply, %{state | timeouts: timeouts}}
    end
  end

  def handle_info({:timeout, uuid}, state) do
    {entry, running} = Map.pop(state.running, uuid, nil)

    if entry do
      Logger.info(
        "Timeout process, stopping. #{inspect(uuid)} // #{inspect(entry.component.id)} #{
          inspect(entry.pid)
        }",
        uuid: uuid,
        timeout: entry.timeout,
        strategy: entry.strategy,
        component: entry.component.id
      )

      if Process.alive?(entry.pid) do
        Serverboards.IO.Cmd.stop(entry.pid)
      end

      by_component_id = Map.drop(state.by_component_id, [entry.component.id])

      timeouts = Map.drop(state.timeouts, [uuid])

      {:noreply,
       %{state | running: running, timeouts: timeouts, by_component_id: by_component_id}}
    else
      {:noreply, state}
    end
  end

  def handle_info({:remove_uuid, uuid}, state) do
    # Removes after 60s after a uuid failed, to return some {:error, :exit}, but not mem leak the uuid forever
    {:noreply, %{state | running: Map.drop(state.running, [uuid])}}
  end

  def handle_info(any, state) do
    Logger.warn("New unknown info #{inspect(any)}")
    {:noreply, state}
  end
end
