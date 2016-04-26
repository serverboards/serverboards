require Logger

defmodule ServiceTest do
  use ExUnit.Case
  @moduletag :capture_log

  doctest Serverboards.Service, import: true


  test "Service lifecycle" do
    import Serverboards.Service

    user = Serverboards.Auth.User.get_user("dmoreno@serverboards.io")
    {:ok, service} = service_add "SBDS-TST3", %{ "name" => "serverboards" }, user
    {:ok, service} = service_update service.id, %{ "name" => "Serverboards" }, user
    {:ok, info} = service_info service.id, user
    assert info["name"] == "Serverboards"
    {:ok, json} = JSON.encode(info)
    Logger.debug("Result json: #{json}")
    assert not String.contains? json, "__"

    :ok = service_delete "SBDS-TST3", user
    assert {:error, :not_found} == service_info service.id, user
  end

  test "Services as a client" do
    {:ok, client} = Test.Client.start_link as: "dmoreno@serverboards.io"

    {:ok, dir} = Test.Client.call client, "dir", []
    Logger.debug("Known methods: #{inspect dir}")
    assert Enum.member? dir, "service.list"
    assert Enum.member? dir, "service.add"
    assert Enum.member? dir, "service.delete"
    assert Enum.member? dir, "service.info"

    {:ok, json} = JSON.encode(Test.Client.debug client)
    Logger.info("Debug information: #{json}")

    {:ok, l} = Test.Client.call client, "service.list", []
    assert (Enum.count l) == 0

    Test.Client.stop(client)
  end
end
