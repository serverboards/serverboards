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

  defp rpad(str, max) do
    if String.length(str) >= max do
      String.slice str, -max, max
    else
      String.pad_trailing str, max
    end
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
    pid = inspect(metadata[:pid])
    pid = if (String.starts_with?(pid, "#")) do
      String.slice pid, 4..-1
    else
      pid
    end

    header= (
      "#{time} [#{String.pad_trailing level, 5}] [#{rpad fileline, 30} / #{String.pad_trailing pid, 10}] "
        |> color_event(metadata[:level], colors)
      )
    header = ["\r", String.pad_trailing(to_string(header), 80)]

    if is_pid(metadata[:pid]) do
      [
        header,
        msg
      ]
    else
      msg = [[IO.ANSI.format_fragment([:blue, msg], true)], IO.ANSI.reset]
      [
        header,
        msg
      ]
    end
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
