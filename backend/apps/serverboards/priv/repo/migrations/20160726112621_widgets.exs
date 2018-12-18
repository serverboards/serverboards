defmodule Serverboards.Repo.Migrations.Widgets do
  use Ecto.Migration

  def change do
    create table(:serverboard_widget) do
      add(:serverboard_id, :id)
      add(:uuid, :uuid)
      add(:widget, :string)
      add(:config, :map)
      add(:ui, :map)

      timestamps(type: :utc_datetime)
    end

    create(index(:serverboard_widget, [:serverboard_id]))
    create(index(:serverboard_widget, [:uuid]))
  end
end
