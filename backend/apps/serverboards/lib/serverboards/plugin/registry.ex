require Logger

defmodule Serverboards.Plugin.Registry do

  def start_link(options \\ []) do
    res = Agent.start_link(fn ->
      Logger.debug("Get plugins")
      {:ok, plugins} = Serverboards.Plugin.Parser.read_dir("test/data/plugins/")
      Logger.debug("Got plugins #{inspect plugins}")
      plugins
    end, options)

    {:ok, pid} = res
    plugins = Agent.get pid, &(&1)
    Logger.info("Starting plugin registry #{inspect pid}, got #{Enum.count plugins}")

    {:ok, pid}
  end
  def start_link(a,b,c) do
    Logger.info(inspect a)
    Logger.info(inspect b)
    Logger.info(inspect c)

    start_link
  end

  @doc ~S"""
  Gets component acording to some query from the general plugin registry.

  Can get by id or trait.

  ## Example

    iex> [auth] = filter_component id: "auth"
    iex> auth.id
    "auth"
    iex> [auth] = filter_component trait: "auth"
    iex> auth.id
    "auth"
    iex> filter_component trait: "XXX"
    []

  """
  def filter_component(registry, q) do
    import Enum
    alias Serverboards.Plugin.Component

    plugins = Agent.get registry, &(&1)

    #fields = q |> map(fn {k,_} -> k end)

    components = plugins |>
      flat_map(fn p -> # maps plugins to list of components that fit, or []
        p.components
          |> filter(fn c ->
            #Logger.debug("Check component #{inspect q }: #{inspect c} // #{inspect Map.take(c, fields)}")

            all? (for {k,v} <- q do
              case k do
                :id ->
                  Map.get(c, :id) == v
                :trait ->
                  member? Map.get(c, :traits), v
              end
            end)
          end)
          |> map(fn c ->
            %Component{ c | plugin: p}
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
  Looks for a specific component.

  ## Example

  Find it.

    iex> {:ok, rg} = start_link # Using custom registry
    iex> c = find(rg, "serverboards.auth.htpasswd/auth")
    iex> c.id
    "auth"
    iex> c.type
    "cmd"
    iex> c.plugin != nil
    true

  Dont find it. (using global registry)

    iex> find("serverboards.auth.htpasswd/authx")
    nil

  """
  def find(registry, id) do
    alias Serverboards.Plugin
    alias Serverboards.Plugin.Component

    # on the form .*/.*
    [_, plugin_id, component_id] = Regex.run(~r"^([^/]+)/([^/]+)$", id )

    plugins = Agent.get registry, &(&1)

    with %Plugin{} = plugin <- Enum.find(plugins, &(&1.id == plugin_id) ),
         %Plugin.Component{} = component <- Enum.find(plugin.components, &(&1.id == component_id) )
    do
       %Plugin.Component{ component | plugin: plugin }
    else
       nil
    end
  end

  # use application wide one
  def find(id) do
    find(Serverboards.Plugin.Registry, id)
  end

end
