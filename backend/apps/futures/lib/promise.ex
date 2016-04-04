defmodule Promise do
	@moduledoc ~S"""
	Creates a promise that will be fullfilled in the future

	A promise has state, so it can be resturned and completed later, for example
	promising some value after some calculation, and using the promise just after
	asking for that promise.

	Elixir Task and Promises are similar, but tasks do not allow composability
	after the fact; using it its possible to ease callback hell.

	## Example

	Simple use, just prepare call chain and use.

		iex> require Logger
		iex> import Promise
		iex> p = Promise.new
		...>  |> then(fn w ->
		...>          Logger.info("Got #{inspect w}")
		...>          w
		...>          end)
		...>  |> then(fn _ -> :done end)
		iex> set(p, :ok)
		:done

	Using state to do some big calculation and fulfilling it later.

		iex> import Promise
		iex> p = Promise.new
		iex> t = Task.async(fn ->
		...>  :timer.sleep(1000)
		...>  set(p, :done)
		...>  end)
		iex> p
		...>  |> then(fn _ -> :something_after_1s end)
		iex> Task.await(t)
		:something_after_1s

	It protetecs against race conditions; if the promise is already fulfilled,
	it just calls the then or error as necessary.

	iex> require Logger
	iex> import Promise
	iex> p = Promise.new
	iex> set(p, :done)
	iex> {:ok, side_effect} = Agent.start_link((fn -> :not_done end))
	iex> p
	...>  |> then(fn _ ->
	...>       Logger.debug("Called after the fact")
	...>       Agent.update(side_effect, fn _ -> :side_effect end)
...>     end)
	iex> Agent.get(side_effect, &(&1))
	:side_effect

	"""

	def new do
		{:ok, pid} = Agent.start_link(fn -> [] end)
		pid
	end

	@doc ~S"""
	Sets the value, and perform the actions.

	If error, calls the first error found, and returns
	{:error, result_of_error_callback}

	If not error, returns the result of last then.
	"""
	def set(promise, value) do
		set_base(promise, {:ok, value})
	end

	@doc ~S"""
	Sets an error as promise value

		iex> require Logger
		iex> import Promise
		iex> p = Promise.new
		...>   |> error(fn _ -> Logger.error("Exception") end)
		iex> p |> set_error("Exception value")
		iex> p |> error(fn _ -> Logger.error("Exception 2") end)
		iex> Promise.get p
		{:error, :ok}

	"""
	def set_error(promise, error) do
		set_base(promise, {:error, error})
	end

	defp set_base(promise, v) do
		actions = Agent.get(promise, &(&1))
		case actions do
			{:set, v} -> raise "Already set as #{v}"
			actions ->
				ret = case perform(actions, v) do
					{:ok, v} -> v
					error -> error
				end
				Agent.update(promise, fn _ -> {:set, ret} end)
				ret
		end
	end

	@doc ~S"""
	Returns the current value, or :notyet if not set yet.
	"""
	def get(promise) do
		case Agent.get(promise, &(&1)) do
			{:set, v} -> v
			_ -> {:notyet}
		end
	end

	@doc ~S"""
	Sets the next callback if previous are :ok
	"""
	def then(promise, f) do
		Agent.update(promise, fn promise ->
			case promise do
				{:set, v} ->
					nv = perform([{:then, f}], {:ok, v})
					{:set, nv} # update last value
				promise ->
					promise ++ [{:then, f}]
			end
		end)
		promise
	end

	@doc ~S"""
	Sets the next callback if previous are :error. If called
	it stops chain execution and returns {:error, result_of_error_f}

	If error raises an exception, set will raise too.

	## Example

		iex> import Promise
		iex> p = Promise.new
		...>  |> then(fn _ -> raise "error" end)
		...>  |> then(fn _ -> :should_not_get_here_before end)
		...>  |> error(fn _ -> :catch_error end)
		...>  |> then(fn _ -> :should_not_get_here_after end)
		iex> set(p, :any)
		{:error, :catch_error}
	"""
	def error(promise, f) do
		Agent.update(promise, fn promise ->
			case promise do
				{:set, v} ->
					nv = perform([{:error, f}], v)
					{:set, nv} # update last value
				promise ->
					promise ++ [{:error, f}]
			end
		end)
		promise
	end

	defp perform([h | t], v) do
		case {h, v} do
			{{:error, f}, {:error, e}} ->
				{:error, f.(e)} # do not continue processing
			{{:error, _}, {:ok, v}} ->
				perform(t, {:ok, v}) # ignore
			{{:then, _}, {:error, v}} ->
				perform(t, {:error, v}) # ignore
			{{:then, f}, {:ok, v}} ->
				# call then, if :error call next with error, or :ok
				next_v = try do
					{:ok, f.(v)}
				rescue
					e ->
						{:error, e}
				end
				perform(t, next_v)
		end
	end

	defp perform([], v) do
		v
	end

end
