require Logger

defmodule Serverboards.File.RPC do
  alias Serverboards.File.Pipe

  def start_link(options) do
    import MOM.RPC.MethodCaller
    {:ok, mc} = MOM.RPC.MethodCaller.start_link(options)

    # Adds that it needs permissions and user
    Serverboards.Utils.Decorators.permission_method_caller mc


    add_method mc, "file.pipe", fn
      [], context ->
        client = MOM.RPC.Context.get(context, :client).pid
        {:ok, wfd, rfd} = Pipe.pipe(%{ parent: client })
        {:ok, [wfd, rfd]}
      options, context ->
        client = MOM.RPC.Context.get(context, :client).pid

        options = Serverboards.Utils.keys_to_atoms_from_list(options, ~w"async")
        options = Map.put(options, :parent, client)

        {:ok, wfd, rfd} = Pipe.pipe(options)
        {:ok, [wfd, rfd]}
    end, context: true, required_perm: "file.pipe"

    add_method mc, "file.read", fn
      [fd, options] ->
        options = Serverboards.Utils.keys_to_atoms_from_list(options, ~w"nonblock")
        Pipe.read(fd, options)
      [fd] -> Pipe.read(fd)
    end, required_perm: "file.pipe"
    add_method mc, "file.write", fn
      [fd, data, options] ->
        Logger.debug("Write data to pipe #{inspect data}")
        options = Serverboards.Utils.keys_to_atoms_from_list(options, ~w"nonblock")
        Pipe.write(fd, data, options)
      [fd, data] ->
        Logger.debug("Write data to pipe #{inspect data}")
        Pipe.write(fd, data)
    end, required_perm: "file.pipe"

    add_method mc, "file.close", fn
      [fd] -> Pipe.close(fd)
    end, required_perm: "file.pipe"
    add_method mc, "file.sync", fn
      [fd] -> Pipe.sync(fd)
    end, required_perm: "file.pipe"

    add_method mc, "file.fcntl", fn
      [fd, options] ->
        options = Serverboards.Utils.keys_to_atoms_from_list(options, ~w"async")
        Pipe.fcntl(fd, options)
    end, required_perm: "file.pipe"

    MOM.Channel.subscribe(:auth_authenticated, fn %{ payload: %{ client: client }} ->
      #Logger.info("Event RPC ready.")
      MOM.RPC.Client.add_method_caller client, mc
    end)

    {:ok, mc}
  end
end
