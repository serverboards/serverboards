defmodule Serverboards.Auth.Model.GroupPerms do
  use Ecto.Schema

  schema "auth_group_perms" do
    field :group_id, :id
    field :perm_id, :id
  end

  @fields [:group_id, :perm_id]

  def changeset(obj, params \\ :empty) do
    import Ecto.Changeset
    obj
      |> cast(params, @fields)
      |> validate_required(@fields)
  end
end
