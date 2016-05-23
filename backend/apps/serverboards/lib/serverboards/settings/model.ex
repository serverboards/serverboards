require Logger
defmodule Serverboards.Settings.Model do
	defmodule Settings do
		use Ecto.Schema

    schema "settings_settings" do
      field :section, :string
      field :data, :map

      timestamps
    end

		@required_fields ~w(section data)
		@optional_fields ~w()
		def changeset(settings, changes \\ :empty) do
		 import Ecto.Changeset
		 settings
			 |> cast(changes, @required_fields, @optional_fields)
	 end
  end
end
