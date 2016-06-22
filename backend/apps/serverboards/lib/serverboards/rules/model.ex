defmodule Serverboards.Rules.Model do
  defmodule Rule do
    use Ecto.Schema
    schema "rule_rule" do
      field :name, :string
      field :serverboard_id, :id

      field :service, :string
      field :trigger, :string
      field :params, :map

      timestamps
    end
  end

  defmodule ActionAtState do
    use Ecto.Schema
    schema "rule_action_state" do
      field :rule_id, :id
      field :state, :string

      field :action, :string
      field :params, :map
    end
  end
end
