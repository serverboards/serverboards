require Logger

defmodule Serverboards.Event do
  import MOM

  @doc ~S"""
  Setups the system so that new users are subscribed to :client_events channel

  It also do all the required checking to user has access to such messages and
  so on.
  """
  def start_link(options) do
    MOM.Channel.subscribe(:auth_authenticated, fn %{ payload: %{ client: client, user: user } } ->
      MOM.Channel.subscribe(:client_events, fn %{ payload: payload } ->
        subscriptions = MOM.RPC.Client.get client, :subscriptions, []
        event_type = payload.type

        # only send if in subscriptions.
        if subscriptions == [] or event_type in subscriptions do
          guards = Map.get(payload, :guards, [])
          user = Serverboards.Auth.User.user_info user.email, user
          #Logger.debug("Perms: #{inspect user.perms} / #{inspect guards}")
          if check_guards(guards, user) do
            try do
              MOM.RPC.Client.event_to_client(
                client, event_type,
                Serverboards.Utils.clean_struct(payload.data)
                )
            rescue
              e ->
                Logger.error("Error sending event: #{inspect e}\n#{Exception.format_stacktrace}")
            end
          else
            Logger.debug("Guard prevented send event #{inspect event_type} to client. #{inspect guards} #{inspect client}")
          end
        end
        :ok
      end)
    end)

    MOM.Channel.subscribe(:client_events, fn %{ payload: payload } ->
      Logger.info("Sent #{payload.type} event: #{inspect payload}.")
    end)

    Serverboards.Event.RPC.start_link(options)
  end

  @doc ~S"""
  Checks some guards to prevent send an event to a client.

  There are two possible formats:

  ## Permission list

  A list of permissions that user must have:

    iex> user = %{ email: "system", perms: ["perm1", "perm2", "perm3"]}
    iex> check_guards(["perm1","perm2"], user)
    true
    iex> check_guards(["perm1","perm4"], user)
    false

  ## A dict with some conditions

  ### Specific user

  This is necesary to updates that affect this user, but has no permissions
  to see other users.

    iex> user = %{ email: "system", perms: ["perm1", "perm2", "perm3"]}
    iex> check_guards(%{ user: "system"}, user)
    true
    iex> check_guards(%{ user: "system2"}, user)
    false

  ### List of permissions

    A list of permissions, as in just a list of permissions, inside a dict.
    This helps composability with the user option.

    iex> user = %{ email: "system", perms: ["perm1", "perm2", "perm3"]}
    iex> check_guards(%{ perms: ["perm1","perm2"]}, user)
    true
    iex> check_guards(%{ perms: ["perm1","perm4"]}, user)
    false

  ### TODO Permission list and a context path

  A context path is used to extract the permissions of some user in a specific
  place, as a serverboard or service.

  user = %{ email: "system", perms: [service.attach"] }
  check_guards(%{ context: "/service/TEST", perms: ["service.attach"]}, user)

  Not implemented yet.
  """
  def check_guards([], _user), do: true
  def check_guards([perm | rest], user) do
    if perm in user.perms do
      check_guards(rest, user)
    else
      false
    end
  end

  def check_guards(%{} = map, _user) when map == %{}, do: true
  # check user as given
  def check_guards(%{ user: email} = guards, user) do
    if email == user.email do
      guards = Map.drop(guards, [:user])
      check_guards(guards, user)
    else
      false
    end
  end
  # check perms
  def check_guards(%{ perms: perms} = guards, user) do
    if check_guards(perms, user) do
      check_guards(Map.drop(guards, [:perms]), user)
    else
      false
    end
  end

  @doc ~S"""
  Simple emit an event

  Its just a MOM.Channel.send, but helps the separation of concerns.

  ## Example

    iex> emit("test.event", %{ foo: :bar}, ["required_permission"])
    :ok
  """
  def emit(type, data, guards \\ []) do
    MOM.Channel.send(:client_events, %MOM.Message{ payload: %{
      type: type, data: data, guards: guards
    } })
  end
end
