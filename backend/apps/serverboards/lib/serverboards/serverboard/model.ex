require Logger
defmodule Serverboards.Serverboard.Model do
	defmodule Serverboard do
		use Ecto.Schema
		schema "serverboard_serverboard" do
	    field :shortname, :string
	    field :name, :string
	    field :description, :string
	    field :creator_id, :id
	    field :priority, :integer

			has_many :tags, Serverboards.Serverboard.Model.ServerboardTag
	    timestamps
		end

		@required_fields ~w(shortname)
		@optional_fields ~w(name description creator_id priority)
		def changeset(serverboard, changes \\ :empty) do
			import Ecto.Changeset
			serverboard
				|> cast(changes, @required_fields, @optional_fields)
		end
	end

	defmodule ServerboardTag do
		use Ecto.Schema
		schema "serverboard_serverboard_tag" do
			#field :serverboard_id, :id
			field :name, :string

			belongs_to :serverboard, Serverboard
		end
		@required_fields ~w(serverboard_id name)
		@optional_fields ~w()
	end

	defmodule ServerboardService do
		use Ecto.Schema
		schema "serverboard_serverboard_service" do
	    field :serverboard_id, :id
			field :service_id, :id
	    timestamps
		end
		@required_fields ~w(serverboard_id service_id)
		@optional_fields ~w()
	end

	defmodule Widget do
		use Ecto.Schema
		schema "serverboard_widget" do
			field :serverboard_id, :id
			field :uuid, Ecto.UUID
			field :widget, :string
			field :config, :map
			field :ui, :map
			timestamps
		end

		@required_fields ~w(serverboard_id uuid widget)
		@optional_fields ~w(config ui)
		def changeset(widget, changes \\ :empty) do
			import Ecto.Changeset
			widget
				|> cast(changes, @required_fields, @optional_fields)
		end
	end
end
