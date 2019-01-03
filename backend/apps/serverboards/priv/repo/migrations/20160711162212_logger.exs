defmodule Serverboards.Repo.Migrations.Logger do
  use Ecto.Migration

  def change do
    create table(:logger_line) do
      add(:message, :text)
      add(:level, :string)
      add(:timestamp, :timestamp)
      add(:meta, :map)
    end

    create(index(:logger_line, [:timestamp]))
    create(index(:logger_line, [:level]))
    create(index(:logger_line, [:timestamp, :level]))
  end
end
