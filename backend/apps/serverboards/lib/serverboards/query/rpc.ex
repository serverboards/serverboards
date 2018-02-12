require Logger

defmodule Serverboards.Query.RPC do
  def start_link(options \\ []) do
    import MOM.RPC.MethodCaller
    {:ok, mc} = MOM.RPC.MethodCaller.start_link options

    # Adds that it needs permissions.
    Serverboards.Utils.Decorators.permission_method_caller mc

    add_method mc, "query.query", fn data, context ->
      me = MOM.RPC.Context.get(context, :user)
      data = Serverboards.Utils.keys_to_atoms_from_list(data, ~w"query context")
      data = %{ data |
        context: Enum.map(data.context, fn
          {"__" <> k, ctx} ->
            {"__" <> k, ctx}
          {k, ctx} ->
            {k, %{
              user: me.email,
              extractor: ctx["extractor"],
              service: ctx["service"],
              config: ctx["config"],
            }}
        end) |> Map.new }
      %{ query: query, context: context } = data

      Serverboards.Query.query query, context
    end, required_perm: "query.query", context: true

    # Add this method caller once authenticated.
    MOM.Channel.subscribe(:auth_authenticated, fn %{ payload: %{ client: client }} ->
      MOM.RPC.Client.add_method_caller client, mc
      :ok
    end)

    {:ok, mc}
  end
end
