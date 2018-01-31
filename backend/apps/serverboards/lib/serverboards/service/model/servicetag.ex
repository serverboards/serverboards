defmodule Serverboards.Service.Model.ServiceTag do
	use Ecto.Schema
	schema "service_service_tag" do
		field :service_id, :id
		field :name, :string
	end
	# @required_fields ~w(service_id name)a
end
