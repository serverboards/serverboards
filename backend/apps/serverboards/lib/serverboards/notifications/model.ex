defmodule Serverboards.Notifications.Model do
  use Ecto.Schema
  defmodule UserChannel do
    schema "notification_userchannel" do
        field :user_id, :id
        field :type, :string
        field :config, :map
        timestamps
     end
  end
end
