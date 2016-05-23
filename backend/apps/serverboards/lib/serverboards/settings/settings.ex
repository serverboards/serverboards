require Logger

defmodule Serverboards.Settings do
  @doc ~S"""
  Serverboards keeps almost all configuration in datbase to allow easy change
  from UI.

  This module keeps all settings related acesses and changes.

  Each subsection may have specific permissions required.
  """
  import Serverboards.{Repo, Plugin}
  alias Serverboards.Repo
  alias Serverboards.Settings.Model

  def start_link(options) do
    {:ok, es} = EventSourcing.start_link [name: :settings] ++ options
    {:ok, rpc} = Serverboards.Settings.RPC.start_link

    setup_eventsourcing(es)

    {:ok, es}
  end

  def setup_eventsourcing(es) do
    import EventSourcing

    subscribe es, :update_settings, fn [section, data], me ->
      Logger.info("Update settings, #{section}: #{inspect data}")

      case Repo.get_by(Model.Settings, section: section) do
        nil ->
          Repo.insert( %Model.Settings{section: section, data: data} )
        sec ->
          Logger.debug("#{inspect sec}")
          Repo.update( Model.Settings.changeset(sec, %{data: data}) )
      end
      :ok
    end

    EventSourcing.Model.subscribe :settings, :settings, Serverboards.Repo
  end

  def update(section, attributes, me) do
    if "settings.update" in me.perms do
      EventSourcing.dispatch(:settings, :update_settings, [section, attributes], me.email)
      :ok
    else
      {:error, :permission_denied}
    end
  end

  @doc ~S"""
    Returns a list with all settings sections, with the fields and current values.

    Passwords (fields _pw) are not returned.

    ## Example:

      iex> settings = all_settings(Serverboards.Test.User.system)
      iex> (Enum.count settings) > 0
      true
  """
  def all_settings(me) do
    if "settings.view" in me.perms do
      import Ecto.Query
      all_values = Repo.all(Model.Settings) |> Enum.map(fn s -> {s.section,s.data} end)
      all_values = Map.new( all_values )
      Logger.info("all_values #{inspect all_values}")

      # Foe each component and field, gets stored values and put them at "value"
      Serverboards.Plugin.Registry.filter_component(type: "settings")
        |> Enum.map(fn settings ->
          id = settings.plugin.id <> "/" <> settings.id
          fields = settings.extra["fields"]
          values = Map.get(all_values, id, %{})
          fields = Enum.map(fields, fn f ->
            name = Map.get(f, "name", "")
            if String.ends_with? name, "_pw" do
              Map.put(f, "value", "")
            else
              Map.put(f, "value", Map.get( values, name, nil ))
            end
          end)
          c = %{
            name: settings.name,
            id: id,
            fields: fields,
            description: Map.get(settings.extra, "description", "")
           }
        end)
    else
      {:error, :permission_denied}
    end
  end
end
