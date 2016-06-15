defmodule Serverboards.Notifications.Model do
  defmodule UserChannel do
    use Ecto.Schema
    schema "notification_userchannel" do
        field :user_id, :id
        field :is_active, :boolean
        field :type, :string
        field :config, :map
        timestamps
     end
  end
  @required_fields ~w(user_id is_active type config)
  @optional_fields ~w()
end
