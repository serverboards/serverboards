defmodule Plugin.Component do
	@doc ~S"""
	Each of the components:

		iex> %Plugin.Component{id: "ls", name: "List files", type: "cmd", version: "0.0.1"}
		%Plugin.Component{id: "ls", name: "List files", type: "cmd", version: "0.0.1", description: "", extra: %{}}
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

defmodule Plugin do
	@doc ~S"""
	Base struct for all plugins. A plugin may have several components.

	Example of use:

		iex> %Plugin{id: "serverboards.ls", name: "List remote directory", author: "David Moreno", version: "0.0.1", description: "List all files on the remote server", url: "https://serverboards.io"}
		%Plugin{id: "serverboards.ls", name: "List remote directory", author: "David Moreno", version: "0.0.1", description: "List all files on the remote server", url: "https://serverboards.io", components: []}

		iex> %Plugin{}
		%Plugin{components: [], id: "", name: ""}

		iex> %Plugin{id: "serverboards.ls", components: [%Plugin.Component{id: "ls", extra: %{cmd: "ls"}}]}
		%Plugin{id: "serverboards.ls", components: [%Plugin.Component{id: "ls", extra: %{cmd: "ls"}}]}

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

end
