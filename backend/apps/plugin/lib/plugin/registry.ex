require File
require Logger

defmodule Plugin.Registry do
	@doc ~S"""
	Reads all yaml from the given directory:

		iex> plugin = hd Plugin.Registry.read_dir("test")
		iex> plugin.author
		"David Moreno <dmoreno@serverboards.io>"
		iex> plugin.id
		"serverboards.example.ls"
		iex> plugin.version
		"0.0.1"
		iex> plugin.path
		"test/ls"
		iex> Plugin.Registry.find(plugin.id)
		plugin
		iex> Plugin.Registry.read_dir("test")
		iex> Plugin.Registry.find(plugin.id)
		plugin
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
				{:error, msg} ->
					Logger.error("Error loading plugin manifest at #{dirname}: #{msg}")
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

		iex> Plugin.Registry.read_dir("test")
		iex> example = Plugin.Registry.find("serverboards.example.ls")
		iex> example.path
		"test/ls"

	"""
	def find(id) do
		case :ets.lookup(:plugin_registry, id) do
			[{^id, plugin}] -> plugin
			[] -> :not_found
		end
	end


	defp listp(accum, :"$end_of_table") do
		accum
	end
	defp listp(accum, value) do
		listp(accum ++ [value], :ets.next(:plugin_registry, value))
	end

	@doc ~S"""
	Lists all known plugins

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

	@doc ~S"""
	Find a component by id:

		iex> Plugin.Registry.read_dir("test")
		iex> ls = Plugin.Registry.find_component("serverboards.example.ls/ls")
		iex> ls.id
		"ls"
		iex> ls.extra["cmd"]
		"./ls.py"

	"""
	def find_component(id) do
		 [plugin_id, component_id] = String.split(id, "/")
		 plugin=find(plugin_id)
		 component = Enum.find( plugin.components, nil, fn comp ->
			 comp.id == component_id
		 end)

		 component
	end
end
