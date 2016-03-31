require Logger

defmodule Test.Client do
	@moduledoc ~S"""
	Fake client to ease test construction.

	Allows to send calls, expect messages/events.

	It creates all the necesary stuff to start as a non connected client
	"""
	use GenServer

	def start_link do
		{:ok, client} = Serverboards.IO.Client.start_link
		{:ok, pid } = GenServer.start_link __MODULE__, client, []
		client = %Serverboards.IO.Client{ client | options: Map.put(client.options, :pid, pid) }

		Serverboards.IO.Client.on_call(client, fn (method, params, id) ->
			GenServer.call(pid, {:call, %{method: method, params: params, id: id} } )
		end)

		{:ok, client}
	end

	@doc ~S"""
	Ignore events until this appears or timeout. What is a keyword/value list.

	It is asynchronous and stores all messages since last expect, so that there
	are no race conditions.

	## Example

		iex> cl = Test.Client.start_link
		iex> Test.Client.ready(cl)
		iex> Test.Client.expect(cl, method: "auth.auth")
		%{ method: "auth.auth" }

	"""
	def expect(client, what) do
		GenServer.call(client.options.pid, {:expect, what})
	end

	@doc ~S"""
	Calls into the client
	"""
	def call(client, method, params, id) do
		GenServer.call(client.options.pid, {:call_serverboards, method, params, id})
	end

	## server impl
	def init(client) do
		{:ok, %{
				client: client,
				messages: [],
				expecting: nil,
		} }
	end

	def handle_call({:expect, what}, from, status) do
		case Enum.drop_while(status.messages, &(!match(what, &1))) do
			[ h | t ] ->
				{:reply, h, %{status | messages: t, expecting: nil }}
			[] ->
				status=%{ status | expecting: %{ what: what, from: from } }
				{:noreply, status}
		end
	end

	def handle_call({:call, msg}, _, status) do
		if status.expecting do
			if match(status.expecting.what, msg) do
				GenServer.reply(status.expecting.from, msg)
				# consumed last, empty list, and no expecting anymore.
				{:reply, :ok, %{
					status | messages: [], expecting: nil
					}}
			end
		else
			{:reply, :ok, %{
				status | messages: status.messages ++ [msg]
				}}
		end
	end

	def handle_call({:call_serverboards, method, params, id}, from, status) do
		Serverboards.IO.Client.call(status.client, method, params, id, fn res ->
			GenServer.reply(from, res)
		end)
		{:noreply, status}
	end

	defp match(what, msg) do
		Enum.all? what, fn {k, v} ->
			Map.get(msg, k, nil) == v
		end
	end
end
