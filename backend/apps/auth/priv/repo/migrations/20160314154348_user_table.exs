defmodule Serverboards.Auth.Repo.Migrations.UserTable do
  use Ecto.Migration

  def change do
    create table(:auth_user) do
      add :email, :string, unique: true, null: false
      add :first_name, :string
      add :last_name, :string
      add :is_active, :boolean

      timestamps
    end

    create table(:auth_user_password) do
      add :password, :string
      add :user_id, :integer

      timestamps
    end

    create unique_index(:auth_user, [:email])
    create unique_index(:auth_user_password, [:user_id])
  end
end
