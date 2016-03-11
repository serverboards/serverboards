require Logger

defmodule Serverboards do
	@doc ~S"""
	The router is in charge or routing messages using the message id to the receptor

	To achieve that there is a tree structure on which each node has a part in the
	dot separated address. Finally there is a structure as:

		- serverboards:Router.Basic
			- core:Router
			- plugins:Router.Basic
				- start:fn
				- stop:fn
			- example:Plugin
			- example:Plugin
		- ping:fn
		- version:fn

	Router.Basic is the type for the generic router, which has other routers or
	functions, but other types of routers can ge created, for example the plugin
	one, that will do the remaining of the id as a call to an RPC.

	Names can be repeated and they will be tried in registration order if
	:method_not_implemented error is returned.

	This helps composability depending on permissions; for each connection the
	allowed methods are added to this connection router. The same router can
	be added to several routers.

	Rotuers must be structs/maps with the key is_router: true. Thats the no stop
	mark for router lookups.
	"""
	defprotocol Router do
		@doc ~S"""
		Searchs for an element by id.

		In case of success returns both the router that is the leaf for this
		id, and the rest of the id, to be able to perform calls.

		Returns:
			{:error, :not_found}
			{:ok, element, rest_id}
		"""
		def lookup(router, id)

		@doc ~S"""
		Same as lookup, but uses a list.

		Normally this is the desired implementation, the other one the interface.

			lookupl(router, ["serverboards", "example", "ls"])

		Returns the rest_id as list as well.
		"""
		def lookupl(router, id)

		@doc ~S"""
		Adds a router to this one.
		"""
		def add(router, id, newrouter)

		@doc ~S"""
		Adds a router to this one.

		List interface.
		"""
		def addl(router, id, newrouter)
	end
end
