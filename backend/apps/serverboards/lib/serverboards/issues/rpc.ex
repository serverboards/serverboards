require Logger

defmodule Serverboards.Issues.RPC do
  alias MOM.RPC
  alias MOM.RPC.Context
  alias MOM

  def start_link(options \\ []) do
    {:ok, mc} = RPC.MethodCaller.start_link options
    Serverboards.Utils.Decorators.permission_method_caller mc

    RPC.MethodCaller.add_method mc, "issues.list", fn
      [] -> Serverboards.Issues.list
      filter when is_map(filter) ->
        filter = Serverboards.Utils.keys_to_atoms_from_list(filter, ~w"alias")
        Serverboards.Issues.list filter
    end, [required_perm: "issues.view"]
    RPC.MethodCaller.add_method mc, "issues.get", fn [issue_id] ->
      Serverboards.Issues.Issue.get issue_id
    end, [required_perm: "issues.view"]

    RPC.MethodCaller.add_method mc, "issues.add", fn attributes, context ->
      # Not full evenetsourcing as it returns the added issue id.
      attributes = Serverboards.Utils.keys_to_atoms_from_list(attributes, ~w"title description aliases")
      Serverboards.Issues.Issue.add attributes, Context.get(context, :user)
    end, [required_perm: "issues.add", context: true]
    RPC.MethodCaller.add_method mc, "issues.update", fn
      [id, updates], context when is_list(updates) ->
        for data <- updates do
          data = Serverboards.Utils.keys_to_atoms_from_list(data, ~w"title type data")
          Serverboards.Issues.Issue.update id, data, Context.get(context, :user)
        end
        :ok
      [id, data] , context ->
        data = Serverboards.Utils.keys_to_atoms_from_list(data, ~w"title type data")
        Serverboards.Issues.Issue.update id, data, Context.get(context, :user)
    end, [required_perm: "issues.update", context: true]


    # Add this method caller once authenticated.
    MOM.Channel.subscribe(:auth_authenticated, fn %{ payload: %{ client: client }} ->
      MOM.RPC.Client.add_method_caller client, mc
      :ok
    end)

    {:ok, mc}
  end
end
