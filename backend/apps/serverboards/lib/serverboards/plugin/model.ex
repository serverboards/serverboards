defmodule Serverboards.Plugin.Model do
	defmodule Data do
		use Ecto.Schema
		schema "plugin_data" do
      field :plugin, :string
      field :key, :string
	    field :value, :map
      timestamps(type: :utc_datetime)
    end

    @required_fields ~w(plugin key value)a
    def changeset(data, changes \\ :empty) do
      import Ecto.Changeset
      data
        |> cast(changes, @required_fields)
				|> validate_required(@required_fields)
    end
  end
end
