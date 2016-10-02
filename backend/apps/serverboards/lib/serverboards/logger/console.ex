defmodule Serverboards.Logger.Console do
  use GenEvent

  def colors do
    %{debug: :cyan,
      info: :normal,
      warn: :yellow,
      error: :red,
      enabled: true
    }
  end

  def ignore_applications do
    [ :ecto ]
  end

  def ignore_levels do
    [  ]
  end

  def format(msg, metadata, colors) do
    metadata=Map.to_list(Map.new(metadata)) # get latest, to get the overwritten file/line/function
    time = Logger.Utils.format_time( elem metadata[:timestamp], 1 )
    level = String.upcase(to_string metadata[:level])
    fileline = if metadata[:file] do
        "#{Path.basename(Path.dirname(metadata[:file]))}/#{Path.basename(metadata[:file])}:#{metadata[:line]}"
      else
        "--/--"
      end
    pid = String.slice (inspect metadata[:pid]), 4..-1

    header= (
      "#{time} [#{String.pad_trailing level, 5}] [#{String.pad_leading fileline, 30} / #{pid}] "
        |> color_event(metadata[:level], colors)
      )
    ["\r",
      String.pad_trailing(to_string(header), 80),
      msg]
  end

  defp color_event(data, level, colors) do
    [IO.ANSI.format_fragment([ Map.get(colors, level, :normal), data], true), IO.ANSI.reset]
  end

  def init(_opts) do
    {:ok, %{ colors: colors, ignore_applications: ignore_applications, ignore_levels: ignore_levels }}
  end

  def handle_event(:flush, state) do
    {:ok, state}
  end
  def handle_event({level, _group_leader, {Logger, message, timestamp, metadata}}, state) do
    if (not metadata[:application] in state.ignore_applications) or (level in state.ignore_levels) do
      metadata = metadata ++ [level: level, timestamp: timestamp]
      #IO.puts(inspect metadata)
      IO.puts(
          format(message, metadata, state.colors)
        )
    end

    {:ok, state}
  end
  def handle_event({:configure, opts}, _state) do
    IO.puts("Serverboards.Logger.Console configure: #{inspect opts}")
  end
end
