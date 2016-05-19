require Logger

defmodule Serverboards.AuthTest do
  use ExUnit.Case, async: false
	alias Test.Client
	@moduletag :capture_log

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
    assert MapSet.subset? MapSet.new(["admin","user"]), MapSet.new(groups)

    {:ok, :ok} = Client.call(client, "group.add", ["test"])
    Client.expect( client, method: "group.added" )

    {:ok, groups} = Client.call( client, "group.list", [] )
    assert MapSet.subset? MapSet.new(["admin","user","test"]), MapSet.new(groups)

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

    assert Client.call(client, "group.remove", ["test"]) == {:ok, :ok}
    {:ok, groups} = Client.call( client, "group.list", [] )
    assert MapSet.subset? MapSet.new(["admin","user"]), MapSet.new(groups)
    assert not Enum.member? groups, "test"

    assert Client.call(client, "group.remove", ["test"]) == {:ok, :ok}
  end

  test "Manage users" do
    {:ok, client} = Client.start_link as: "dmoreno@serverboards.io"

    {:ok, :ok} = Client.call(client, "user.add",
      %{ "email" => "dmoreno+c@serverboards.io",
        "first_name" => "test", "last_name" => "test2", "is_active" => true
      })

    {:ok, client2} = Client.start_link as: "dmoreno+c@serverboards.io"

    {:ok, :ok} = Client.call(client, "user.update", ["dmoreno+c@serverboards.io", %{ "is_active" => false }])

    {:error, :cant_log_in} = Client.start_link as: "dmoreno+c@serverboards.io"

    {:ok, list} = Client.call(client, "user.list", [])
    assert Enum.find list, &( &1.email == "dmoreno+c@serverboards.io" )
    Logger.info(inspect list)
  end


  test "Remove perms and test RPC" do
    {:ok, client} = Client.start_link as: "dmoreno@serverboards.io"

    # I have it here
    {:ok, user} = Client.call(client, "auth.user", [])
    assert "auth.create_user" in user.perms

    {:ok, :ok} = Client.call(client, "group.remove_perm", ["admin", "auth.create_user"])
    Client.expect(client, method: "group.perm_removed")
    Client.expect(client, method: "user.updated")

    # automatically removed at server
    {:ok, user} = Client.call(client, "auth.user", [])
    assert not "auth.create_user" in user.perms

    {:error, :unknown_method} = Client.call(client, "user.add", %{
      "email" => "test+rmtr@serverboards.io",
      "first_name" => "test",
      "last_name" => "RPC",
      "is_active" => "true"
      })

    {:ok, dir} = Client.call(client, "dir", [])
    assert not "user.add" in dir

    {:ok, :ok} = Client.call(client, "group.add_perm", ["admin", "auth.create_user"])
  end

end
