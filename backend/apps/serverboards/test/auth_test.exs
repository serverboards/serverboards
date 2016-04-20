require Logger

defmodule Serverboards.AuthTest do
  use ExUnit.Case, async: false
	alias Test.Client
	@moduletag :capture_log

  doctest Serverboards.Auth, import: true

  setup_all do
    Client.reset_db()
    :ok
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
		assert Client.call( client, "auth.auth", %{ "type" => "token", "token" => "xxx" }) == false

    user = Serverboards.Auth.User.get_user "dmoreno@serverboards.io"
    token = Serverboards.Auth.User.Token.create(user)

		user = Client.call( client, "auth.auth", %{ "type" => "token", "token" => token })
		assert user != false
		assert user.email == "dmoreno@serverboards.io"

		Logger.info("#{inspect user}")
	end

end
