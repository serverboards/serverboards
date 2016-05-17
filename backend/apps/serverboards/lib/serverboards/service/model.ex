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
				field :config, :map

				has_many :tags, Serverboards.Service.Model.ComponentTag
				timestamps
		 end

		 @required_fields ~w(name type creator_id priority config)
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
end
