require Logger

defmodule Serverboards.Rules.Trigger do
  alias Serverboards.Plugin

  def start_link(options \\ []) do
    GenServer.start_link(__MODULE__, :ok, options)
  end

  @doc ~S"""
  Returns the list of possible triggers for the given filter.

  The filter is as in Plugin.Registry.filter_component
  """
  def find(filter \\ []) do
    Plugin.Registry.filter_component([type: "trigger"] ++ filter)
    |> Enum.map(fn tr ->
      states =
        case tr.extra["states"] do
          l when is_list(l) -> l
          str when is_binary(str) -> String.split(str)
          nil -> []
        end

      command = tr.extra["command"]
      # Logger.debug("Command is #{inspect command}")
      command =
        cond do
          is_binary(command) and String.contains?(command, "/") ->
            command

          command == "" or command == nil ->
            nil

          is_binary(command) ->
            "#{tr.plugin}/#{command}"
        end

      %{
        name: tr.name,
        description: tr.description,
        traits: tr.traits,
        command: command,
        start: tr.extra["start"],
        stop: tr.extra["stop"],
        id: tr.id,
        states: states,
        icon: tr.extra["icon"],
        result: tr.extra["result"] || %{}
      }
    end)
  end
end
