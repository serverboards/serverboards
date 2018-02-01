defmodule Serverboards.Auth.Model.Permission do
  use Ecto.Schema

  schema "auth_permission" do
    field :code, :string
  end

  def changeset(obj, params \\ :empty) do
    import Ecto.Changeset
    obj
      |> cast(params, [:code])
      |> validate_required([:code])
  end
end
