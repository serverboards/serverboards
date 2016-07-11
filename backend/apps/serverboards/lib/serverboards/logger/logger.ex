defmodule Serverboards.Logger do
  use GenEvent

  alias Serverboards.Logger.Model
  alias Serverboards.Repo

  def ignore_applications do
    [ :ecto ]
  end

  def init(_opts) do
    {:ok, %{ ignore_applications: ignore_applications }}
  end

  def handle_event(:flush, state) do
    IO.puts("Logs Flush")

    {:ok, state}
  end
  def handle_event({level, group_leader, {Logger, message, timestamp, metadata}}, state) do
    if (not metadata[:application] in state.ignore_applications) or (level != :debug) do
      changelog = Model.Line.changelog(%Model.Line{}, %{
        message: to_string(message),
        level: to_string(level),
        timestamp: timestamp,
        meta: Map.new(metadata, fn {k,v} -> {k, inspect v} end)
        })
      case Repo.insert( changelog ) do
        {:ok, _} -> :ok
        {:error, changeset} ->
          IO.puts("Error storing log line: #{inspect changeset}")
          :error
      end
    end

    #IO.puts("Logs #{inspect level} #{inspect group_leader} #{inspect message} #{inspect timestamp} #{inspect metadata}")

    {:ok, state}
  end
  def handle_event({:configure, opts}, state) do
    IO.puts("Logs configure: #{inspect opts}")
  end
end
