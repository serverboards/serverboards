defmodule Eventsourcing.Repo.Migrations.Initial do
  use Ecto.Migration

  def change do
    create table(:eventsourcing_event_stream) do
      add :store, :string
      add :type, :string
      add :author, :string
      add :data, :map

      add :inserted_at, :utc_datetime
    end

    create index(:eventsourcing_event_stream, [:store])
    create index(:eventsourcing_event_stream, [:type])
  end
end
