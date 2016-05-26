require Logger

defmodule Serverboards.Plugin.Registry do

  def start_link(options \\ []) do
    {:ok, pid} = Agent.start_link(fn ->
      paths=Application.fetch_env! :serverboards, :plugin_paths
      plugins = Enum.flat_map paths, fn path ->
        path = Path.expand path
        case Serverboards.Plugin.Parser.read_dir(path) do
          {:ok, plugins} -> plugins
          {:error, err} ->
            Logger.error("Error loading plugin directory #{path}: #{inspect err}")
            []
        end
      end
      #Logger.debug("Got plugins #{inspect plugins}")
      plugins
    end, options)

    plugins = Agent.get pid, &(&1)
    Logger.info("Starting plugin registry #{inspect pid}, got #{Enum.count plugins}")

    {:ok, pid}
  end

  @doc ~S"""
  Gets component acording to some query from the general plugin registry.

  Can get by id or trait.

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
  def filter_component(registry, q) do
    import Enum
    alias Serverboards.Plugin.Component

    plugins = Agent.get registry, &(&1)
    #Logger.debug("Known plugins: #{inspect plugins}")
    Logger.debug("filter Q #{inspect q}")
    #fields = q |> map(fn {k,_} -> k end)

    components = plugins |>
      flat_map(fn p -> # maps plugins to list of components that fit, or []
        p.components
          |> filter(fn c ->
            #Logger.debug("Check component #{inspect q }: #{inspect c}")

            all? (for {k,v} <- q do
              case k do
                :id ->
                  Map.get(c, :id) == v
                :trait ->
                  member? Map.get(c, :traits), v
                :traits -> # any of the traits fit
                  any? v, &(&1 in Map.get(c, :traits))
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

  # use application wide one
  def filter_component(q) do
    filter_component(Serverboards.Plugin.Registry, q)
  end

  @doc ~S"""
  Looks for a specific component or plugin.

  ## Example

  Find it.

    iex> {:ok, rg} = start_link # Using custom registry
    iex> c = find(rg, "serverboards.test.auth/fake")
    iex> c.id
    "fake"
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
  def find(registry, id) do
    alias Serverboards.Plugin

    # on the form .*/.*
    case Regex.run(~r"^([^/]+)/([^/]+)$", id ) do
      nil ->
        case Regex.run(~r"^[^/]+$", id ) do
          nil ->
            nil
          [plugin_id] ->
            plugins = Agent.get registry, &(&1)
            Enum.find(plugins, &(&1.id == plugin_id) )
        end
      [_, plugin_id, component_id] ->
        plugins = Agent.get registry, &(&1)

        with %Plugin{} = plugin <- Enum.find(plugins, &(&1.id == plugin_id) ),
             %Plugin.Component{} = component <- Enum.find(plugin.components, &(&1.id == component_id) )
        do
           %Plugin.Component{ component | plugin: plugin }
        else
           nil
        end
    end
  end

  # use application wide one
  def find(id) do
    find(Serverboards.Plugin.Registry, id)
  end

  def list(registry) do
    Logger.warn("No permission checking for list of plugins. FIXME.")
    plugins = Agent.get registry, &(&1)
    Enum.reduce(plugins, %{}, fn plugin, acc ->
      components = Enum.reduce(plugin.components, %{}, fn component, acc ->
        Map.put(acc, component.id, %{
          id: component.id,
          name: component.name,
          type: component.type,
          traits: component.traits
          })
      end)
      Map.put(acc, plugin.id, %{
        version: plugin.version,
        name: plugin.name,
        id: plugin.id,
        author: plugin.author,
        description: plugin.description,
        components: components
        })
    end)
  end

  def list do
    list(Serverboards.Plugin.Registry)
  end

end
