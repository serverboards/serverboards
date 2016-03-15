require Logger

defmodule Serverboards.AuthTest do
  use ExUnit.Case, async: false
  doctest Serverboards.Auth
  alias Serverboards.Auth.{Repo, User}
  import Ecto.Query

  setup do
    Repo.delete_all(User)

    {:ok, user} = Repo.insert(%User{
      email: "dmoreno@serverboards.io",
      first_name: "David",
      last_name: "Moreno"
      })
    :ok
  end

  # this was to learn how to use ecto... but staus as its a good test.
  test "Get users" do
    query = from u in User

    res = Repo.all(query)
    assert (Enum.count res) == 1
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

  test "Set password" do
    user = Repo.get_by(User, email: "dmoreno@serverboards.io")

    password = "abcdefgh"
    {:ok, pw} = User.Password.set_password(user, password)
    Logger.debug("#{inspect pw}")
    assert pw.password != password

    #Logger.debug("Check password t #{User.Password.check_password(user, password)}")
    assert User.Password.check_password(user, password)
    #Logger.debug("Check password f #{User.Password.check_password(user, password <> "1")}")
    assert User.Password.check_password(user, password <> "1") == false
  end

  test "Authenticate" do
    user = Repo.get_by(User, email: "dmoreno@serverboards.io")

    password = "abcdefgh"
    {:ok, pw} = User.Password.set_password(user, password)

    userb = User.auth("dmoreno@serverboards.io", password)
    assert userb.id == user.id
    Logger.debug("Permissions: #{inspect user.perms}")
  end

  test "Auth peer" do
    user = Repo.get_by(User, email: "dmoreno@serverboards.io")

    password = "abcdefghu"
    {:ok, pw} = User.Password.set_password(user, password)

    userb = Serverboards.Peer.call(%Serverboards.Auth{}, "auth", ["dmoreno@serverboards.io", password])
    assert userb.id == user.id
    Logger.debug("Permissions: #{inspect user.perms}")
  end
end
