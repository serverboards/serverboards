defmodule Serverboards.Repo.Migrations.UserToken do
  use Ecto.Migration

  def change do
    import Serverboards.Auth

    create table(:auth_user_token) do
      add :user_id, :id
      add :token, :string
      add :perms, {:array, :string}
      add :time_limit, Ecto.DateTime.type

      timestamps
    end

    create unique_index(:auth_user_token, [:token])
    create index(:auth_user_token, [:time_limit])
    create index(:auth_user_token, [:user_id])
  end
end
