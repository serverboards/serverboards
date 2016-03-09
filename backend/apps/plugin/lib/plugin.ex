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
end
