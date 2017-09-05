import Serverboards.Project.Model

defmodule :"Elixir.Serverboards.Repo.Migrations.Multiple-dashboards" do
  use Ecto.Migration


  def up do
    create table :project_dashboard do
      add :uuid, :uuid
      add :project_id, :id
      add :name, :string
      add :order, :integer, default: 0
      add :config, :map
      timestamps()
    end
    create unique_index(:project_dashboard, [:uuid])
    create index(:project_dashboard, [:project_id])

    alter table :project_widget do
      add :dashboard_id, references(:project_dashboard)
    end

    # commit changes
    flush()

    execute("""
    INSERT INTO project_dashboard
               (uuid, project_id, name, "order", config, inserted_at, updated_at)
         SELECT md5(random()::text || clock_timestamp()::text)::uuid, id, 'Monitoring', 0, '{}', now(), now()
           FROM project_project;
    """)
    flush()

    execute("""
    UPDATE project_widget
       SET dashboard_id = (
        SELECT id
          FROM project_dashboard
         WHERE project_widget.project_id = project_dashboard.project_id
         );
    """)

    flush()

    alter table :project_widget do
      remove :project_id
    end
  end

  def down do
    alter table :project_widget do
      add :project_id, references(:project_project)
    end

    flush()

    execute("""
    UPDATE project_widget
       SET project_id = (
        SELECT project_id
          FROM project_dashboard
         WHERE project_widget.dashboard_id = project_dashboard.id
         ORDER BY "order"
         LIMIT 1
       );
    """)
    flush()

    alter table :project_widget do
      remove :dashboard_id
    end

    drop unique_index(:project_dashboard, [:uuid])
    drop index(:project_dashboard, [:project_id])
    drop table :project_dashboard
  end
end
