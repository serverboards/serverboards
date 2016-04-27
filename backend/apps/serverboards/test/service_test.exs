require Logger

defmodule ServiceTest do
  use ExUnit.Case
  #@moduletag :capture_log

  doctest Serverboards.Service.Service, import: true


  test "Service lifecycle" do
    import Serverboards.Service.Service

    user = Serverboards.Auth.User.get_user("dmoreno@serverboards.io")
    {:ok, service} = service_add "SBDS-TST3", %{ "name" => "serverboards" }, user
    {:ok, service} = service_update service.id, %{ "name" => "Serverboards" }, user
    {:ok, info} = service_info service.id, user
    assert info.name == "Serverboards"

    :ok = service_delete "SBDS-TST3", user
    assert {:error, :not_found} == service_info service.id, user
  end

  test "Update services tags" do
    import Serverboards.Service.Service

    user = Serverboards.Auth.User.get_user("dmoreno@serverboards.io")
    {:ok, _service} = service_add "SBDS-TST4", %{ "name" => "serverboards" }, user

    {:ok, _service} = service_update "SBDS-TST4", %{ "tags" => ~w(tag1 tag2 tag3)}, user
    {:ok, info } = service_info "SBDS-TST4", user
    Logger.debug("Current service info: #{inspect info}")
    assert Enum.member? info.tags, "tag1"
    assert Enum.member? info.tags, "tag2"
    assert Enum.member? info.tags, "tag3"
    assert not (Enum.member? info.tags, "tag4")

    service_update "SBDS-TST4", %{ "tags" => ~w(tag1 tag2 tag4) }, user
    {:ok, info } = service_info "SBDS-TST4", user
    assert Enum.member? info.tags, "tag1"
    assert Enum.member? info.tags, "tag2"
    assert not (Enum.member? info.tags, "tag3")
    assert Enum.member? info.tags, "tag4"

    :ok = service_delete "SBDS-TST4", user
  end

  test "Services as a client" do
    {:ok, client} = Test.Client.start_link as: "dmoreno@serverboards.io"

    {:ok, dir} = Test.Client.call client, "dir", []
    Logger.debug("Known methods: #{inspect dir}")
    assert Enum.member? dir, "service.list"
    assert Enum.member? dir, "service.add"
    assert Enum.member? dir, "service.delete"
    assert Enum.member? dir, "service.info"

    #{:ok, json} = JSON.encode(Test.Client.debug client)
    #Logger.info("Debug information: #{json}")

    {:ok, l} = Test.Client.call client, "service.list", []
    Logger.info("Got services: #{inspect l}")
    assert (Enum.count l) >= 0

    {:ok, cl} = Test.Client.call client, "service.add", ["SBDS-TST5", %{ "name" => "Serverboards test", "tags" => ["tag1", "tag2"]}]
    Logger.info("Created service #{inspect cl}")
    {:ok, json} = JSON.encode(cl)
    assert not String.contains? json, "__"

    {:ok, cl} = Test.Client.call client, "service.info", ["SBDS-TST5"]
    Logger.info("Info from service #{inspect cl}")
    {:ok, json} = JSON.encode(cl)
    assert not String.contains? json, "__"

    {:ok, cls} = Test.Client.call client, "service.list", []
    Logger.info("Info from service #{inspect cls}")
    {:ok, json} = JSON.encode(cls)
    assert not String.contains? json, "__"
    assert Enum.any?(cls, &(&1["shortname"] == "SBDS-TST5"))


    Test.Client.stop(client)
  end
end
