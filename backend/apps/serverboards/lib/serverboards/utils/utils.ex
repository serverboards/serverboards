require Logger

defmodule Serverboards.Utils do
  @doc ~S"""
  Performs basic cleaning of a struct to convert it into a record, and remove
  private elements, including passwords.

  ## Example

    iex> import Logger
    iex> s= %{ :__ignore__ => "to be ignored", "__ignore_too__" => "to be ignored",
    ...>      :user_pw => "same", "user_pw" => "same", "valid" => "valid",
    ...>      :valid2 => :valid }
    iex> {:ok, json} = Poison.encode( clean_struct(s) )
    iex> Logger.info(json)
    iex> not String.contains? json, "__"
    true
    iex> not String.contains? json, "_pw"
    true

  """
  def clean_struct(%NaiveDateTime{} = datetime) do
    DateTime.to_iso8601(DateTime.from_naive!(datetime, "Etc/UTC"))
  end
  def clean_struct(%DateTime{} = datetime) do
    DateTime.to_iso8601(datetime)
  end
  def clean_struct(st) when is_map(st) do
    st = Map.to_list st
    l = Enum.flat_map st, fn {k,v} ->
      k = if is_atom(k) do
        to_string(k)
      else
        k
      end
      cond do
        k == "__struct__" -> []
        # Change to only skip __struct__ as other __*__ may be used internally.
        # This fixes CORE-365, problems when updating widgets; no __extractors__ after modify.
        # String.starts_with? k, "__" -> []
        String.ends_with? k, "_pw" -> []
        true -> [{k,clean_struct(v)}]
      end
    end
    Map.new(l)
  end
  def clean_struct(l) when is_list(l) do
    Enum.map(l, fn i -> clean_struct(i) end)
  end
  def clean_struct(other) do
    other
  end


  @doc ~S"""
  Drops elements from a map with an empty value
  """
  def drop_empty_values(map) do
    map
      |> Enum.filter(fn
        {_k, %{}} -> false
        {_k, []} -> false
        {_k,v} -> v != nil
      end)
      |> Map.new
  end

  @doc ~S"""
  Returns a string with table of the list of dicts (SQL style)
  """
  def table_layout([]) do
    ""
  end
  def table_layout(data) do
    import String
    import Map
    import Enum
    headers = (hd data)
      |> keys
      |> filter(&(not starts_with?(inspect(&1), ":__")))
    sheaders = headers
      |> map(&inspect/1)
    length=div(120, Enum.count(sheaders))
    lengths = map(headers, fn _ -> length end)

    header = table_layout_row(sheaders, lengths)

    rows = for row <- data do
      headers
        |> map(&(Map.get(row,&1)))
        |> map(&inspect/1)
        |> table_layout_row(lengths)
    end
    "\n" <> header <> "\n" <> join(rows, "\n")
  end

  defp table_layout_row(data, lengths) do
    import Enum
    import String
    join(map(zip(lengths,data), fn {l, d} ->
      if String.length(d) < l do
        pad_trailing(d, l)
      else
        String.slice(d, 0, l)
      end
    end), " | ")
  end

  @doc ~S"""
  Converts a string defining a tie interval to ms, or fails.
  """
  def timespec_to_ms!(timespec) when is_binary(timespec) do
    #Logger.debug(timespec)
    case Integer.parse(timespec) do
      {s, "ms"} -> s
      {s, "s"} -> s * 1000
      {s, "m"} -> s * 1000 * 60
      {s, "h"} -> s * 1000 * 60 * 60
      {s, "d"} -> s * 1000 * 60 * 60 * 24
      {s, "M"} -> s * 1000 * 60 * 60 * 24 * 30
      {s, "y"} -> s * 1000 * 60 * 60 * 24 * 365
    end
  end
  def timespec_to_ms!(timespec) when is_number(timespec) do
    timespec
  end


  @doc ~S"""
  Try to convert a key name to an atom from a list of valid atoms

  If its not there, the original string is returned.

  This is used at translation from external clients where dict keys are
  strings to internal representation where they are atoms.

  The list of valid atoms is actually a string list, as otherwise it would need
  to be translated to strings anyway.
  """
  def key_to_atom_from_list(k, []), do: k
  def key_to_atom_from_list(k, [k | _]), do: String.to_atom(k)
  def key_to_atom_from_list(k, [_ | rest]), do: key_to_atom_from_list(k, rest)

  @doc ~S"""
  Converts all keys from the original list to use atoms if they are at the atom list

  Uses key_to_atom_from_list

  First list is a list of {k,v} with a key string. Second is a list of strings
  of valid atoms.

  ```
    iex> keys_to_atoms_from_list([{"key", "value"}, {"nokey", "value"}], ~w"key other_key")
    [{:key, "value"}, {"nokey", "value"}]

    iex> keys_to_atoms_from_list(%{ "key" => "value", "nokey" => "value"}, ~w"key other_key")
    %{ :key => "value", "nokey" => "value"}

  ```
  """
  def keys_to_atoms_from_list(%{} = map, atom_list) do
    keys_to_atoms_from_list(map |> Map.to_list, atom_list)
      |> Map.new
  end
  def keys_to_atoms_from_list([], _), do: []
  def keys_to_atoms_from_list([{k,v} | rest], l) do
    [{key_to_atom_from_list(k, l), v}] ++ keys_to_atoms_from_list(rest, l)
  end


  @doc ~S"""
  Calculates the diff between two maps, returning only changed elements.

  Arrays are all the same, or all diferent. Maps only return changed keys;
  if there is a changed key in a submap, returns only the submap.

  If there is an item that disapeared, will have value nil.

  The idea is to have a merge(A, res) = B
  """
  def map_diff(a, a) do
    %{}
  end
  def map_diff(a, b) when is_map(a) and is_map(b) do
    ret = Enum.reduce(a, %{}, fn {ka, va}, acc ->
      vb = Map.get(b, ka, nil)
      acc = case map_diff(va, vb) do
        map when map == %{} ->
          acc
        other ->
          acc = Map.put(acc, ka, other)
          acc
      end
      acc
    end)
    ret
  end
  def map_diff(_a, nil) do
    nil
  end
  # any other means just get b
  def map_diff(_, b) do
    b
  end

  def map_get(map, []) do
    {:ok, map}
  end

  def map_get(nil, _) do
    {:ok, nil}
  end

  def map_get(map, [h | tail]) when is_number(h) do
    case Enum.fetch(map, h) do
      {:ok, rest} -> map_get(rest, tail)
      _ -> {:error, :not_found}
    end
  end
  def map_get(map, [h | tail]) do
    case Map.fetch(map, h) do
      {:ok, rest} -> map_get(rest, tail)
      _ -> {:error, :not_found}
    end
  end

  def map_get(map, q, defv) do
    case map_get(map, q) do
      {:ok, val} -> val
      {:error, _} -> defv
    end
  end
end
