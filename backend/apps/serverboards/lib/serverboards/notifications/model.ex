defmodule Serverboards.Notifications.Model do
  defmodule ChannelConfig do
    use Ecto.Schema
    schema "notifications_channelconfig" do
        field :user_id, :id
        field :is_active, :boolean
        field :channel, :string
        field :config, :map
        timestamps(type: :utc_datetime)
     end

    @required_fields ~w(user_id is_active channel config)a
    def changeset(cc, params \\ :empty) do
      import Ecto.Changeset
      cc
        |> cast(params, @required_fields)
        |> validate_required(@required_fields)
    end
  end

  defmodule Notification do
    use Ecto.Schema
    schema "notifications_notification" do
      field :user_id, :id
      field :subject, :string
      field :body, :string
      field :meta, :map
      field :tags, {:array, :string}

      timestamps(type: :utc_datetime)
    end

    @required_fields ~w(user_id subject body)a
    @optional_fields ~w(meta tags)a
    def changeset(cc, params \\ :empty) do
      import Ecto.Changeset
      cc
        |> cast(params, @required_fields ++ @optional_fields)
        |> validate_required(@required_fields)
    end
  end
end
