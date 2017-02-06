require Logger
defmodule Serverboards.Service.Model do
	defmodule Service do
		use Ecto.Schema
		schema "service_service" do
				field :uuid, Ecto.UUID
				field :name, :string
				field :type, :string
				field :creator_id, :id
				field :priority, :integer
				field :config, :map
				field :description, :string

				has_many :tags, Serverboards.Service.Model.ServiceTag
				timestamps
		 end

		 @required_fields ~w(name type creator_id priority config)a
		 @optional_fields ~w(description)a
		 def changeset(service, changes \\ :empty) do
			import Ecto.Changeset
			service
				|> cast(changes, @required_fields ++ @optional_fields)
				|> validate_required(@required_fields)
		end
	end
	defmodule ServiceTag do
		use Ecto.Schema
		schema "service_service_tag" do
			field :service_id, :id
			field :name, :string
		end
		@required_fields ~w(service_id name)a
	end
	defmodule ServiceConfig do
		use Ecto.Schema
		schema "service_service_config" do
			field :service_id, :id
			field :key, :string
			field :value, :string
		end
		@required_fields ~w(service_id key value)a
	end
end
