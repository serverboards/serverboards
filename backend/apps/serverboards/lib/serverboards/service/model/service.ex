defmodule Serverboards.Service.Model.Service do
  use Ecto.Schema

  schema "service_service" do
    field(:uuid, Ecto.UUID)
    field(:name, :string)
    field(:type, :string)
    field(:creator_id, :id)
    field(:priority, :integer)
    field(:config, :map)
    field(:description, :string)

    has_many(:tags, Serverboards.Service.Model.ServiceTag)
    timestamps(type: :utc_datetime)
  end

  @required_fields ~w(name type config)a
  @optional_fields ~w(description creator_id priority)a
  def changeset(service, changes \\ :empty) do
    import Ecto.Changeset

    changes =
      case Map.get(changes, :name, :nochange) do
        :nochange ->
          changes

        name when name == nil or name == "" ->
          [template] = Serverboards.Plugin.Registry.filter_component(id: service.type)
          Map.put(changes, :name, template.name)

        _ ->
          changes
      end

    service
    |> cast(changes, @required_fields ++ @optional_fields)
    |> validate_required(@required_fields)
  end
end
