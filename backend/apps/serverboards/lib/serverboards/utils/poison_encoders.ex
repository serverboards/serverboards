defimpl Poison.Encoder, for: Tuple do
  def encode(tuple, _options) do
    tuple
    |> Tuple.to_list()
    |> Poison.encode!
  end
end
