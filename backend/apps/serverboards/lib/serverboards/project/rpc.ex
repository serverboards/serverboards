require Logger

defmodule Serverboards.Project.RPC do
  alias MOM.RPC
  alias MOM.RPC.Context
  alias MOM
  import Serverboards.Project

  def start_link(options \\ []) do
    {:ok, mc} = RPC.MethodCaller.start_link options

    # Adds that it needs permissions.
    Serverboards.Utils.Decorators.permission_method_caller mc

    # Serverboards
    RPC.MethodCaller.add_method mc, "project.create", fn
      [projectname, options], context ->
        project_add projectname, options, Context.get(context, :user)
      %{} = attr, context ->
        projectname = attr["shortname"]
        options = Map.drop(attr, ["shortname"])
        project_add projectname, options, Context.get(context, :user)
    end, [required_perm: "project.create", context: true]

    RPC.MethodCaller.add_method mc, "project.delete", fn [project_id], context ->
      project_delete project_id, Context.get(context, :user)
    end, [required_perm: "project.create", context: true]

    RPC.MethodCaller.add_method mc, "project.update", fn
      [project_id, operations], context ->
        project_update project_id, operations, Context.get(context, :user)
      end, [required_perm: "project.update", context: true]

    RPC.MethodCaller.add_method mc, "project.get", fn [project_id], context ->
      with {:ok, project} <- project_get project_id, Context.get(context, :user) do
        {:ok, Serverboards.Utils.clean_struct project}
      end
    end, [required_perm: "project.get", context: true]

    RPC.MethodCaller.add_method mc, "project.list", fn args, context ->
      case Enum.count(args) do
        0 ->
          {:ok, projects} = project_list Context.get(context, :user)
          Enum.map projects, &Serverboards.Utils.clean_struct(&1)
        _ ->
          {:error, :invalid_arguments}
      end
    end, [required_perm: "project.get", context: true]

    # Add this method caller once authenticated.
    MOM.Channel.subscribe(:auth_authenticated, fn %{ payload: %{ client: client }} ->
      MOM.RPC.Client.add_method_caller client, mc
      :ok
    end)

    {:ok, mc}
  end
end
