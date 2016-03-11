require Logger

defmodule Serverboards do
	@doc ~S"""
	The router is in charge or routing messages using the message id to the receptor

	To achieve that there is a tree structure on which each node has a part in the
	dot separated address. Finally there is a structure as:

		- serverboards:BasicRouter
			- core:Router
			- plugins:BasicRouter
				- start:fn
				- stop:fn
			- example:Plugin
			- example:Plugin
		- ping:fn
		- version:fn

	BasicRouter is the type for the generic router, which has other routers or
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

		@doc ~S"""
		Performs a call into this router. It might lookup first what to call.
		"""
		def call(router, method, params)
	end

	@doc ~S"""
	Basic router implementation.
	"""
	defmodule BasicRouter do
		use GenServer
		defstruct pid: nil

		@doc ~S"""
		Starts the Router actor

			iex> {:ok, r} = Serverboards.BasicRouter.start_link()
			iex> Serverboards.Router.add(r, "serverboards.example", "test")
			iex> Serverboards.Router.lookup(r, "serverboards.example")
			{:ok, "test", ""}
			iex> {:ok, f, ""} = Serverboards.Router.lookup(r, "version")
			iex> f.([])
			"0.0.1"
			iex> {:ok, f, "and.more"} = Serverboards.Router.lookup(r, "version.and.more")
			iex> f.([])
			"0.0.1"
			iex> Serverboards.Router.lookup(r, "xversion.and.more")
			{:error, :not_found}

		"""
		def start_link(name \\ nil) do
			{:ok, r}=if name do
				GenServer.start_link(__MODULE__, %{}, [name: name])
			else
				GenServer.start_link(__MODULE__, %{})
			end
			#Logger.debug("Router ready")
			{:ok,
				%BasicRouter{
					pid: r
				}
			}
		end

		## Server callbacks

		def init(children \\ %{}) do
			# some predefined methods
			children=Map.merge(defaults, children)

			{:ok, %{ children: children }}
		end

		def defaults do
			%{
				"version" => fn [] -> "0.0.1" end,
				"ping" => fn [x] -> x end
			}
		end


		@doc ~S"""
		Adds a callback to the method registry
		"""
		def handle_call({:add, fullid, newchild}, _from, state) do
			[ id | rest ] = fullid

			newchild = if rest == [] do
					newchild
				else
					{:ok, router} = BasicRouter.start_link()
					Router.addl(router, rest, newchild)
					router
				end
			state = %{ state | children: Map.put(state.children, id, newchild) }
			 {:reply, :ok, state }
		end

		@doc ~S"""
		Looks for the registered element.

		FIXME Could be speed up using tasks; if the next lookup in chain takes some
		time this router is blocked.
		"""
		def handle_call({:lookup, fullid}, _from, state) do
			ret = case fullid do
				[] -> {:error, :not_found}
				[id] -> case state.children[id] do
					nil -> {:error, :not_found}
					x -> {:ok, x, tl fullid}
				end
				[ id | rest ] -> case state.children[id] do
					nil -> {:error, :not_found}
					x -> if is_map(x) do
						Router.lookupl(x, rest)
					else
						{:ok, x, rest}
					end
				end
			end
			{:reply, ret, state}
		end
	end

	defimpl Router, for: BasicRouter  do
		def lookup(router, id) do
			case lookupl(router, String.split(id, ".")) do
				{:ok, router, rest_idl} -> {:ok, router, Enum.join(rest_idl, ".")}
				error ->  error
			end
		end
		def add(router, id, newrouter) do
			addl(router, String.split(id, "."), newrouter)
		end

		def lookupl(router, id) do
			GenServer.call(router.pid, {:lookup, id})
		end

		@doc ~S"""
		Adds a new router to this router. If the intermediary routers do not
		exist, it creates them as BasicRouter
		"""
		def addl(router, id, newrouter) do
			GenServer.call(router.pid, {:add, id, newrouter})
		end

		def call(router, method, params) do
			router = Router.lookup(router, method)


		end
	end
end
