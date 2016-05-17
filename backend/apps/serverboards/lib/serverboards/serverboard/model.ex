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

	defmodule ServerboardComponent do
		use Ecto.Schema
		schema "serverboard_serverboard_component" do
	    field :serverboard_id, :id
			field :component_id, :id
	    timestamps
		end
		@required_fields ~w(serverboard_id component_id)
		@optional_fields ~w()
	end
end
