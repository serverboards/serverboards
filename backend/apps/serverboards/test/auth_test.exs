require Logger

defmodule Serverboards.AuthTest do
  use ExUnit.Case
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

end
