defmodule Serverboards.Service.Model.ServiceConfig do
	use Ecto.Schema
	schema "service_service_config" do
		field :service_id, :id
		field :key, :string
		field :value, :string
	end
	# @required_fields ~w(service_id key value)a
end
