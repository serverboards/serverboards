defmodule Serverboards.Plugin.Component do
	@doc ~S"""
	Each of the components:

		iex> alias Serverboards.Plugin
		iex> %Serverboards.Plugin.Component{id: "ls", name: "List files", type: "cmd", version: "0.0.1"}
		%Serverboards.Plugin.Component{id: "ls", name: "List files", type: "cmd", version: "0.0.1", description: "", extra: %{}}
	"""


	defstruct [
		id: "",
		name: "",
		type: "",
		version: "",
		description: "",
		extra: %{}
	]
end

defmodule Serverboards.Plugin do
	@doc ~S"""
	Base struct for all plugins. A plugin may have several components.

	Example of use:

		iex> alias Serverboards.Plugin
		iex> %Serverboards.Plugin{id: "serverboards.ls", name: "List remote directory", author: "David Moreno", version: "0.0.1", description: "List all files on the remote server", url: "https://serverboards.io"}
		%Serverboards.Plugin{id: "serverboards.ls", name: "List remote directory", author: "David Moreno", version: "0.0.1", description: "List all files on the remote server", url: "https://serverboards.io", components: []}

		iex> %Serverboards.Plugin{}
		%Serverboards.Plugin{components: [], id: "", name: ""}

		iex> %Serverboards.Plugin{id: "serverboards.ls", components: [%Serverboards.Plugin.Component{id: "ls", extra: %{cmd: "ls"}}]}
		%Serverboards.Plugin{id: "serverboards.ls", components: [%Serverboards.Plugin.Component{id: "ls", extra: %{cmd: "ls"}}]}

	"""

	defstruct [
		id: "",
		name: "",
		author: "",
		version: "",
		description: "",
		url: "",
		path: "",
		components: []
	]
	@doc ~S"""
	Searchs for a component inside the plugin.

	iex> plugin = hd Serverboards.Plugin.Registry.read_dir("test")
	iex> {:ok, component, rest} = Serverboards.Router.lookup(plugin, "ls.ls")
	iex> component.id
	"ls"
	iex> rest
	"ls"

	iex> plugin = hd Serverboards.Plugin.Registry.read_dir("test")
	iex> Serverboards.Router.lookup(plugin, "nonexistent.rest")
	{:error, :not_found}

	rest will be used at call as method name on the component
	"""
	def lookupl(plugin, fullidl) do
		case fullidl do
			[] -> plugin
			[ component_id | rest ] ->
				component = plugin.components |>
				first_f(&( &1.id == component_id ))
				case component do
					nil -> {:error, :not_found}
					c -> {:ok, c, rest}
				end
		end
	end

	defp first_f(list, f, default \\ nil) do
		case list do
			[] -> default
			[ head | tail] ->
				if f.(head) do
					head
				else
					first_f(tail, f, default)
				end
		end
	end
end


defimpl Serverboards.Router, for: Serverboards.Plugin do
	use Serverboards.Router.Basic

	def lookupl(a,b) do
		Serverboards.Plugin.lookupl(a,b)
	end
end
