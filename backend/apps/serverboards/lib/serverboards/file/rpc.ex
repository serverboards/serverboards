require Logger

defmodule Serverboards.File.RPC do
  alias Serverboards.File.Pipe

  def start_link(options) do
    import MOM.RPC.MethodCaller
    {:ok, mc} = MOM.RPC.MethodCaller.start_link(options)

    # Adds that it needs permissions and user
    Serverboards.Utils.Decorators.permission_method_caller mc


    add_method mc, "file.pipe", fn options, context ->
      client = MOM.RPC.Context.get(context, :client).pid
      Logger.debug("Client #{inspect client}")

      options = Serverboards.Utils.keys_to_atoms_from_list(options, ~w"async")
      options = Map.put(options, :parent, client)

      {:ok, wfd, rfd} = Pipe.pipe(options)
      {:ok, [wfd, rfd]}
    end, context: true, required_perm: "file.pipe"

    add_method mc, "file.read", fn
      [fd, options] ->
        options = Serverboards.Utils.keys_to_atoms_from_list(options, ~w"async")
        Pipe.read(fd, options)
      [fd] -> Pipe.read(fd)
    end, required_perm: "file.pipe"
    add_method mc, "file.write", fn
      [fd, data, options] ->
        options = Serverboards.Utils.keys_to_atoms_from_list(options, ~w"async")
        Pipe.write(fd, data, options)
      [fd, data] -> Pipe.write(fd, data)
    end, required_perm: "file.pipe"

    add_method mc, "file.close", fn
      [fd] -> Pipe.close(fd)
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
