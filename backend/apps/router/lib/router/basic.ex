require Logger

defmodule Serverboards.Router.Basic do
	@moduledoc ~S"""
	Basic router. Also base implementation for other routers, so not all methods
	have to be reimplemented:

		defimpl Serverboards.Router, for: MyRouter do
			use Serverboards.RouterBasic
		end
	"""
	use GenServer
	defstruct pid: nil

	alias Serverboards.Router.Basic
	alias Serverboards.Router


	defmacro __using__([]) do
		quote location: :keep do
			@doc ~S"""
			Looks for element by dot separated name
			"""
			def lookup(router, id) do
				case Serverboards.Router.lookupl(router, String.split(id, ".")) do
					{:ok, router, rest_idl} -> {:ok, router, Enum.join(rest_idl, ".")}
					error ->  error
				end
			end
			def add(router, id, newrouter) do
				Serverboards.Router.addl(router, String.split(id, "."), newrouter)
			end

			def lookupl(a,b) do
				raise "lookupl/2 not implemented for this Router"
			end
			def addl(a,b,c) do
				raise "addl/3 not implemented for this Router"
			end

			def to_map(c) do
				raise "to_map/1 not implemented for this router"
			end

			defoverridable [lookup: 2, lookupl: 2, add: 3, addl: 3, to_map: 1]
		end
	end

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

	@doc ~S"""
	Looks for element on the id list
	"""
	def lookupl(router, idl) do
		GenServer.call(router.pid, {:lookup, idl})
	end
	@doc ~S"""
	Adds element by the id list
	"""
	def addl(router, id, newrouter) do
		GenServer.call(router.pid, {:add, id, newrouter})
	end

	def to_map(router) do
		GenServer.call(router.pid, {:to_map})
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

	def handle_call({:to_map}, from, state) do
		r = Enum.map state.children, fn {k,v} ->
			try do
				{k, Router.to_map(v) }
			rescue
				_ ->
					{k, v}
			end
		end
		#Logger.info("Router to_map #{inspect r}")
		{:reply, r, state}
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
defimpl Serverboards.Router, for: Serverboards.Router.Basic  do
	use Serverboards.Router.Basic

	def lookupl(a,b) do
		Serverboards.Router.Basic.lookupl(a,b)
	end
	def addl(a,b,c) do
		Serverboards.Router.Basic.addl(a,b,c)
	end
	def to_map(router) do
		Serverboards.Router.Basic.to_map(router)
	end
end
