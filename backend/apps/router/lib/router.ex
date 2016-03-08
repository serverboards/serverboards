require Logger

defmodule Router do
	use GenServer

	@doc ~S"""
	Starts the Router actor

		iex> {:ok, router} = Router.start_link
		iex> Router.call(router, "version")
		"0.0.1"
		iex> Router.call(router, "version", [])
		"0.0.1"
		iex> Router.call(router, "ping", ["test"])
		"test"
	"""
	def start_link do
		GenServer.start_link(__MODULE__, %{}, [])
	end

	def call(router, method, args \\ []) do
		GenServer.call(router, {:call, method, args})
	end

	def add_method(router, method, f) do
		GenServer.call(router, {:add_method, method, f})
	end

	## Server callbacks

	def init(methods \\ %{}) do
		# some predefined methods
		methods=Map.merge(defaults, methods)

		{:ok, %{ methods: methods }}
	end

	def defaults do
		%{
			"version" => fn [] -> "0.0.1" end,
			"ping" => fn [x] -> x end
		}
	end


	@doc ~S"""
	Adds a callback to the method registry

		iex> {:ok, state} = Router.init()
		iex> {:reply, :ok, state} = Router.handle_call({:add_method, "test", fn [] -> :ok end}, nil, state)
		iex> {:reply, res, state} = Router.handle_call({:call, "test", []}, nil, state)
		iex> res
		:ok
	"""
	def handle_call({:add_method, name, f}, _from, state) do
		state = %{ state | methods: Map.put(state.methods, name, f) }
		 {:reply, :ok, state }
	end

	@doc ~S"""
	Handles calls

	Properly tested at start_link
	"""
	def handle_call({:call, name, params}, from, state) do
		f = state.methods[name]
		if f == nil do
			{:reply, {:error, :method_not_found}, state}
		else
			# launch as new task, and forget, if fails, use supervisor tree
			Task.start_link fn ->
				res = f.(params)
				#Logger.debug("Got answer for #{inspect from}: #{inspect res}")
				GenServer.reply(from, res)
			end
			{:noreply,  state}
		end
	end
end
