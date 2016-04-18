require Logger

defmodule Serverboards.AuthTest do
  use ExUnit.Case, async: false
	alias Test.Client
	#@moduletag :capture_log

  setup_all do
    Client.reset_db()
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
