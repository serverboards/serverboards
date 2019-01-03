defmodule Serverboards.Auth.Model.UserGroup do
  use Ecto.Schema

  schema "auth_user_group" do
    field(:user_id, :id)
    field(:group_id, :id)
  end

  @fields [:group_id, :user_id]

  def changeset(obj, params \\ :empty) do
    import Ecto.Changeset

    obj
    |> cast(params, @fields)
    |> validate_required(@fields)
  end
end
