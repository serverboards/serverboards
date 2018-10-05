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
    traits = case Map.get(dict, "traits") do
      nil ->
        []
      str when is_binary(str) ->
        String.split(str," ", trim: true)
    end

    %Serverboards.Plugin.Component{
      id: Map.get(dict, "id"),
      name: Map.get(dict, "name"),
      type: Map.get(dict, "type"),
      traits: traits,
      description: Map.get(dict, "description"),
      extra: Map.drop(dict, ~w(id name type traits description))
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
      name: "mytest", version: nil, tags: ["core"]
    }
  """
  def parse(%{} = dict) do
    components = Enum.map( Map.get(dict, "components", []), &parse_component(&1) )

    id = Map.get(dict, "id")
    path = Map.get(dict, "path", "")
    is_core = not String.starts_with?(path, Serverboards.Config.serverboards_path)
    # rw_path = File.stat!(path).access == :read_write
    tags = if is_core do
      is_optional = String.contains?(id, "optional")
      if is_optional do
        ["core", "optional"]
      else
        ["core"]
      end
    else
      ["optional"]
    end
      # rw_path and

    %Serverboards.Plugin{
      id: id,
      name: Map.get(dict, "name"),
      description: Map.get(dict, "description"),
      author: Map.get(dict, "author"),
      version: Map.get(dict, "version"),
      url: Map.get(dict, "url"),
      enabled: Map.get(dict, "enabled", true),
      tags: tags,

      components: components,

      extra: Map.drop(dict, ~w(id name description author version url components))
    }
  end

  @doc ~S"""
  Given a string with yaml data, parses it into a plugin struct.

  ## Examples
    iex> {:ok, plugin} = Serverboards.Plugin.Parser.parse_yaml "id: serverboards.ls\nname: \"Ls\"\nauthor: \"David Moreno\"\nversion: 0.0.1\ncomponents:\n  - id: ls\n    name: ls\n    cmd: ./ls\n"
    iex> plugin["id"]
    "serverboards.ls"
    iex> (hd plugin["components"])["id"]
    "ls"

  """

  def parse_yaml(yaml, filename \\ "") do
    try do
      data = YamlElixir.read_from_string(yaml)
      {:ok, data}
    catch
      {:yamerl_exception, [
        {:yamerl_parsing_error, :error, msg, line, column, _, _ , _} | _]} ->
          {:error, "#{line}:#{column} #{msg}"}
      e ->
        Logger.debug("Error loading yaml. #{inspect e}")
        {:error, e}
      :exit, {_reason, _where} ->
        Logger.debug("Error loading yaml. yamlr exited.")
        {:error, :exit}
    rescue
      e in CaseClauseError->
        %{ term: term } = e
        { _, _, _, where, _} = term
        line=where[:line]
        column=where[:column]
        Logger.error("Error loading yaml. Bad formed #{filename}:#{line}:#{column}")
        {:error, :bad_formed}
      _e in FunctionClauseError ->
        Logger.error("Error loading yaml. Bad formed #{filename}")
        {:error, :bad_formed}
    end
  end

  @doc ~S"""
  Reads a plugin yaml from a file.

  ## Examples

    iex> {:ok, plugin} = Serverboards.Plugin.Parser.load_plugin("test/data/plugins/auth/")
    iex> plugin.id
    "serverboards.test.auth"

    iex> Serverboards.Plugin.Parser.load_plugin("test/data/plugins/invalid/")
    {:error, :invalid_yaml}

    iex> Serverboards.Plugin.Parser.load_plugin("test/data/")
    {:error, :enoent}
  """
  def load_plugin(dirname) do
    ret = with {:ok, data}  <- File.read("#{dirname}/manifest.yaml"),
          {:ok, extra}      <- {:ok, Serverboards.Utils.value_or(File.read("#{dirname}/.extra.yaml"), "{}")},
          {:ok, data_yaml}  <- parse_yaml( data, "#{dirname}/manifest.yaml" ),
          {:ok, extra_yaml} <- parse_yaml( extra, "#{dirname}/.extra.yaml" )
    do
      manifest = data_yaml |> Map.merge(extra_yaml) |> Map.merge(%{"path" => dirname})
      plugin = parse(manifest)
      {:ok, plugin}
    else
      {:error, :enoent} ->
        {:error, :enoent}
      {:error, :bad_formed} ->
        {:error, :bad_formed}
      {:error, v} when is_binary(v) ->
        Logger.error("Error loading plugin at #{dirname}/manifest.yaml:#{v}")
        {:error, :invalid_yaml}
    end
  end

  @doc ~S"""
  At that directory, checks all subdirectories with manifest.yaml file and
  return a list with the plugin descriptions.


  ## Example

    iex> {:ok, plugins} = read_dir("test/data/plugins/")
    iex> Enum.count plugins
    2
    iex> (hd Enum.sort(plugins)).id
    "test.extractor"

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

    is_valid_dirname = fn (dirname) ->
      cond do
        String.starts_with?(dirname, "__") -> false
        String.starts_with?(dirname, ".") -> false
        true -> true
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
            |> filter(&is_valid_dirname.(&1))
            |> filter(&has_manifest.(dirname<>"/"<>&1))
            |> map(&{load_plugin("#{dirname}/#{&1}/"), &1}) # returns {{:ok, plugin}, midpath}
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
