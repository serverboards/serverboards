require Logger

defmodule Serverboards.AuthTest do
  use ExUnit.Case, async: false
  doctest Serverboards.Auth
  alias Serverboards.Auth.{Repo, User}
  import Ecto.Query

  test "01. Remove all" do
    Repo.delete_all(User)

    query = from u in User
    res = Repo.all(query)
    assert (Enum.count res) == 0
  end

  test "02. Create and get an user" do
    Repo.delete_all(User)

    Repo.insert(%User{
      email: "dmoreno@serverboards.io",
      first_name: "David",
      last_name: "Moreno"
      })


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

  test "02. Set password" do
    Repo.delete_all(User)

    {:ok, user} = Repo.insert(%User{
      email: "dmoreno@serverboards.io",
      first_name: "David",
      last_name: "Moreno"
      })

    password = "abcdefgh"
    {:ok, pw} = User.Password.set_password(user, password)
    Logger.debug("#{inspect pw}")
    assert pw.password != password

    Logger.debug("Check password t #{User.Password.check_password(user, password)}")
    assert User.Password.check_password(user, password)
    Logger.debug("Check password f #{User.Password.check_password(user, password <> "1")}")
    assert User.Password.check_password(user, password <> "1") == false
  end
end
