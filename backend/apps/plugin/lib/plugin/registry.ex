require File
require Logger

defmodule Serverboards.Plugin.Registry do
	alias Serverboards.Plugin

	@doc ~S"""
	Reads all yaml from the given directory:

		iex> alias Serverboards.Plugin
		iex> plugin = hd Plugin.Registry.read_dir("test")
		iex> plugin.author
		"David Moreno <dmoreno@serverboards.io>"
		iex> plugin.id
		"serverboards.example.ls"
		iex> plugin.version
		"0.0.1"
		iex> plugin.path
		"test/ls"
	"""
	def read_dir(dirname) do
		is_directory = fn (dirname, filename) ->
			fullpath="#{dirname}/#{filename}"
			case File.stat(fullpath) do
				{:ok, stat} -> stat.type == :directory
				_ -> false
			end
		end

		has_manifest = fn (dirname) ->
			fullpath="#{dirname}/manifest.yaml"
			case File.stat(fullpath) do
				{:ok, stat} -> stat.type == :regular
				_ -> false
			end
		end

		load_plugin_manifest = fn (dirname) ->
			yamlfile = dirname <> "/manifest.yaml"
			{:ok, yaml} = File.read(yamlfile)
			manifest = case Plugin.Reader.parse_yaml( yaml ) do
				{:error, code, _} ->
					Logger.error("Error loading plugin manifest at #{dirname}: #{inspect code}")
					nil
				{:ok, manifest} ->
					%{ manifest | path: dirname }
			end

			manifest
		end

		import Enum, only: [filter: 2, map: 2]

		{:ok, allfiles} = File.ls(dirname)
		plugins = allfiles
			|> filter(&is_directory.(dirname, &1))
			|> filter(&has_manifest.(dirname<>"/"<>&1))
			|> map(&load_plugin_manifest.(dirname<>"/"<>&1))
			|> filter(fn x -> case x do
					nil -> false
					_ -> true
				end end)

		ensure_plugin_registry_exists()
		for p <- plugins do
			add(p)
		end

		plugins
	end

	@doc ~S"""
	Adds a plugin to the registry
	"""
	def add(p) do
		case :ets.lookup(:plugin_registry, p.id) do
			{_, _} -> :ets.take(:plugin_registry, p.id)
			_ -> nil
		end

		:ets.insert(:plugin_registry, {p.id, p})
	end

	@doc ~S"""
	Finds a plugin by id:

		iex> alias Serverboards.Plugin
		iex> Plugin.Registry.read_dir("test")
		iex> example = Plugin.Registry.find_plugin("serverboards.example.ls")
		iex> example.path
		"test/ls"

	"""
	def find_plugin(id) do
		case :ets.lookup(:plugin_registry, id) do
			[{^id, plugin}] -> plugin
			[] -> :not_found
		end
	end

	@doc ~S"""
	Finds by id the plugin, component and method name.

	A full string as serverboards.example.ls.ls.ls might be
	refering to the full chain of plugin "serververboards.example.ls",
	component "ls" and method "ls" again.

		iex> alias Serverboards.Plugin
		iex> Plugin.Registry.read_dir("test")
		iex> {plugin, component, method_name} = Plugin.Registry.find("serverboards.example.ls.ls.ls")
		iex> plugin.id
		"serverboards.example.ls"
		iex> component.id
		"ls"
		iex> method_name
		"ls"

	A shortcut for this is be "serverboards.example.ls" where the
	last part is checked against component (same name as last part of plugin)
	and again against method.

		iex> alias Serverboards.Plugin
		iex> Plugin.Registry.read_dir("test")
		iex> {plugin, component, method_name} = Plugin.Registry.find("serverboards.example.ls")
		iex> plugin.id
		"serverboards.example.ls"
		iex> component.id
		"ls"
		iex> method_name
		"ls"

	This operation is slow, and should not be performed lightly.

		iex> alias Serverboards.Plugin
		iex> Plugin.Registry.read_dir("test")
		iex> Plugin.Registry.find("non_existant.id.method")
		:not_found

	Returns:
	 :not_found
	 {plugin, component, method_name}
	"""
	def find(id) do

		res = find_plugin(id, list())
		Logger.debug("Result: #{inspect res}")
		res
	end

	# recursive loop over list and check if id is the begining of the first
	# id in the list.

	# if so, check if its fully equal, and use component_id+method appropiately
	# calling to check for component+method, if no result, keep iterating
	defp find_plugin(id, []) do
		Logger.debug("Empty")
		:not_found
	end
	defp find_plugin(id, list) do
		inspect_id = hd list

		Logger.debug("Possible candidate for #{id}, #{inspect_id}?")
		if String.starts_with?(id, inspect_id) do

			cut_point = if id == inspect_id do
				rindex(id, ".")
			else
				String.length(inspect_id)+1
			end
			{_, component_method} = String.split_at(id, cut_point)
			Logger.debug("Looks good, #{inspect_id}/#{component_method}")

			plugin = find_plugin(inspect_id)

			case find_component(component_method, plugin.components) do
				{component, method} -> {plugin, component, method}
				:not_found -> find_plugin(id, tl list)
			end
		else
			find_plugin(id, tl list)
		end
	end

	# recursive loop to find for component on the given component list
	defp find_component(id, []) do
		:not_found
	end

	defp find_component(id, list) do
		inspect_id = hd(list).id
		Logger.debug("Possible component candidate for #{id}, #{inspect_id}?")

		if String.starts_with?(id, inspect_id) do
			Logger.debug("Found!")

			cut_point = if id == inspect_id do
				rindex(id, ".")
			else
				String.length(inspect_id)+1
			end
			{_, method_name} = String.split_at(id, cut_point)

			{(hd list), method_name}
		else
			find_component(id, tl list)
		end

	end

	~S"""
	Returns the following character of the first c found.
	"""
	defp rindex(str, c, 0) do
		0
	end
	defp rindex(str, c, n) do
		if String.at(str, n) == c do
			n + 1
		else
			rindex(str, c, n-1)
		end
	end

	defp rindex(str, c) do
		rindex(str, c, String.length( str ) )
	end


	defp listp(accum, :"$end_of_table") do
		accum
	end
	defp listp(accum, value) do
		listp(accum ++ [value], :ets.next(:plugin_registry, value))
	end

	@doc ~S"""
	Lists all known plugins

		iex> alias Serverboards.Plugin
		iex> Plugin.Registry.read_dir("test")
		iex> Plugin.Registry.clear()
		iex> Plugin.Registry.list()
		[]
		iex> Plugin.Registry.read_dir("test")
		iex> ls = Plugin.Registry.list()
		iex> length ls
		1

	"""
	def list() do
		ensure_plugin_registry_exists()
		listp([], :ets.first :plugin_registry)
	end

	@doc ~S"""
	Clears the registry. Will need a new call to `read_dir`

		iex> alias Serverboards.Plugin
		iex> Plugin.Registry.read_dir("test")
		iex> Plugin.Registry.clear()
		iex> Plugin.Registry.clear() # idempotent
		iex> Plugin.Registry.list()
		[]

	"""
	def clear() do
		try do
			:ets.delete(:plugin_registry)
		rescue ArgumentError ->
			nil
		end
	end

	@doc """
	Ensures the registry exists, just to avoid ArgumentError on :ets.xxx
	"""
	defp ensure_plugin_registry_exists do
		# fails if already exists, in this case insert new values
		try do
			:ets.new(:plugin_registry, [:named_table, :set, read_concurrency: true])
		rescue ArgumentError ->
			nil
		end
	end
end
