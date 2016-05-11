require Logger

defmodule Serverboards.AuthTest do
  use ExUnit.Case
	alias Test.Client
	#@moduletag :capture_log

  doctest Serverboards.Auth, import: true

  test "User auth" do
    {:ok, client} = Client.start_link
		Task.async( fn -> Serverboards.Auth.authenticate(client) end)

    Client.expect( client, method: "auth.required" )
		assert Client.call( client, "auth.auth", %{ "type" => "basic", "email" => "dmoreno@serverboards.io", "password" => "asdfghjkl" }) != false
  end


	test "Token auth" do
		{:ok, client} = Client.start_link
		Task.async( fn -> Serverboards.Auth.authenticate(client) end)

		Client.expect( client, method: "auth.required" )
		assert Client.call( client, "auth.auth", %{ "type" => "token", "token" => "xxx" }) == {:ok, false}

    user = Serverboards.Auth.User.user_info "dmoreno@serverboards.io", %{ email: "dmoreno@serverboards.io" }
    token = Serverboards.Auth.User.Token.create(user)

		{:ok, user} = Client.call( client, "auth.auth", %{ "type" => "token", "token" => token })
		assert user != false
		assert user.email == "dmoreno@serverboards.io"

		Logger.info("#{inspect user}")
	end

  test "Manage groups" do
    {:ok, client} = Client.start_link as: "dmoreno@serverboards.io"

    {:ok, groups} = Client.call( client, "group.list", [] )
    assert (Enum.sort(groups)) == ["admin","user"]

    {:ok, :ok} = Client.call(client, "group.add", ["test"])
    Client.expect( client, method: "group.added" )

    {:ok, groups} = Client.call( client, "group.list", [] )
    assert (Enum.sort(groups)) == ["admin","test", "user"]

    {:ok, :ok} = Client.call(client, "group.add_user", ["test", "dmoreno@serverboards.io"])
    Client.expect( client, method: "group.user_added" )

    {:ok, :ok} = Client.call(client, "group.add_perm", ["test", "auth.modify_self"])
    Client.expect( client, method: "group.perm_added" )
    {:ok, perms} = Client.call(client, "group.list_perms", ["test"])
    assert perms == ["auth.modify_self"]

    {:ok, :ok} = Client.call(client, "group.remove_perm", ["test", "auth.modify_self"])
    Client.expect( client, method: "group.perm_removed" )
    {:ok, perms} = Client.call(client, "group.list_perms", ["test"])
    assert perms == []

    assert Client.call(client, "group.list_users", ["test"]) == {:ok, ["dmoreno@serverboards.io"]}

    {:ok, :ok} = Client.call(client, "group.remove_user", ["test", "dmoreno@serverboards.io"])
    Client.expect( client, method: "group.user_removed" )

    assert Client.call(client, "group.list_users", ["test"]) == {:ok, []}

  end

end
