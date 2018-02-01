defmodule Serverboards.RulesV2.Model do
  defmodule Rule do
    use Ecto.Schema
    schema "rules_v2_rule" do
      field :uuid, Ecto.UUID
      field :is_active, :boolean, default: false
      field :deleted, :boolean, default: false

      field :name, :string, default: ""
      field :description, :string, default: ""

      field :project_id, :id

      field :rule, :map, default: %{}
      field :from_template, :string, default: nil

      timestamps(type: :utc_datetime)
    end
    @required_fields ~w(uuid is_active)a
    @optional_fields ~w(deleted name description project_id rule from_template)a
    def changeset(data, changes \\ :empty) do
      import Ecto.Changeset
      data
        |> cast(changes, @required_fields ++ @optional_fields)
        |> validate_required(@required_fields)
    end
  end

  defmodule RuleState do
    use Ecto.Schema
    schema "rules_v2_rule_state" do
      field :rule_id, :id
      field :state, :map

      timestamps(type: :utc_datetime)
    end
    @required_fields ~w(rule_id state)a
    @optional_fields ~w()a
    def changeset(data, changes \\ :empty) do
      import Ecto.Changeset
      data
        |> cast(changes, @required_fields ++ @optional_fields)
        |> validate_required(@required_fields)
    end
  end
end
