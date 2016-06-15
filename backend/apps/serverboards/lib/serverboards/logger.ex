require Logger

defmodule Serverboards.Logger do
  def id(caller) do
    "[#{Path.basename(Path.dirname(caller.file))}/#{Path.basename(caller.file)}:#{caller.line} / #{String.slice (inspect self), 4..-1}]"
  end

  defmacro debug(str) do
    quote do
      require Logger
      id = Serverboards.Logger.id(__ENV__)
      Logger.debug(id <> " " <> unquote(str))
    end
  end
  defmacro info(str) do
    quote do
      require Logger
      id = Serverboards.Logger.id(__ENV__)
      Logger.info(id <> " " <> unquote(str))
    end
  end
  defmacro warn(str) do
    quote do
      require Logger
      id = Serverboards.Logger.id(__ENV__)
      Logger.warn(id <> " " <> unquote(str))
    end
  end
  defmacro error(str) do
    quote do
      require Logger
      id = Serverboards.Logger.id(__ENV__)
      Logger.error(id <> " " <> unquote(str))
    end
  end
end
