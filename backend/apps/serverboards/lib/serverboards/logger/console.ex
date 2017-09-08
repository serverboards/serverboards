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
      String.pad_leading str, max
    end
  end

  def white(count) do
    for _i <- 1..count do
      " "
    end
    |> to_string
  end

  def split_blocks(msg, start, size) do
    String.split(to_string(msg),"\n")
      |> Enum.map(&to_string(split_blocks_splitter(&1, start, size)))
      |> Enum.join("\n" <> white(start))
  end
  def split_blocks_splitter(msg, start, size) do
    if String.length(msg) > size do
      [String.slice(msg, 0, size),"\n"] ++ [white(start),split_blocks(String.slice(msg, size, 1_024), start, size)]
    else
      msg
    end
  end

  def format(msg, metadata, colors, show_time) when is_binary(msg) do
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

    time = if show_time do
      time
    else
      "            "
    end
    header = "#{time} [#{String.pad_trailing level, 5}] [#{rpad fileline, 30} / #{String.pad_trailing pid, 10  }] "
      |> color_event(metadata[:level], colors)
    header = ["\r", String.pad_trailing(to_string(header), 75)]

    #columns = case :io.columns do
    #  {:ok, columns} -> columns
    #  _ -> 120
    #end
    #msg = if String.length(msg) > (columns - 75) do
    #  split_blocks(msg, 67, (columns - 75))
    #else
    #  msg
    #end

    if is_pid(metadata[:pid]) do
      [
        header,
        msg
      ]
    else
      msg = [[IO.ANSI.format_fragment([:bright, :blue, msg], true)], IO.ANSI.reset]
      [
        header,
        msg
      ]
    end
  end
  def format(msg, metadata, colors, show_time) when is_list(msg) do
    format(to_string(msg), metadata, colors, show_time)
  end
  def format(msg, metadata, colors, show_time) do
    format(inspect(msg), metadata, colors, show_time)
  end

  defp color_event(data, level, colors) do
    [IO.ANSI.format_fragment([ Map.get(colors, level, :normal), data], true), IO.ANSI.reset]
  end


  def init(_opts) do
    {:ok, %{ colors: colors(), ignore_applications: ignore_applications(), ignore_levels: ignore_levels(), last_t: 0 }}
  end

  def handle_event(:flush, state) do
    {:ok, state}
  end
  def handle_event({level, _group_leader, {Logger, message, timestamp, metadata}}, state) do
    if (not metadata[:application] in state.ignore_applications) or (level in state.ignore_levels) do
      now = :erlang.system_time / 1_000_000_000
      metadata = metadata ++ [level: level, timestamp: timestamp]
      #IO.puts(inspect metadata)
      same_second=(now - state.last_t)>0.2
      try do
        IO.puts(
            format(message, metadata, state.colors, same_second)
          )
      catch
        e ->
          IO.puts("Error printing line: #{message}, #{inspect message}: #{inspect e}")
      rescue
        e ->
          IO.puts("Error printing line: #{message}, #{inspect message}: #{inspect e}")
      end
      {:ok, %{ state |
        last_t: if not same_second do state.last_t else now end
        }}
    else
      {:ok, state}
    end

  end
  def handle_event({:configure, opts}, _state) do
    IO.puts("Serverboards.Logger.Console configure: #{inspect opts}")
  end
end
