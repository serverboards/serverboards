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

  If none has the values, returns the default value, or an empty keyword list.

  The related Serverboards.Settings is the management interface for the db.

  Notes:

    * When geting from environment, the environment may have any capitalization,
      and everything will be lowercased.
  """
  def get(section, keyword, default) do
    get(section)[keyword] || default
  end
  def get(section, default \\ []) when is_atom(section) do
    # It merges from least important to more important, so that later is always
    # what stays.
    [
      get_env(section),
      get_ini(section),
      get_db(section),
      get_econfig(section),
      default,
    ] |> Enum.reduce([], &Keyword.merge/2)
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
      n -> case Integer.parse(v) do
        :error -> v
        {n, ""} -> n
        o -> o
      end
    end
  end

  @doc ~S"""
  Gets from the environment vars that start as SERVERBOARDS_section.
  """
  def get_env(section) do
    import String
    head = "serverboards_#{String.downcase(to_string(section))}_"
    head_length = String.length(head)
    System.get_env
      |> Map.to_list
      |> Enum.filter(fn {k,_v} -> starts_with?(downcase(k), head) end)
      |> Enum.map(fn {k,v} ->
          nk = k
            |> slice(head_length, 10000)
            |> downcase
            |> to_atom
          nv = parse_val(v)
          {nk, nv}
        end)
  end

  defp remove_comments(text) do
    {:ok, Regex.replace(~r/#.*?$/, text, "")}
  end

  def get_ini(section) do
    Application.get_env(:serverboards, :ini_files, [])
      |> Enum.map(&get_ini(&1, section))
      |> Enum.reduce([], &Keyword.merge/2)
  end
  def get_ini(tfilename, section) do
    {:ok, filename} = Serverboards.Utils.Template.render(tfilename, System.get_env)
    with {:ok, data_with_comments} <- File.read(filename),
      {:ok, data} <- remove_comments(data_with_comments),
      {:ok, kwlist} <- :eini.parse(data),
      l when is_list(l) <- kwlist[section] do
        l |> Enum.map(fn {k,v} -> {k, parse_val(v)} end)
    else
      error ->
        Logger.debug("Could not read from #{filename}: #{inspect error}")
        []
    end
  end

  def get_db(:database) do
    # Need to get out of the loop of getting the databse config from the database
    []
  end
  def get_db(section) do
    try do
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
  end

  def get_econfig(section) do
    case Application.fetch_env(:serverboards, section) do
      {:ok, data} -> data
      :error -> []
    end
  end
end
