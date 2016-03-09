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
		# Some helper functions to keep all tidy

		read_from_string = fn yaml ->
			try do
				{:ok, YamlElixir.read_from_string(yaml)}
			rescue e in MatchError ->
				{:error, :no_yaml, e}
			end
		end

		read_base_fields = fn data ->
			try do
				# decompose required fields
				%{"id" => id,
					"name" => name,
					"author" => author,
					"version" => version
					} = data

				# create basic plugin
				plugin = %Plugin{
						id: id,
						name: name,
						author: author,
						version: version,
					}
				{:ok, plugin, data}
			rescue e in MatchError ->
				{:error, :no_basic_fields, e}
			end
		end

		add_extra_fields = fn (plugin, data) ->
			description = data |> Map.get("description", "")

			plugin = %Plugin{ plugin | description: description }
			{:ok, plugin, data}
		end


		add_components = fn (plugin, data) ->
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

			components = data |> Map.get("components", [])
			try do
	 			components = (for n <- components, do: unstruct_component.(n))

				plugin = %Plugin{ plugin | components: components }
				{:ok, plugin, data}
			rescue e in MatchError ->
				{:error, :invalid_component, e}
			end
		end



		plugin =
		 with {:ok, data} <- read_from_string.(yaml),
					{:ok, plugin, data} <- read_base_fields.(data),
					{:ok, plugin, data} <- add_extra_fields.(plugin, data),
					{:ok, plugin, data} <- add_components.(plugin, data),
					do: {:ok, plugin}

		plugin
	end
end
