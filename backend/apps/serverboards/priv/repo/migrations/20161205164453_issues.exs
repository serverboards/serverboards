defmodule Serverboards.Repo.Migrations.Issues do
  use Ecto.Migration

  def change do
    create table :issues_issue do
      add :creator_id, :id
      add :title, :string, size: 256
      add :status, :string, size: 16

      timestamps(type: :utc_datetime)
    end
    create table :issues_label do
      add :name, :string, size: 16
      add :color, :string, size: 16
    end
    create table :issues_issue_label do
      add :issue_id, :id
      add :label_id, :id
    end
    create table :issues_event do
      add :issue_id, :id
      add :creator_id, :id
      add :title, :string, size: 256 # short text to show on some briefings
      add :type, :string, size: 16
      add :data, :map

      timestamps(type: :utc_datetime)
    end
    create table :issues_issue_assignee do
      add :issue_id, :id
      add :user_id, :id

      timestamps(type: :utc_datetime)
    end
  end
end
