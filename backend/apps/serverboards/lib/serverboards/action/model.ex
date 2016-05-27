defmodule Serverboards.Action.Model do
  defmodule History do
    use Ecto.Schema
    schema "action_history" do
      field :uuid, Ecto.UUID
      field :type, :string
      field :status, :string
      field :result, :map
      field :user_id, :id
      field :elapsed, :integer # in ms.
      timestamps
    end

    @required_fields ~w(uuid type status user_id)
    @optional_fields ~w(result elapsed)
    def changeset(action, changes \\ :empty) do
      import Ecto.Changeset
      action
      |> cast(changes, @required_fields, @optional_fields)
    end
  end
end
