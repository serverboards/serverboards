defmodule Serverboards.Router.Basic do
	use GenServer
	defstruct pid: nil

	alias Serverboards.Router.Basic
	alias Serverboards.Router

	@doc ~S"""
	Starts the Router actor

		iex> {:ok, r} = Serverboards.Router.Basic.start_link()
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
			%Basic{
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
				{:ok, router} = Basic.start_link()
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

	defimpl Router, for: Basic  do
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
		exist, it creates them as Basic
		"""
		def addl(router, id, newrouter) do
			GenServer.call(router.pid, {:add, id, newrouter})
		end

		def call(router, method, params) do
			router = Router.lookup(router, method)
		end
	end
end
