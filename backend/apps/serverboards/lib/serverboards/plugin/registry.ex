require Logger

defmodule Serverboards.Plugin.Registry do
  use GenServer

  def start_link(options \\ []) do
    {:ok, pid} = GenServer.start_link(__MODULE__, [], [name: Serverboards.Plugin.Registry] ++ options)

    {:ok, pid}
  end

  @doc ~S"""
  Load all plugin description from manifests.
  """
  def load_plugins() do
    paths = Application.fetch_env! :serverboards, :plugin_paths
    paths = case System.get_env("SERVERBOARDS_PATH") do
      nil ->
        paths ++ [Path.join(System.get_env("HOME"), ".local/serverboards/plugins")]
      serverboards_path ->
        paths ++ [Path.join(serverboards_path, "plugins")]
    end
    plugins = Enum.flat_map paths, fn path ->
      path = Path.expand path
      Logger.debug("Loading plugins from #{inspect path}")
      case Serverboards.Plugin.Parser.read_dir(path) do
        {:ok, plugins} -> plugins
        {:error, err} ->
          Logger.error("Error loading plugin directory #{path}: #{inspect err}")
          []
      end
    end
    plugins
  end

  @doc ~S"""
  Reload all plugin data. Normally called from the inotify watcher
  """
  def reload_plugins do
    GenServer.cast(Serverboards.Plugin.Registry, {:reload})
  end

  def active_plugins do
    GenServer.call(Serverboards.Plugin.Registry, {:get_active})
  end

  def all_plugins do
    GenServer.call(Serverboards.Plugin.Registry, {:get_all})
  end

  @doc ~S"""
  Gets component acording to some query from the general plugin registry.

  Can get by id or trait.

  Trait can be :none for component without traits

  ## Example

    iex> [auth] = filter_component id: "fake"
    iex> auth.id
    "serverboards.test.auth/fake"
    iex> [auth] = filter_component trait: "auth"
    iex> auth.id
    "serverboards.test.auth/fake"
    iex> [auth] = filter_component traits: ["anything", "auth"]
    iex> auth.id
    "serverboards.test.auth/fake"
    iex> [auth] = filter_component trait: "auth", id: "fake"
    iex> auth.id
    "serverboards.test.auth/fake"
    iex> filter_component trait: "XXX"
    []

  """
  def filter_component(q) do
    import Enum
    alias Serverboards.Plugin.Component

    components = active_plugins |>
      flat_map(fn p -> # maps plugins to list of components that fit, or []
        p.components
          |> filter(fn c ->
            #Logger.debug("Check component #{inspect q }: #{inspect c}")

            all? (for {k,v} <- q do
              case k do
                :id ->
                  cid = Map.get(c, :id)
                  (cid == v) or (v == ("#{p.id}/#{cid}"))
                :trait ->
                  member? Map.get(c, :traits), v
                :traits -> # any of the traits fit
                  if v == :none do
                    Map.get(c, :traits) == []
                  else
                    any? v, &(&1 in Map.get(c, :traits))
                  end
                :type ->
                  Map.get(c, :type) == v
              end
            end)
          end)
          |> map(fn c ->
            %Component{ c | plugin: p.id, id: "#{p.id}/#{c.id}" }
          end)
      end)
    #Logger.debug("Filter #{inspect q }: #{inspect components}")
    components
  end

  @doc ~S"""
  Looks for a specific component or plugin.

  ## Example

  Find it.

    iex> c = find("serverboards.test.auth/fake")
    iex> c.id
    "serverboards.test.auth/fake"
    iex> c.type
    "cmd"
    iex> c.plugin != nil
    true

  Dont find it. (using global registry)

    iex> find("serverboards.test.auth/authx")
    nil
    iex> find("serverboards.test.authx/fake")
    nil

  Look for plugin

    iex> plugin = find("serverboards.test.auth")
    iex> (Enum.count plugin.components) > 0
    true

  """
  def find(id) do
    alias Serverboards.Plugin

    # on the form .*/.*
    case Regex.run(~r"^([^/]+)/([^/]+)$", id ) do
      nil ->
        case Regex.run(~r"^[^/]+$", id ) do
          nil ->
            nil
          [plugin_id] ->
            Enum.find(active_plugins, &(&1.id == plugin_id) )
        end
      [_, plugin_id, component_id] ->
        with %Plugin{} = plugin <- Enum.find(active_plugins, &(&1.id == plugin_id) ),
             %Plugin.Component{} = component <- Enum.find(plugin.components, &(&1.id == component_id) )
        do
           %Plugin.Component{ component | plugin: plugin, id: "#{plugin.id}/#{component.id}" }
        else
           nil
        end
    end
  end

  def is_plugin_active( id ) do
    (
      String.starts_with?(id, "serverboards.core") ||
      Serverboards.Plugin.Data.data_get(id, "is_active", true)
    )
  end

  def list() do
    Logger.warn("No permission checking for list of plugins. FIXME.")
    Enum.reduce(all_plugins, %{}, fn plugin, acc ->
      components = Enum.reduce(plugin.components, %{}, fn component, acc ->
        Map.put(acc, component.id, %{
          id: component.id,
          name: component.name,
          type: component.type,
          traits: component.traits,
          description: component.description
          })
      end)
      Map.put(acc, plugin.id, %{
        version: plugin.version,
        name: plugin.name,
        id: plugin.id,
        author: plugin.author,
        description: plugin.description,
        url: plugin.url,
        is_active: plugin.is_active,
        components: components
        })
    end)
  end


  ## server impl, jsut stores state
  def init([]) do
    Serverboards.Plugin.Monitor.start_link

    GenServer.cast(self, {:reload})
    {:ok, %{ active: [], all: []}}
  end

  def decorate_plugin(p) do
    %{
      p |
      is_active: is_plugin_active(p.id)
    }
  end

  def handle_cast({:reload}, _status) do
    all_plugins = load_plugins
      |> Enum.map(&decorate_plugin/1)

    {:noreply, %{
      all: all_plugins,
      active: Enum.filter(all_plugins, &(&1.is_active))
      }}
  end

  def handle_call({:get_all}, _from, state) do
    {:reply, state.all, state}
  end
  def handle_call({:get_active}, _from, state) do
    {:reply, state.active, state}
  end

end
