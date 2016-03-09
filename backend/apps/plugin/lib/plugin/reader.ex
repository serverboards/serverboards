require Logger

defmodule Serverboards.Plugin.Reader do
	alias Serverboards.Plugin

	@doc ~S"""
	Parses a yaml file and returns a Plugin structure:

		iex> alias Serverboards.Plugin
		iex> {:ok, plugin} = Plugin.Reader.parse_yaml "id: serverboards.ls\nname: \"Ls\"\nauthor: \"David Moreno\"\nversion: 0.0.1\ncomponents:\n  - id: ls\n    name: ls\n    version: 0.0.1\n    cmd: ./ls\n"
		iex> plugin.id
		"serverboards.ls"
		iex> plugin.name
		"Ls"
		iex> plugin.version
		"0.0.1"
		iex> plugin.author
		"David Moreno"
		iex> hd(plugin.components).id
		"ls"
		iex> hd(plugin.components).extra
		%{ "cmd" => "./ls" }

	"""
	def parse_yaml(yaml) do
		try do
			plugin_unstruct = YamlElixir.read_from_string(yaml)

			# decompose required fields
			%{"id" => id,
				"name" => name,
				"author" => author,
				"version" => version
				} = plugin_unstruct

			description = plugin_unstruct |> Map.get("description", "")
			components = plugin_unstruct |> Map.get("components", [])

			# decomposes a map with the component data to a Plugin.Component struct
			unstruct_component = fn component_unstruct ->
				# decompose required fields
				%{"id" => id,
					"name" => name,
					"version" => version,
					} = component_unstruct

				# Add other elements to extra map.
				ignore = ~w(id name version)
				extra = Enum.reduce( component_unstruct, %{},
					fn (kv, extra) ->
						{k,v} = kv
						if not k in ignore do
							Map.put(extra, k, v)
						else
							extra
						end
					end)

				%Serverboards.Plugin.Component{
					id: id,
					name: name,
					version: version,
					extra: extra
				}
			end

			{:ok, %Plugin{
				id: id,
				name: name,
				author: author,
				version: version,
				description: description,
				components: (for n <- components, do: unstruct_component.(n))
			}}
		rescue MatchError ->
			{:error, "Invalid format"}
		end
	end
end
