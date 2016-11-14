require Logger

defmodule Serverboards.AuthTest do
  use ExUnit.Case, async: false
	alias Test.Client
	@moduletag :capture_log
  @freepass "serverboards.test.auth/freepass"

  doctest Serverboards.Auth, import: true
  doctest Serverboards.Auth.Reauth, import: true

  setup do
    # Explicitly get a connection before each test
    :ok = Ecto.Adapters.SQL.Sandbox.checkout(Serverboards.Repo)
    # Setting the shared mode must be done only after checkout
    Ecto.Adapters.SQL.Sandbox.mode(Serverboards.Repo, {:shared, self()})
  end

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
		assert user["email"] == "dmoreno@serverboards.io"

		Logger.info("#{inspect user}")
	end

  test "Manage groups" do
    {:ok, client} = Client.start_link as: "dmoreno@serverboards.io"

    {:ok, groups} = Client.call( client, "group.list", [] )
    assert MapSet.subset? MapSet.new(["admin","user"]), MapSet.new(groups)
    {:ok, :ok} = Client.call(client, "group.add", ["test"])
    Client.expect( client, [method: "group.added"], 500 )

    {:ok, groups} = Client.call( client, "group.list", [] )
    assert MapSet.subset? MapSet.new(["admin","user","test"]), MapSet.new(groups)

    {:ok, :ok} = Client.call(client, "group.add_user", ["test", "dmoreno@serverboards.io"])
    Client.expect( client, [method: "group.user_added"], 500 )

    {:ok, :ok} = Client.call(client, "group.add_perm", ["test", "auth.modify_self"])
    Client.expect( client, [method: "group.perm_added"], 500 )
    {:ok, perms} = Client.call(client, "group.list_perms", ["test"])
    assert perms == ["auth.modify_self"]

    {:ok, :ok} = Client.call(client, "group.remove_perm", ["test", "auth.modify_self"])
    Client.expect( client, [method: "group.perm_removed"], 500 )
    {:ok, perms} = Client.call(client, "group.list_perms", ["test"])
    assert perms == []

    assert Client.call(client, "group.list_users", ["test"]) == {:ok, ["dmoreno@serverboards.io"]}

    {:ok, :ok} = Client.call(client, "group.remove_user", ["test", "dmoreno@serverboards.io"])
    Client.expect( client, [method: "group.user_removed"], 500 )

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
        "name" => "test", "is_active" => true
      })

    {:ok, _client2} = Client.start_link as: "dmoreno+c@serverboards.io"

    {:ok, :ok} = Client.call(client, "user.update", ["dmoreno+c@serverboards.io", %{ "is_active" => false }])

    {:error, :cant_log_in} = Client.start_link as: "dmoreno+c@serverboards.io"

    {:ok, list} = Client.call(client, "user.list", [])
    assert Enum.find list, &( &1["email"] == "dmoreno+c@serverboards.io" )
    Logger.info(inspect list)
  end


  test "Remove perms and test RPC" do
    {:ok, client} = Client.start_link as: "dmoreno@serverboards.io"

    # I have it here
    {:ok, user} = Client.call(client, "auth.user", [])
    assert "auth.create_user" in user["perms"]

    {:ok, :ok} = Client.call(client, "group.remove_perm", ["admin", "auth.create_user"])
    Client.expect(client, method: "group.perm_removed")
    Client.expect(client, method: "user.updated")

    # automatically removed at server
    {:ok, user} = Client.call(client, "auth.user", [])
    assert not "auth.create_user" in user["perms"]

    {:error, :unknown_method} = Client.call(client, "user.add", %{
      "email" => "test+rmtr@serverboards.io",
      "name" => "test",
      "is_active" => "true"
      })

    {:ok, dir} = Client.call(client, "dir", [])
    assert not "user.add" in dir

    {:ok, :ok} = Client.call(client, "group.add_perm", ["admin", "auth.create_user"])
  end

  test "Perm list" do
    {:ok, client} = Client.start_link as: "dmoreno@serverboards.io"

    {:ok, list} = Client.call(client, "perm.list", [])
    assert (Enum.count list) > 0
  end

  test "Reauth" do
    {:ok, client} = Client.start_link as: "dmoreno@serverboards.io", reauth: false

    Client.set(client, :test_reauth, :none)

    ret = Client.call(client, "auth.test_reauth", [])
    {:error, %{
      "type" => "needs_reauth",
      "uuid" => uuid,
      "available" => available
      }
    } = ret

    Logger.debug("UUID #{uuid}")
    assert @freepass in available

    ret = Client.call(client, "auth.reauth", %{ uuid: uuid, data: %{ type: @freepass }})
    assert ret == {:ok, "reauth_success"}

    Client.stop(client)
  end

  test "Reauth fail" do
    {:ok, client} = Client.start_link as: "dmoreno@serverboards.io", reauth: false

    Client.set(client, :test_reauth, :none)

    ret = Client.call(client, "auth.test_reauth", [])
    {:error, %{
      "type" => "needs_reauth",
      "uuid" => uuid,
      "available" => available
      }
    } = ret

    Logger.debug("UUID #{uuid}")
    assert @freepass in available

    ret = Client.call(client, "auth.reauth", %{ uuid: uuid, data: %{ type: "nopass" }})
    {:error, %{
      "type" => "needs_reauth",
      "uuid" => ^uuid,
      "available" => _available
      }
    } = ret


    Client.stop(client)
  end

  test "Reauth basic" do
    import Serverboards.Auth.Reauth

    {:ok, r} = start_link
    msg = request_reauth r, fn -> :reauth_success end
    assert msg.type == :needs_reauth
    assert "token" in msg.available
    res = reauth r, msg.uuid, %{ "type" => @freepass, "data" => %{} }
    assert res == :reauth_success
  end

  test "Change user password using RPC" do
    {:ok, client} = Client.start_link as: "dmoreno@serverboards.io"

    user = Client.get(client, :user, nil)
    assert false == Serverboards.Auth.User.Password.password_check(user, "fdsafdsa", user)
    assert true == Serverboards.Auth.User.Password.password_check(user, "asdfasdf", user)

    assert {:ok, :ok} == Client.call(client, "auth.set_password", ["asdfasdf", "fdsafdsa"])
    assert false == Serverboards.Auth.User.Password.password_check(user, "asdfasdf", user)
    assert true == Serverboards.Auth.User.Password.password_check(user, "fdsafdsa", user)

    assert {:ok, :ok} == Client.call(client, "auth.set_password", ["fdsafdsa", "asdfasdf"])
    assert false == Serverboards.Auth.User.Password.password_check(user, "fdsafdsa", user)
    assert true == Serverboards.Auth.User.Password.password_check(user, "asdfasdf", user)


    Logger.warn("Should fail")
    assert {:error, "invalid_password"} == Client.call(client, "auth.set_password", ["fdsafdsa", "asdfasdf"])
  end

  test "Use custom login, only email; reuse of fail" do
    {:ok, user} = Serverboards.Auth.auth(%{ "type" => @freepass, "email" => "dmoreno@serverboards.io"})
    assert user.email == "dmoreno@serverboards.io"
    assert "user" in user.groups
    assert "admin" in user.groups
    assert "plugin" in user.perms

    # fail if do not exist
    {:error, :unknown_user} = Serverboards.Auth.auth(%{ "type" => @freepass, "email" => "dmoreno--XX@serverboards.io"})
  end
end
