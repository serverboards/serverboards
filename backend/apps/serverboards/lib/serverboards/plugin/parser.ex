require Logger

defmodule Serverboards.Plugin.Parser do

  @doc ~S"""
  Parses a component dict (from yaml) into a Component struct.

  ## Examples

  Full parse:

    iex> Serverboards.Plugin.Parser.parse_component(%{ "id" => "test", "name" => "mytest", "type" => "iocmd", "traits" => "test one", "other" => "Other"})
    %Serverboards.Plugin.Component{ id: "test", name: "mytest", type: "iocmd", traits: ["test","one"], extra: %{ "other" => "Other" }}

  Only some fields:

    iex> Serverboards.Plugin.Parser.parse_component(%{ "id" => "test"})
    %Serverboards.Plugin.Component{ id: "test"}

  """
  def parse_component(%{} = dict) do
    %Serverboards.Plugin.Component{
      id: Map.get(dict, "id"),
      name: Map.get(dict, "name"),
      type: Map.get(dict, "type"),
      traits: String.split(Map.get(dict, "traits","")," ", trim: true),
      extra: Map.drop(dict, ~w(id name type traits))
    }
  end


  @doc ~S"""
  Parses a dict that describes a plugin into a plugin struct.

  ## Example

    iex> Serverboards.Plugin.Parser.parse(%{ "id" => "test", "name" => "mytest", "components" => [
    ...>    %{ "id" => "test_A", "name" => "mytest", "type" => "iocmd", "traits" => "test one", "other" => "Other"},
    ...>    %{ "id" => "test_B", "name" => "othertest", "type" => "iocmd", "traits" => "auth"}
    ...>  ]
    ...>  })
    %Serverboards.Plugin{author: nil,
      components: [
        %Serverboards.Plugin.Component{
          extra: %{"other" => "Other"}, id: "test_A", name: "mytest",
          traits: ["test", "one"], type: "iocmd"
          },
       %Serverboards.Plugin.Component{
          extra: %{}, id: "test_B", name: "othertest", traits: ["auth"],
          type: "iocmd"
      }],
      description: nil, extra: %{}, id: "test",
      name: "mytest", version: nil
    }
  """
  def parse(%{} = dict) do
    components = Enum.map( Map.get(dict, "components", []), &parse_component(&1) )

    %Serverboards.Plugin{
      id: Map.get(dict, "id"),
      name: Map.get(dict, "name"),
      description: Map.get(dict, "description"),
      author: Map.get(dict, "author"),
      version: Map.get(dict, "version"),

      components: components,

      extra: Map.drop(dict, ~w(id name description author version components))
    }
  end

  @doc ~S"""
  Given a string with yaml data, parses it into a plugin struct.

  ## Examples
    iex> {:ok, plugin} = Serverboards.Plugin.Parser.parse_yaml "id: serverboards.ls\nname: \"Ls\"\nauthor: \"David Moreno\"\nversion: 0.0.1\ncomponents:\n  - id: ls\n    name: ls\n    cmd: ./ls\n"
    iex> plugin.id
    "serverboards.ls"
    iex> (hd plugin.components).id
    "ls"

  """

  def parse_yaml(yaml) do
    try do
      data = YamlElixir.read_from_string(yaml)
      plugin = parse(data)
      {:ok, plugin}
    catch
      {:yamerl_exception, [
        {:yamerl_parsing_error, :error, msg, line, column, _, _ , _} | _]} ->
          {:error, "#{line}:#{column} #{msg}"}
      e ->
        Logger.debug("Error loading yaml. #{inspect e}")
        {:error, e}
    end
  end

  @doc ~S"""
  Reads a plugin yaml from a file.

  ## Examples

    iex> {:ok, plugin} = Serverboards.Plugin.Parser.read("test/data/plugins/test/manifest.yaml")
    iex> plugin.id
    "serverboards.auth.htpasswd"

    iex> Serverboards.Plugin.Parser.read("test/data/plugins/invalid/manifest.yaml")
    {:error, :invalid_yaml}

    iex> Serverboards.Plugin.Parser.read("test/data/non-existant.yaml")
    {:error, :enoent}
  """
  def read(filename) do
    ret = with {:ok, data} <- File.read(filename),
      {:ok, plugin} <- parse_yaml( data ),
      do: {:ok, plugin}
    case ret do
      {:ok, v} -> {:ok, v}
      {:error, :enoent} ->
        {:error, :enoent}
      {:error, v} when is_binary(v) ->
        Logger.error("Error loading yaml file #{filename}:#{v}")
        {:error, :invalid_yaml}
    end
  end

  @doc ~S"""
  At that directory, checks all subdirectories with manifest.yaml file and
  return a list with the plugin descriptions.


  ## Example

    iex> {:ok, plugins} = read_dir("test/data/plugins/")
    iex> Enum.count plugins
    1
    iex> (hd plugins).id
    "serverboards.auth.htpasswd"

    iex> read_dir("test/data/invalid/")
    {:error, :enoent}

  """
  def read_dir(dirname) do
    is_directory = fn (dirname, filename) ->
      fullpath="#{dirname}/#{filename}"
      case File.stat(fullpath) do
        {:ok, stat} -> stat.type == :directory
        _ -> false
      end
    end

    has_manifest = fn (dirname) ->
      fullpath="#{dirname}/manifest.yaml"
      case File.stat(fullpath) do
        {:ok, stat} -> stat.type == :regular
        _ -> false
      end
    end

    import Enum
    case File.ls(dirname) do
      {:ok, allfiles} ->
        plugins = allfiles
            |> filter(&is_directory.(dirname, &1))
            |> filter(&has_manifest.(dirname<>"/"<>&1))
            |> map(&{read("#{dirname}/#{&1}/manifest.yaml"), &1}) # returns {{:ok, plugin}, midpath}
            |> filter(fn
                {{:ok, _}, _} -> true
                _ -> false
                end)
            |> map(fn {{:ok, p}, midpath} ->
              %Serverboards.Plugin{ p | path: "#{dirname}/#{midpath}" } # set plugin dirname
            end)

        {:ok, plugins}
      e ->
        e
    end
  end
end
