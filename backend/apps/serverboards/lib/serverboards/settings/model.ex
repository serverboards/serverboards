require Logger

defmodule Serverboards.Settings.Model do
  defmodule Settings do
    use Ecto.Schema

    schema "settings_settings" do
      field(:section, :string)
      field(:data, :map)

      timestamps(type: :utc_datetime)
    end

    @fields ~w(section data)a
    def changeset(settings, changes \\ :empty) do
      import Ecto.Changeset

      settings
      |> cast(changes, @fields)
      |> validate_required(@fields)
    end
  end

  defmodule UserSettings do
    use Ecto.Schema

    schema "settings_user_settings" do
      field(:section, :string)
      belongs_to(:user, Serverboards.Auth.Model.User)
      field(:data, :map)

      timestamps(type: :utc_datetime)
    end

    @fields ~w(section data user_id)a
    def changeset(settings, changes \\ :empty) do
      import Ecto.Changeset

      settings
      |> cast(changes, @fields)
      |> validate_required(@fields)
    end
  end
end
