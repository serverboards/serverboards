require Logger

defmodule Serverboards.Plugin.Registry do
  def start_link do

    pid = Agent.start_link(fn ->
      {:ok, plugins} = Serverboards.Plugin.Parser.read_dir("test/data/plugins/")
      #Logger.debug("Got plugins #{inspect plugins}")
      plugins
    end)


    pid
  end

  @doc ~S"""
  Gets component acording to some query from the general plugin registry.

  Can get by id or trait.

  ## Example

    iex> {:ok, pid} = start_link
    iex> [auth] = filter_component pid, id: "auth"
    iex> auth.id
    "auth"
    iex> [auth] = filter_component pid, trait: "auth"
    iex> auth.id
    "auth"
    iex> filter_component pid, trait: "XXX"
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
end
