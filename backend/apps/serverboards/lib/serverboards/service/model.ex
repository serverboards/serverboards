require Logger
defmodule Serverboards.Service.Model do
	defmodule Component do
		use Ecto.Schema
		schema "service_component" do
				field :uuid, Ecto.UUID
				field :name, :string
				field :type, :string
				field :creator_id, :id
				field :priority, :integer

				has_many :tags, Serverboards.Service.Model.ComponentTag
				timestamps
		 end

		 @required_fields ~w(name type creator_id priority)
		 @optional_fields ~w()
		 def changeset(component, changes \\ :empty) do
			import Ecto.Changeset
			component
				|> cast(changes, @required_fields, @optional_fields)
		end
	end
	defmodule ComponentTag do
		use Ecto.Schema
		schema "service_component_tag" do
			field :component_id, :id
			field :name, :string
		end
		@required_fields ~w(component_id name)
		@optional_fields ~w()
	end
	defmodule ComponentConfig do
		use Ecto.Schema
		schema "service_component_config" do
			field :component_id, :id
			field :key, :string
			field :value, :string
		end
		@required_fields ~w(component_id key value)
		@optional_fields ~w()
	end

	defmodule Service do
		use Ecto.Schema
		schema "service_service" do
	    field :shortname, :string
	    field :name, :string
	    field :description, :string
	    field :creator_id, :id
	    field :priority, :integer

			has_many :tags, Serverboards.Service.Model.ServiceTag
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

	defmodule ServiceTag do
		use Ecto.Schema
		schema "service_service_tag" do
			#field :service_id, :id
			field :name, :string

			belongs_to :service, Service
		end
		@required_fields ~w(service_id name)
		@optional_fields ~w()
	end

	defmodule ServiceComponent do
		use Ecto.Schema
		schema "service_service_component" do
	    field :service_id, :id
			field :component_id, :id
	    timestamps
		end
		@required_fields ~w(service_id component_id)
		@optional_fields ~w()
	end
end
