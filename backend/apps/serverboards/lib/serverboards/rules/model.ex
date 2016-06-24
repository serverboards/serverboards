defmodule Serverboards.Rules.Model do
  defmodule Rule do
    use Ecto.Schema
    schema "rules_rule" do
      field :uuid, Ecto.UUID
      field :is_active, :boolean
      field :name, :string
      field :description, :string
      field :serverboard_id, :id

      field :service_id, :id

      field :trigger, :string
      field :params, :map

      timestamps
    end

    @required_fields ~w(uuid)
    @optional_fields ~w(name description serverboard_id service_id trigger params)
    def changeset(data, changes \\ :empty) do
      import Ecto.Changeset
      data
        |> cast(changes, @required_fields, @optional_fields)
    end
  end

  defmodule ActionAtState do
    use Ecto.Schema
    schema "rules_action_state" do
      field :rule_id, :id
      field :state, :string

      field :action, :string
      field :params, :map
    end

    @required_fields ~w(rule_id state action params)
    @optional_fields ~w()
    def changeset(data, changes \\ :empty) do
      import Ecto.Changeset
      data
        |> cast(changes, @required_fields, @optional_fields)
    end
  end
end
