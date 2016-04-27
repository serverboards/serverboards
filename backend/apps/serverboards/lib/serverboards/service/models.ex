require Logger

defmodule Serverboards.Service.Component do
	use Ecto.Schema
	schema "service_component" do
			field :name, :string
			field :type, :string
			field :creator_id, :id
			field :priority, :integer
			timestamps
	 end

	 @required_fields ~w(name type creator tags priority)
	 @optional_fields ~w()
end
defmodule Serverboards.Service.ComponentTag do
	use Ecto.Schema
	schema "service_component_tag" do
		field :component_id, :id
		field :name, :string
	end
	@required_fields ~w(component_id name)
	@optional_fields ~w()
end
defmodule Serverboards.Service.ComponentConfig do
	use Ecto.Schema
	schema "service_component_config" do
		field :component_id, :id
		field :key, :string
		field :value, :string
	end
	@required_fields ~w(component_id key value)
	@optional_fields ~w()
end

defmodule Serverboards.Service.Service do
	use Ecto.Schema
	schema "service_service" do
    field :shortname, :string
    field :name, :string
    field :description, :string
    field :creator_id, :id
    field :priority, :integer

		has_many :tags, Serverboards.Service.ServiceTag
    timestamps
	end

	@required_fields ~w(shortname)
	@optional_fields ~w(name description creator_id priority)
	def changeset(service, changes \\ :empty) do
		import Ecto.Changeset
		service
			|> cast(changes, @required_fields, @optional_fields)
	end
end

defmodule Serverboards.Service.ServiceTag do
	use Ecto.Schema
	schema "service_service_tag" do
		#field :service_id, :id
		field :name, :string

		belongs_to :service, Serverboards.Service.Service
	end
	@required_fields ~w(service_id name)
	@optional_fields ~w()
end

defmodule Serverboards.Service.ServiceComponent do
	use Ecto.Schema
	schema "service_service_component" do
    field :service_id, :id
		field :component_id, :id
    timestamps
	end
	@required_fields ~w(service_id component_id)
	@optional_fields ~w()
end
