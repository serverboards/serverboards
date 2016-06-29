defmodule Serverboards.Notifications.Model do
  defmodule ChannelConfig do
    use Ecto.Schema
    schema "notifications_channelconfig" do
        field :user_id, :id
        field :is_active, :boolean
        field :channel, :string
        field :config, :map
        timestamps
     end

    @required_fields ~w(user_id is_active channel config)
    @optional_fields ~w()
    def changeset(cc, params \\ :empty) do
      import Ecto.Changeset
      cc
        |> cast(params, @required_fields, @optional_fields)
    end
  end
end
