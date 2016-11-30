require Logger

defmodule Serverboards.Settings do
  @doc ~S"""
  Serverboards keeps almost all configuration in datbase to allow easy change
  from UI.

  This module keeps all settings related acesses and changes.

  Each subsection may have specific permissions required.
  """
  import Serverboards.Plugin
  alias Serverboards.Repo
  alias Serverboards.Settings.Model

  def start_link(options) do
    {:ok, es} = EventSourcing.start_link [name: :settings] ++ options
    {:ok, _rpc} = Serverboards.Settings.RPC.start_link

    setup_eventsourcing(es)

    {:ok, es}
  end

  def setup_eventsourcing(es) do
    import EventSourcing

    subscribe es, :update_settings, fn [section, data], _me ->
      update_real(section, data)
    end
    subscribe es, :update_user_settings, fn [email, section, data], _me ->
      update_user_real(email, section, data)
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

  def update_real(section, data) do
    #Logger.info("Update settings, #{section}: #{inspect data}")
    case Repo.get_by(Model.Settings, section: section) do
      nil ->
        Repo.insert( %Model.Settings{section: section, data: data} )
      sec ->
        #Logger.debug("#{inspect sec}")
        Repo.update( Model.Settings.changeset(sec, %{data: data}) )
    end
    MOM.Channel.send(:settings, %MOM.Message{payload: %{ type: :update, section: section, data: data }})
    :ok
  end

  def user_update(email, section, data, me) do
    EventSourcing.dispatch(:settings, :update_user_settings, [email, section, data], me)
    :ok
  end
  def update_user_real(email, section, nil) do
    import Ecto.Query

    query = from s in Model.UserSettings,
            join: u in Serverboards.Auth.Model.User,
              on: u.id == s.user_id,
           where: u.email == ^email and s.section == ^section

    Repo.delete_all( query )
  end
  def update_user_real(email, section, data) do
    import Ecto.Query
    [user] = Repo.all(from u in Serverboards.Auth.Model.User, where: u.email == ^email)
    user_id = user.id
    #Logger.info("Update settings, #{section}: #{inspect data}")
    case Repo.get_by(Model.UserSettings, section: section, user_id: user_id) do
      nil ->
        Repo.insert( %Model.UserSettings{section: section, data: data, user_id: user_id} )
      sec ->
        #Logger.debug("#{inspect sec}")
        Repo.update( Model.UserSettings.changeset(sec, %{data: data}) )
    end
    MOM.Channel.send(:user_settings, %MOM.Message{payload: %{ type: :update, user: user, section: section, data: data }})
    :ok
  end



  @doc ~S"""
    Returns a list with all settings sections, with the fields and current values.

    Passwords (fields _pw) are not returned.

    ## Example:

      iex> settings = all_settings(Test.User.system)
      iex> (Enum.count settings) > 0
      true
  """
  def all_settings(me) do
    if "settings.view" in me.perms do
      all_values = Repo.all(Model.Settings) |> Enum.map(fn s -> {s.section,s.data} end)
      all_values = Map.new( all_values )
      #Logger.info("all_values #{inspect all_values}")

      # Foe each component and field, gets stored values and put them at "value"
      Serverboards.Plugin.Registry.filter_component(type: "settings")
        |> Enum.map(fn settings ->
          id = settings.id
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
          %{
            name: settings.name,
            id: id,
            fields: fields,
            description: Map.get(settings.extra, "description", ""),
            order: settings.extra["order"] || 0
           }
        end)
    else
      {:error, :permission_denied}
    end
  end

  @doc ~S"""
  Returns the full config of a given setting. There is no hidding of
  _pw fields. May require special perms.
  """
  def get(id) do
    import Ecto.Query
    case Repo.all(from s in Model.Settings, where: s.section == ^id) do
      [] ->
        {:error, :not_found}
      [other] ->
        {:ok, other.data}
    end
  end
  def get(id, default) do
    case get(id) do
      {:error, :not_found} -> default
      {:ok, o} -> o
    end
  end

  @doc ~S"""
  Gets data from a given user, or nil if not
  """
  def user_get(email, section) do
    import Ecto.Query
    query = from s in Model.UserSettings,
            join: u in Serverboards.Auth.Model.User,
              on: u.id == s.user_id,
           where: u.email == ^email and s.section == ^section,
           select: s.data
    case Repo.all(query) do
      [] -> nil
      [other] -> other
    end
  end
end
