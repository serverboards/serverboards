defmodule Serverboards.Repo.Migrations.UserTable do
  use Ecto.Migration

  def change do
    import Serverboards.Auth

    create table(:auth_user) do
      add :email, :string, unique: true, null: false
      add :first_name, :string
      add :last_name, :string
      add :is_active, :boolean

      timestamps
    end

    create table(:auth_user_password) do
      add :password, :string
      add :user_id, :id

      timestamps
    end

    create table(:auth_permission) do
      add :code, :string
    end

    create table(:auth_group) do
      add :name, :string
    end

    create table(:auth_group_perms) do
      add :group_id, references(:auth_group)
      add :perm_id, references(:auth_permission)
    end

    create table(:auth_user_group) do
      add :user_id, references(:auth_user)
      add :group_id, references(:auth_group)
    end


    create unique_index(:auth_user, [:email])
    create unique_index(:auth_user_password, [:user_id])
    create unique_index(:auth_permission, [:code])
    create unique_index(:auth_group, [:name])
    create index(:auth_group_perms, [:group_id])
    create index(:auth_group_perms, [:perm_id])
    create unique_index(:auth_group_perms, [:group_id, :perm_id])
    create index(:auth_user_group, [:user_id])
    create index(:auth_user_group, [:group_id])
    create unique_index(:auth_user_group, [:user_id, :group_id])
  end
end
