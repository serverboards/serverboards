defmodule Serverboards.Repo.Migrations.UserToken do
  use Ecto.Migration

  def change do
    import Serverboards.Auth

    create table(:auth_user_token) do
      add :token, :string
      add :time_limit, Ecto.DateTime.type
      add :user_id, :id

      timestamps
    end

    create unique_index(:auth_user_token, [:token])
    create index(:auth_user_token, [:time_limit])
    create index(:auth_user_token, [:user_id])
  end
end
