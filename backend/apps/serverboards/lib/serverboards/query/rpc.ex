require Logger

defmodule Serverboards.Query.RPC do
  def start_link(options \\ []) do
    import MOM.RPC.MethodCaller
    {:ok, mc} = MOM.RPC.MethodCaller.start_link options

    # Adds that it needs permissions.
    Serverboards.Utils.Decorators.permission_method_caller mc

    add_method mc, "query.query", fn data ->
      data = Serverboards.Utils.keys_to_atoms_from_list(data, ~w"query context")
      data = %{ data |
        context: Enum.map(data.context, fn {k,ctx} ->
          {k, Serverboards.Utils.keys_to_atoms_from_list(ctx, ~w"user extractor")}
        end) |> Map.new }
      %{ query: query, context: context } = data

      Serverboards.Query.query query, context
    end, required_perm: "query.query"

    # Add this method caller once authenticated.
    MOM.Channel.subscribe(:auth_authenticated, fn %{ payload: %{ client: client }} ->
      MOM.RPC.Client.add_method_caller client, mc
      :ok
    end)

    {:ok, mc}
  end
end
