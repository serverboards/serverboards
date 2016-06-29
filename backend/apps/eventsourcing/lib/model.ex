require Logger

defmodule EventSourcing.Model do

  defmodule EventStream do
    use Ecto.Schema
    schema "eventsourcing_event_stream" do
        field :store, :string
        field :type, :string
        field :author, :string
        field :data, :map

        timestamps updated_at: false, usec: true
     end

     @required_fields ~w(store type author data)
     @optional_fields ~w()
     def changeset(event, changes \\ :empty) do
      import Ecto.Changeset
      event
        |> cast(changes, @required_fields, @optional_fields)
    end
  end

  @doc ~S"""
  Stores all request on this stream.

  Requires a repository.
  """
  def subscribe(pid, store_name, repo) when is_atom(store_name) do
    store_name="#{store_name}"
    EventSourcing.subscribe(pid, fn type, data, author ->
      data = case data do
        %{} = data ->
          data
        other -> %{ __data: data }
      end

      {:ok, res} = repo.insert( EventSourcing.Model.EventStream.changeset(
        %EventSourcing.Model.EventStream{},
        %{
          store: store_name,
          type: "#{type}",
          data: data,
          author: author
        }) )
      Logger.debug("Store #{type} #{inspect res}")
      res
    end, name: :database, store: true)
  end


end
