require Logger

defmodule Serverboards.MOM.Channel.Named do
	@moduledoc ~S"""
	Allows to have named channels

		iex> alias Serverboards.MOM.Channel
		iex> require Logger
		iex> Channel.Named.start_link
		iex> mch = Channel.Named.ensure_exists("my-channel")
		iex> och = Channel.Named.ensure_exists(:atom)
		iex> mch == och
		false
		iex> Channel.Named.ensure_exists("my-channel")
		mch
		iex> Channel.subscribe(mch, &Logger.info("Test" ++ (inspect &1)))
		0
	"""

	def start_link do
		Agent.start_link(fn -> %{} end, name: __MODULE__)
	end

	def ensure_exists(name) do
		Agent.get_and_update(__MODULE__, fn channels ->
			case Map.get(channels, name) do
				nil ->
					{:ok, nch} = Serverboards.MOM.Channel.start_link
					channels = Map.put(channels, name, nch)
					{nch, channels}
				ch ->
					{ch, channels}
			end
		end)
	end
end
