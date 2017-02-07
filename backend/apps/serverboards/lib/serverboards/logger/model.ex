defmodule Serverboards.Logger.Model do
  defmodule Line do
    use Ecto.Schema
    schema "logger_line" do
      field :message, :string
      field :level, :string
      field :timestamp, Ecto.DateTime
      field :meta, :map
    end

    @required_fields ~w(message level timestamp meta)

    def changeset(line, params \\ :empty) do
      import Ecto.Changeset
      line
        |> cast(params, @required_fields)
        |> validate_required(@required_fields)
    end
  end
end
