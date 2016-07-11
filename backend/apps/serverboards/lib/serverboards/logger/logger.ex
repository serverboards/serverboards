defmodule Serverboards.Logs do
  use GenEvent

  def init(_opts) do
    {:ok, :empty}
  end

  def id(caller) do
    "[#{Path.basename(Path.dirname(caller.file))}/#{Path.basename(caller.file)}:#{caller.line} / #{String.slice (inspect self), 4..-1}]"
  end

  def handle_event(:flush, state) do
    IO.puts("Logs Flush")

    {:ok, state}
  end
  def handle_event({level, group_leader, {Logger, message, timestamp, metadata}}, state) do
    IO.puts("Logs #{inspect level} #{inspect group_leader} #{inspect message} #{inspect timestamp} #{inspect metadata}")

    {:ok, state}
  end
  def handle_event({:configure, opts}, state) do
    IO.puts("Logs configure: #{inspect opts}")
  end
end
