require Logger

defmodule Serverboards.Action do
  @moduledoc ~S"""
  Executes and tracks execution of actions.

  Actions can be manually triggered, or via a rule.

  Actions are method calls inside plugins, so it must first run the plugin,
  then execute the command, and shutdown the plugin.
  """
  alias Serverboards.{Plugin, Event}

  def start_link(options) do
    {:ok, _} = Serverboards.Action.RPC.start_link
    Agent.start_link fn -> %{} end, [name: Serverboards.Action] ++ options
  end

  @doc ~S"""
  Searchs for actions that fulfill this filter.

  ## Example

    iex> user = Serverboards.Test.User.system
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

    iex> user = Serverboards.Test.User.system
    iex> [%{id: action_id} | _rest ] = filter([trait: "test"], user)
    iex> {:ok, uuid} = trigger(action_id, %{ url: "https://serverboards.io" }, user)
    iex> String.length uuid
    36

  """
  def trigger(action_id, params, user) do
    Logger.info("Trigger action #{action_id} by #{inspect user}")
    action = Plugin.Registry.find(action_id)
    uuid = UUID.uuid4

    task = Task.start_link(fn ->
      Agent.update(Serverboards.Action, fn actions ->
        Map.put(actions, uuid, %{action: action_id, pid: self, params: params})
      end)
      Event.emit("action.started", %{uuid: uuid, name: action.name, id: action_id}, ["action.watch"] )
      command_id = "#{action.plugin.id}/#{action.extra["command"]}"

      {:ok, plugin} = Plugin.Runner.start( command_id )
      {ok, ret} = Plugin.Runner.call(plugin, action.extra["call"]["method"], params)

      Event.emit("action.stopped", %{uuid: uuid, name: action.name, id: action_id, result: ok}, ["action.watch"] )
      Agent.update(Serverboards.Action, fn actions ->
        Map.drop(actions, [uuid])
      end)
    end)

    {:ok, uuid}
  end

  @doc ~S"""
  Returns a list of currently running actions

    iex> user = Serverboards.Test.User.system
    iex> list = ps(user)
    iex> Enum.count list
    0
    iex> {:ok, _uuid} = trigger("serverboards.test.auth/action", %{ url: "https://serverboards.io", sleep: 1 }, user)
    iex> :timer.sleep 200
    iex> list = ps(user)
    iex> Enum.count list
    1

  """
  def ps(_user) do
    Agent.get(Serverboards.Action, &(&1))
      |> Enum.map( fn {uuid, %{ action: action_id, params: params } } ->
        component = Plugin.Registry.find(action_id)
        %{
          id: "#{component.plugin.id}/#{component.id}",
          name: component.name,
          plugin: component.plugin.id,
          params: component.extra["call"]["params"] |> Enum.map( fn param ->
            Map.put(param, :value, params[param["name"]])
          end),
          returns: component.extra["returns"]
        }
      end )
  end
end
