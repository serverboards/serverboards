require Logger

defmodule Serverboards.AuthUserTest do
  use ExUnit.Case, async: false
  @moduletag :capture_log

  doctest Serverboards.Auth
  doctest Serverboards.Auth.Permission

  alias Serverboards.Auth.{User, Repo, Group, UserGroup, GroupPerms, Permission}
  import Ecto.Query

  setup_all do
    Repo.delete_all(UserGroup)
    Repo.delete_all(GroupPerms)
    Repo.delete_all(Permission)
    Repo.delete_all(Group)
    Repo.delete_all(User)

    {:ok, user} = Repo.insert(%User{
      email: "dmoreno@serverboards.io",
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
    {:ok, group} = Repo.insert(%Group{ name: "admin" })
    {:ok, group} = Repo.insert(%Group{ name: "user" })

    {:ok, perm} = Repo.insert(%Permission{ code: "auth.create_user" })
    {:ok, perm} = Repo.insert(%Permission{ code: "auth.view_all_users" })


    {:ok, %{ user: user, userb: userb }}
  end

  # this was to learn how to use ecto... but staus as its a good test.
  test "Get users" do
    query = from u in User

    res = Repo.all(query)
    assert (Enum.count res) == 2
    #Logger.debug("#{inspect res}")

    user = Repo.get_by(User, email: "dmoreno@serverboards.io")
    assert user.email == "dmoreno@serverboards.io"
    assert user.first_name == "David"
    assert user.last_name == "Moreno"
    #Logger.debug("#{inspect user}")

    user2 = Repo.get(User, user.id)
    assert user2.email == "dmoreno@serverboards.io"
    assert user2.first_name == "David"
    assert user2.last_name == "Moreno"
    #Logger.debug("#{inspect user2}")
  end

  test "Set password", %{ user: user } do
    password = "abcdefgh"
    {:ok, pw} = User.Password.set_password(user, password)
    Logger.debug("#{inspect pw}")
    assert pw.password != password

    #Logger.debug("Check password t #{User.Password.check_password(user, password)}")
    assert User.Password.check_password(user, password)
    #Logger.debug("Check password f #{User.Password.check_password(user, password <> "1")}")
    assert User.Password.check_password(user, password <> "1") == false
  end

  test "Authenticate", %{ user: user } do
    password = "abcdefgh"
    {:ok, pw} = User.Password.set_password(user, password)

    userb = User.auth("dmoreno@serverboards.io", password)
    assert userb.id == user.id
    Logger.debug("Permissions: #{inspect user.perms}")

    Repo.update(User.changeset(user, %{ is_active: false }))
    userb = User.auth("dmoreno@serverboards.io", password)
    assert userb == false

    Repo.update(User.changeset(user, %{ is_active: true }))
    #Logger.debug("Permissions: #{inspect user.perms}")
  end

  test "Groups and permissions", %{ user: user, userb: userb } do
    admin = Repo.get_by(Group, name: "admin")

    assert admin.name == "admin"

    users = Repo.all( Group.users(admin) )
    assert users == []

    Group.add_user(admin, user)

    users = Repo.all( Group.users(admin) )
    assert (hd users).id == user.id

    Group.add_user(admin, userb)

    users = Repo.all( Group.users(admin) )
    assert (for u <- users, do: u.id)  == [user.id, userb.id]

    assert_raise Ecto.ConstraintError, fn ->
      Group.add_user(admin, userb)
    end

    Group.add_perm(admin, "auth.create_user")

    perms = User.get_perms(user)
    assert "auth.create_user" in perms

  end
end
