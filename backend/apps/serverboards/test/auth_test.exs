require Logger

defmodule Serverboards.AuthTest do
  use ExUnit.Case, async: false
	alias Test.Client
	@moduletag :capture_log

  setup_all do
    alias Serverboards.Auth.{User, Group, UserGroup, GroupPerms, Permission}
    alias Serverboards.Repo
    alias Serverboards.Auth.User.{Password, Token}
    import Ecto.Query

    Repo.delete_all(UserGroup)
    Repo.delete_all(GroupPerms)
    Repo.delete_all(Permission)
    Repo.delete_all(Group)
    Repo.delete_all(User)
    Repo.delete_all(Token)
    Repo.delete_all(Password)

    {:ok, user} = Repo.insert(%User{
      email: "dmoreno@serverboards.io",
      first_name: "David",
      last_name: "Moreno",
      is_active: true,
      })

    user = User.get_user("dmoreno@serverboards.io")
    User.Password.set_password(user, "asdfghjkl")

    {:ok, g_admin} = Repo.insert(%Group{ name: "admin" })
    {:ok, g_user} = Repo.insert(%Group{ name: "user" })

    Permission.ensure_exists("auth.modify_self")
    Permission.ensure_exists("debug")

    Group.add_perm(g_admin, "debug")
    Group.add_perm(g_user, "modify_self")

    Group.add_user(g_admin, user)
    Group.add_user(g_user, user)

    :ok
  end

  test "User auth" do
    {:ok, client} = Client.start_link
		Task.async( fn -> Serverboards.Auth.authenticate(client) end)

    Client.expect( client, method: "auth.required" )
		assert Client.call( client, "auth.auth", %{ "type" => "basic", "email" => "dmoreno@serverboards.io", "password" => "asdfghjkl" }, 1) != false
  end


	test "Token auth" do

		{:ok, client} = Client.start_link
		Task.async( fn -> Serverboards.Auth.authenticate(client) end)

		Client.expect( client, method: "auth.required" )
		assert Client.call( client, "auth.auth", %{ "type" => "token", "token" => "xxx" }, 1) == false

    user = Serverboards.Auth.User.get_user "dmoreno@serverboards.io"
    token = Serverboards.Auth.User.Token.create(user)

		user = Client.call( client, "auth.auth", %{ "type" => "token", "token" => token }, 2)
		assert user != false
		assert user.email == "dmoreno@serverboards.io"

		Logger.info("#{inspect user}")

	end

end
