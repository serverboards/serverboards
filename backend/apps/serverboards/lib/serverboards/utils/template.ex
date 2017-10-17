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

  def render_map(orig, nil) do
    {:ok, orig}
  end
  def render_map(orig, context) when is_map(orig) do
    nmap = Enum.map( orig , fn {k,v} ->
      {:ok, nv} = render_map(v, context)
      {k, nv}
    end) |> Map.new
    {:ok, nmap}
  end
  def render_map(orig, context) when is_list(orig) do
    nlist = Enum.map( orig , fn v ->
      {:ok, nv} = render_map(v, context)
      nv
    end)
    {:ok, nlist}
  end
  def render_map(orig, context) when is_binary(orig), do: render( orig, context )
  def render_map(orig, context), do: {:ok, orig}

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
      :unknown_var -> "{{#{var}}}"
      other -> inspect other
    end
  end

  def re_find_and_replace_leaf(var, nil) do
    :unknown_var
  end
  def re_find_and_replace_leaf(var, :unknown_var) do
    :unknown_var
  end
  def re_find_and_replace_leaf(_var, s) when is_binary(s) do
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
      nil -> :unknown_var
      {_k, v} -> v
    end
  end
end
