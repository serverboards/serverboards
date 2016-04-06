defmodule Serverboards.Plugin.Component do
  defstruct [
    id: nil,
    name: nil,
    type: nil,
    traits: [],
    extra: %{},
    plugin: nil # only filled when out of plugin struct.
  ]


end
