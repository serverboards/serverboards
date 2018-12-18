defmodule Serverboards.Repo.Migrations.UserName do
  use Ecto.Migration

  def change do
    rename(table(:auth_user), :first_name, to: :name)

    alter table(:auth_user) do
      remove(:last_name)
    end
  end
end
