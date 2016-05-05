require Logger

defmodule Serverboards.AuthUserTest do
  use ExUnit.Case
  @moduletag :capture_log

  doctest Serverboards.Auth.Permission

  alias Serverboards.Auth.{User, Group, UserGroup, GroupPerms, Permission}
  alias Serverboards.Repo
  import Ecto.Query

  setup_all do
    #Ecto.Adapters.SQL.restart_test_transaction(Serverboards.Repo, [])

    {:ok, user} = Repo.insert(%User{
      email: "dmoreno+a@serverboards.io",
      first_name: "David",
      last_name: "Moreno",
      is_active: true,
      })

    {:ok, userb} = Repo.insert(%User{
      email: "dmoreno+b@serverboards.io",
      first_name: "David",
      last_name: "Moreno B",
      is_active: true,
      })


    #{:ok, group} = Repo.insert(%Group{ name: "admin" })
    {:ok, group} = Repo.insert(%Group{ name: "admin+a" })

    {:ok, %{ user: user, userb: userb }}
  end

  # this was to learn how to use ecto... but staus as its a good test.
  test "Get users" do
    query = from u in User

    res = Repo.all(query)
    assert (Enum.count res) >= 2
    #Logger.debug("#{inspect res}")

    user = Repo.get_by(User, email: "dmoreno+a@serverboards.io")
    assert user.email == "dmoreno+a@serverboards.io"
    assert user.first_name == "David"
    assert user.last_name == "Moreno"
    #Logger.debug("#{inspect user}")

    user2 = Repo.get(User, user.id)
    assert user2.email == "dmoreno+a@serverboards.io"
    assert user2.first_name == "David"
    assert user2.last_name == "Moreno"
    #Logger.debug("#{inspect user2}")
  end

  test "Set password", %{ user: user } do
    {:error, _} = User.Password.set_password(user, "")
    {:error, _} = User.Password.set_password(user, "1234")
    {:error, _} = User.Password.set_password(user, "1234567")

    password = "abcdefgh"
    :ok = User.Password.set_password(user, password)

    #Logger.debug("Check password t #{User.Password.check_password(user, password)}")
    assert User.Password.check_password(user, password)
    #Logger.debug("Check password f #{User.Password.check_password(user, password <> "1")}")
    assert User.Password.check_password(user, password <> "1") == false
  end

  test "Authenticate with password", %{ user: user } do
    password = "abcdefgh"
    :ok = User.Password.set_password(user, password)

    userb = User.Password.auth("dmoreno+a@serverboards.io", password)
    assert userb.id == user.id
    Logger.debug("Permissions: #{inspect User.get_perms user}")

    Repo.update(User.changeset(user, %{ is_active: false }))
    userb = User.Password.auth("dmoreno+a@serverboards.io", password)
    assert userb == false

    Repo.update(User.changeset(user, %{ is_active: true }))
    #Logger.debug("Permissions: #{inspect user.perms}")
  end

  test "Authenticate with token", %{ user: user } do
    token = case User.Token.create(user) do
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
    tk = Repo.get_by(User.Token, token: token)
    tl = Timex.to_erlang_datetime( Timex.shift( Timex.DateTime.now, minutes: -1 ) )
    {:ok, tl} = Ecto.DateTime.cast tl
    #cs = tk |> Ecto.Changeset.cast( %{ time_limit: tl}, [:token, :user_id], [:time_limit] )
    case Repo.update( %User.Token{ tk | time_limit: tl} ) do
      {:ok, _} -> :ok
      msg -> flunk (inspect msg)
    end

    # now is invalid, expired
    assert User.Token.auth(token) == false

  end


  test "Groups and permissions", %{ user: user, userb: userb } do
    admin = Repo.get_by(Group, name: "admin+a")

    assert admin.name == "admin+a"

    users = Repo.all( Group.users(admin) )
    assert users == []

    Group.add_user(admin, user)

    users = Repo.all( Group.users(admin) )
    assert (hd users).id == user.id

    Group.add_user(admin, userb)

    users = Repo.all( Group.users(admin) )
    assert Enum.sort(for u <- users, do: u.id)  == Enum.sort [user.id, userb.id]

    # Readding is ok
    Group.add_user(admin, userb)
    Group.add_user(admin, userb)

    Group.add_perm(admin, "auth.modify_self")
    Group.add_perm(admin, "debug")

    perms = User.get_perms(user)
    assert "auth.modify_self" in perms

  end
end
