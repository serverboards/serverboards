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

     @fields ~w(store type author data)a
     def changeset(event, changes \\ :empty) do
      import Ecto.Changeset
      event
        |> cast(changes, @fields)
        |> validate_required(@fields)
    end
  end

  @doc ~S"""
  Stores all request on this stream.

  Requires a repository.
  """
  def subscribe(pid, store_name, repo, options \\ []) when is_atom(store_name) do
    store_name="#{store_name}"
    EventSourcing.subscribe(pid, fn type, data, author ->
      data = case data do
        %{} = data ->
          data
        _other -> %{ __data: data }
      end

      {:ok, res} = repo.insert( EventSourcing.Model.EventStream.changeset(
        %EventSourcing.Model.EventStream{},
        %{
          store: store_name,
          type: "#{type}",
          data: data,
          author: author
        }) )
      if options[:debug] do
        Logger.debug("Store #{type} #{inspect res}")
      end
      res
    end, name: :database, store: true)
  end


end
