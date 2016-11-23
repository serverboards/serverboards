require Logger

defmodule Serverboards.Utils.Template do
  @moustache_re ~r/{{.*}}/U

  def render(orig, nil) do
    {:ok, orig}
  end
  def render(orig, context) do
    res = Regex.replace(@moustache_re, orig, &re_find_and_replace(String.slice(&1, 2, String.length(&1)-4), context))
    {:ok, res}
  end

  def re_find_and_replace("", context) do # nice for debugging: {{}}
    inspect context
  end
  def re_find_and_replace(var, context) do
    res = String.split(var, ".")
      |> Enum.reduce(context, fn var, context ->
        re_find_and_replace_leaf(var, context)
      end)
    case res do
      txt when is_binary(txt) -> txt
      num when is_number(num) -> to_string(num)
      other -> inspect other
    end
  end

  def re_find_and_replace_leaf(var, nil) do
    "[UNKNOWN #{var}]"
  end
  def re_find_and_replace_leaf(var, s) when is_binary(s) do
    s
  end
  def re_find_and_replace_leaf(var, context) when is_map(context) do
    if Map.has_key?(context, var) do
      context[var]
    else # maybe context has atoms
      re_find_and_replace_leaf_atoms( var, context )
    end
  end
  def re_find_and_replace_leaf(var, context) when is_list(context) do
    if var in context do
      context[var]
    else # maybe context has atoms
      re_find_and_replace_leaf_atoms( var, context )
    end
  end
  def re_find_and_replace_leaf_atoms(var, context) do
    maybe_var = Enum.find(context, fn
        {k,v} when is_atom(k) ->
          if to_string(k) == var do
            v
          else
            nil
          end
        _ -> nil
      end)
    case maybe_var do
      nil -> "[UNKNOWN #{var}]"
      {_k, v} -> v
    end
  end
end
