require Logger

defmodule Serverboards.Config do
  @moduledoc ~S"""
  Centralizes all configuration data.

  It may access an environmental var, a system default ini file, or from database,
  in that order.

  Always returns a keyword list with the values.

  Shell data is set as:

  ```shell
  export SERVERBOARDS_section_value=myvalue
  export SERVERBOARDS_section_value2=myvalue2
  ```

  or from the ini file:

  ```ini
  [section]
  value = myvalue
  value2 = myvalue2
  ```

  or from database.

  `get(:section)` would return `[value: myvalue, value2: myvalue2]`

  If none has the values, returns the default value, or an empty keyword listº.

  The related Serverboards.Settings is the management interface for the db.

  Notes:

    * When geting from environment, the environment may have any capitalization,
      and everything will be lowercased.
  """
  def get(section, keyword, default) when is_atom(section) and is_atom(keyword) do
    Keyword.get( get(section), keyword, default)
  end
  def get(section, keyword, default) when is_atom(section) and is_binary(keyword) do
    get(section, String.to_atom(keyword), default)
  end
  def get(section, keyword, default) when is_binary(section) do
    get(String.to_atom(section), keyword, default)
  end

  def get(section, default \\ []) when is_atom(section) do
    # It merges from more important to least important, so that former is always
    # what stays.
    value = Serverboards.Utils.Cache.get({:config, section}, fn ->
      [
        get_env(section),
        get_db(section),
        get_ini(section),
        get_econfig(section),
      ] |> Enum.reduce([], &Keyword.merge/2)
        |> Enum.map(fn {k,v} -> {k, parse_val(v)} end) # use proper vals. Here at the end to allow null values
    end, ttl: 60_000)

    value ++ default
  end

  @doc ~S"""
  Returns the config as a string map.

  In some situations we do not want to have atoms as keys, but strings,
  and not a keyword object, but a map.
  """
  def get_map(section) do
    get(section, [])
      |> Enum.map(fn {k,v} -> {to_string(k), v} end)
      |> Map.new()
  end

  @doc ~S"""
  Returns the configured serverboards path.

  This can be set at environment, at .ini or calculated from home
  """
  def serverboards_path do
    path = case System.get_env("SERVERBOARDS_PATH") do
      nil ->
        case get(:global, "home", nil) do
          nil ->
            Path.join(System.get_env("HOME"), ".local/serverboards/")
          path -> path
        end
      path -> path
    end
    {:ok, path} = Serverboards.Utils.Template.render(path, System.get_env)
    path
  end

  def parse_val(v) do
    case v do
      "true" -> true
      "false" -> false
      "" -> nil
      "nil" -> nil
      "null" -> nil
      "none" -> nil
      "\""<>s -> if String.ends_with?(s, "\"") do String.slice(s, 0, String.length(s)-1) else v end
      "\'"<>s -> if String.ends_with?(s, "\'") do String.slice(s, 0, String.length(s)-1) else v end
      n when is_binary(n)-> case Integer.parse(v) do
        :error -> v
        {n, ""} -> n
        o -> n
      end
      o -> o # normally for default values
    end
  end

  @doc ~S"""
  Gets from the environment vars that start as SERVERBOARDS_section.
  """
  def get_env(section) do
    import String
    head = "serverboards_#{String.downcase(to_string(section))}_"
    head_length = String.length(head)
    System.get_env()
      |> Map.to_list
      |> Enum.filter(fn {k,_v} -> starts_with?(downcase(k), head) end)
      |> Enum.map(fn {k,v} ->
          nk = k
            |> slice(head_length, 10000)
            |> downcase
            |> to_atom
          {nk, v}
        end)
  end

  defp remove_comments(text) do
    {:ok, Regex.replace(~r/#.*/, text, "")}
  end

  defp simplify_sections(text) do
    {:ok, Regex.replace(~r/\[.*\]/, text, &String.replace(&1, "/", "--"))}
  end

  def ini_files() do
    case System.get_env("SERVERBOARDS_INI") do
      nil ->
        files = Application.get_env(:serverboards, :ini_files, [])
        files
      ini_file ->
        [ini_file]
    end
  end

  def get_ini(section) when is_binary(section) do
    get_ini(String.to_atom(section))
  end
  def get_ini(section) do
    section = String.to_atom(String.replace(Atom.to_string(section), "/", "--"))
    ini_files()
      |> Enum.map(&get_iniw(&1, section))
      |> Enum.reduce([], &Keyword.merge/2)
  end
  def get_iniw(wfilename, section) do
    {:ok, wfilename} = Serverboards.Utils.Template.render(wfilename, System.get_env)
    if String.contains?(wfilename,"{") do
      []
    else
      wfilename
        |> Path.wildcard
        |> Enum.map(&get_ini(&1, section))
        |> Enum.reduce([], &Keyword.merge/2)
    end
  end
  def get_ini(filename, section) do
    # Logger.debug("Get #{inspect section}")
    with {:ok, data_with_comments} <- File.read(filename),
      {:ok, data_without_comments} <- remove_comments(data_with_comments),
      {:ok, data} <- simplify_sections(data_without_comments),
      {:ok, kwlist} <- :eini.parse(data),
      l when is_list(l) <- kwlist[section] do
        # Logger.debug("Got #{inspect section}: #{inspect l}")
        l
    else
      nil -> # empty, not a real error
        []
      error ->
        Logger.warn("Could not read from #{filename}: #{inspect error}")
        []
    end
  end

  def get_db(:database) do
    # Need to get out of the loop of getting the databse config from the database
    []
  end
  def get_db(section) do
    ret = try do
      case Serverboards.Settings.get(to_string(section)) do
        {:ok, val} ->
          val |> Map.to_list |> Enum.map(fn {k,v} -> {String.to_atom(k), v} end )
        {:error, _} -> []
      end
    catch
      :error, _ ->
        Logger.error("Error DB not ready getting info for section #{inspect section}")
        []
    end
    #Logger.debug("#{inspect section}: #{inspect ret}")
    ret
  end

  def get_econfig(section) do
    case Application.fetch_env(:serverboards, section) do
      {:ok, data} -> data
      :error -> []
    end
  end
end
