require Logger

defmodule Serverboards.AuthUserTest do
  use ExUnit.Case
  @moduletag :capture_log

  doctest Serverboards.Auth.Permission
  doctest Serverboards.Auth.User.Password

  alias Serverboards.Auth.{User, Group}
  alias Serverboards.Repo
  import Ecto.Query

  setup_all do
    # Explicitly get a connection before each test
    :ok = Ecto.Adapters.SQL.Sandbox.checkout(Serverboards.Repo)
    # Setting the shared mode must be done only after checkout
    Ecto.Adapters.SQL.Sandbox.mode(Serverboards.Repo, {:shared, self()})

    {:ok, me} = User.user_info("dmoreno@serverboards.io")
    #Ecto.Adapters.SQL.restart_test_transaction(Serverboards.Repo, [])
    :ok = User.user_add(%{
      email: "dmoreno+a@serverboards.io",
      name: "David Moreno",
      is_active: true,
      }, me)
    {:ok, user} = User.user_info("dmoreno+a@serverboards.io", me)

    :ok = User.user_add(%{
      email: "dmoreno+b@serverboards.io",
      name: "David Moreno",
      is_active: true,
      }, me)
    {:ok, userb} = User.user_info("dmoreno+b@serverboards.io", me)
    {:ok, admin} = User.user_info("dmoreno@serverboards.io", me)

    #{:ok, group} = Repo.insert(%Group{ name: "admin" })
    :ok = Group.group_add("admin+a", me)

    {:ok, %{ user: user, userb: userb, admin: admin }}
  end

  test "Set password", %{ user: user, userb: userb } do
    {:error, _} = User.Password.password_set(user, "", user)
    {:error, _} = User.Password.password_set(user, "1234", user)
    {:error, _} = User.Password.password_set(user, "1234567", user)

    password = "12345678"
    :ok = User.Password.password_set(user, password, user)

    #Logger.debug("Check password t #{User.Password.check_password(user, password)}")
    assert User.Password.password_check(user, password, user)
    #Logger.debug("Check password f #{User.Password.check_password(user, password <> "1")}")
    assert User.Password.password_check(user, password <> "1", user) == false

    # Cant change other users password
    {:error, :not_allowed} = User.Password.password_set(user, password, userb)

  end

  test "Set password from console", %{ user: user } do
    password="1234asdf"
    :ok = User.Password.password_set("dmoreno+a@serverboards.io", password)
    assert User.Password.password_check(user, password, user)
  end

  test "Authenticate with password", %{ user: user, admin: admin } do
    password = "abcdefgh"
    :ok = User.Password.password_set(user, password, user)

    userb = User.Password.auth("dmoreno+a@serverboards.io", password)
    assert userb.id == user.id
    Logger.debug("Permissions: #{inspect user.perms}")

    User.user_update user.email, %{is_active: false}, admin
    userb = User.Password.auth("dmoreno+a@serverboards.io", password)
    assert userb == false

    User.user_update user.email, %{is_active: true}, admin
    #Logger.debug("Permissions: #{inspect user.perms}")
  end

  test "Authenticate with token", %{ user: user } do
    _token = case User.Token.create(user) do
      {:error, _} -> flunk "Error creating token!"
      t           -> t
    end

    token = case User.Token.create(user) do
      {:error, _} -> flunk "Error creating second token!"
      t           -> t
    end


    userb = User.Token.auth(token)
    assert userb.id == user.id

    assert User.Token.auth("garbage") == false

    # manual set time_limit to 1 min ago
    tk = Repo.get_by(Serverboards.Auth.User.Model.Token, token: token)
    tl = Timex.shift( DateTime.utc_now, minutes: -1 )
    {:ok, tl} = Ecto.DateTime.cast tl
    #cs = tk |> Ecto.Changeset.cast( %{ time_limit: tl}, [:token, :user_id], [:time_limit] )

    case Repo.update( Ecto.Changeset.cast( tk, %{time_limit: tl}, [:token, :user_id, :time_limit], [] ) ) do
      {:ok, _} -> :ok
      msg -> flunk (inspect msg)
    end

    # now is invalid, expired
    assert User.Token.auth(token) == false

  end
  test "Authenticate with token, custom perms", %{ user: user } do
    token = case User.Token.create(user, ["custom_perm"]) do
      {:error, _} -> flunk "Error creating token!"
      t           -> t
    end
    userb = User.Token.auth(token)
    Logger.debug("Got user is #{inspect userb}")
    assert userb != false
    assert userb.name != ""
    assert userb.perms == ["custom_perm"]
  end

  test "Groups and permissions", %{ user: user, userb: userb, admin: admin } do
    groups = Group.group_list user
    Logger.info(inspect groups)
    assert Enum.member? groups, "admin+a"

    users = Group.user_list "admin+a", user
    assert users == []

    Group.user_add("admin+a", user.email, admin)

    users = Group.user_list "admin+a", user
    assert (hd users) == user.email

    Group.user_add("admin+a", userb.email, admin)

    users = Group.user_list "admin+a", user
    assert Enum.sort(users)  == Enum.sort([user.email, userb.email])

    # Readding is ok
    Group.user_add("admin+a", userb.email, admin)
    Group.user_add("admin+a", userb.email, admin)

    Group.perm_add("admin+a", "auth.modify_self", admin)
    Group.perm_add("admin+a", "debug", admin)

    {:ok, user} = User.user_info (user)
    perms = user.perms
    assert "auth.modify_self" in perms
  end

  test "Password reset", %{ userb: user } do
    alias Test.Client
    import Ecto.Query
    alias Serverboards.Auth.User.Model

    {:ok, client} = Client.start_link as: "dmoreno+b@serverboards.io"

    assert Serverboards.Auth.User.Password.password_set(user, "asdfasdf", user) == :ok
    assert Serverboards.Auth.User.Password.password_check(user, "asdfasdf", user) == true
    Logger.info("User id is #{user.id}")
    Logger.info Serverboards.Utils.table_layout(Repo.all(from p in Model.Password))
    Logger.info Serverboards.Utils.table_layout(Repo.all(from p in Serverboards.Auth.Model.User))

    {:ok, :ok} = Client.call(client,"auth.reset_password", ["dmoreno+b@serverboards.io"])
    # must have sent email, get manually last token
    token = Repo.one(
      from t in Serverboards.Auth.User.Model.Token,
      where: t.perms == ^["auth.reset_password"]
      )
    Logger.info("Token: #{inspect token}")
    token=token.token
    # random token, invalid
    assert {:error, "not_allowed"} == Client.call(
      client,"auth.reset_password", ["dmoreno+b@serverboards.io",
      "decb4e90-7632-428d-a594-6274ecfeae1f", "qwertyqwerty"]
      )
    # change password

    Logger.info Serverboards.Utils.table_layout(Repo.all(from p in Model.Password))

    assert {:ok, :ok} == Client.call(
      client,"auth.reset_password", ["dmoreno+b@serverboards.io",
      token, "qwertyqwerty"])
    # token not valid anymore
    Logger.info Serverboards.Utils.table_layout(Repo.all(from p in Model.Password))

    assert {:error, "not_allowed"} == Client.call(client,"auth.reset_password",
      ["dmoreno+b@serverboards.io", token, "qwertyqwerty"])

    assert Serverboards.Auth.User.Password.password_check(user, "af", user) == false
    assert Serverboards.Auth.User.Password.password_check(user, "asdfasdf", user) == false
    assert Serverboards.Auth.User.Password.password_check(user, "qwertyqwerty", user) == true

    assert Serverboards.Auth.User.Password.password_set(user, "asdfasdf", user) == :ok
  end

  test "Token refresh" do
    alias Test.Client
    import Ecto.Query

    {:ok, client} = Client.start_link as: "dmoreno@serverboards.io"

    {:ok, token} = Client.call(client, "auth.create_token", [])
    assert token != ""
    [time_limit] = Repo.all( from t in Serverboards.Auth.User.Model.Token, where: t.token == ^token, select: t.time_limit )
    :timer.sleep(1500)

    {:ok, res} = Client.call(client, "auth.refresh_token", [token])
    assert res == :ok
    [time_limit2] = Repo.all( from t in Serverboards.Auth.User.Model.Token, where: t.token == ^token, select: t.time_limit )

    assert time_limit != time_limit2
  end
end
