require Logger

defmodule ServiceTest do
  use ExUnit.Case
  @moduletag :capture_log

  doctest Serverboards.Service.Service, import: true
  doctest Serverboards.Service.Component, import: true


  test "Service lifecycle" do
    import Serverboards.Service.Service

    user = Serverboards.Auth.User.get_user("dmoreno@serverboards.io")
    {:ok, "SBDS-TST3"} = service_add "SBDS-TST3", %{ "name" => "serverboards" }, user
    :ok = service_update "SBDS-TST3", %{ "name" => "Serverboards" }, user
    {:ok, info} = service_info "SBDS-TST3", user
    assert info.name == "Serverboards"

    :ok = service_delete "SBDS-TST3", user
    assert {:error, :not_found} == service_info "SBDS-TST3", user
  end

  test "Update services tags" do
    import Serverboards.Service.Service

    user = Serverboards.Auth.User.get_user("dmoreno@serverboards.io")
    {:error, :not_found } = service_info "SBDS-TST5", user

    {:ok, "SBDS-TST5"} = service_add "SBDS-TST5", %{ "name" => "serverboards" }, user
    {:ok, info } = service_info "SBDS-TST5", user
    assert info.tags == []

    :ok = service_update "SBDS-TST5", %{ "tags" => ~w(tag1 tag2 tag3)}, user
    {:ok, info } = service_info "SBDS-TST5", user
    Logger.debug("Current service info: #{inspect info}")
    assert Enum.member? info.tags, "tag1"
    assert Enum.member? info.tags, "tag2"
    assert Enum.member? info.tags, "tag3"
    assert not (Enum.member? info.tags, "tag4")

    service_update "SBDS-TST5", %{ "tags" => ~w(tag1 tag2 tag4) }, user
    {:ok, info } = service_info "SBDS-TST5", user
    assert Enum.member? info.tags, "tag1"
    assert Enum.member? info.tags, "tag2"
    assert not (Enum.member? info.tags, "tag3")
    assert Enum.member? info.tags, "tag4"

    :ok = service_delete "SBDS-TST5", user
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

    {:ok, "SBDS-TST8"} = Test.Client.call client, "service.add", ["SBDS-TST8", %{ "name" => "Serverboards test", "tags" => ["tag1", "tag2"]}]

    {:ok, cl} = Test.Client.call client, "service.info", ["SBDS-TST8"]
    Logger.info("Info from service #{inspect cl}")
    {:ok, json} = JSON.encode(cl)
    assert not String.contains? json, "__"

    {:ok, cls} = Test.Client.call client, "service.list", []
    Logger.info("Info from service #{inspect cls}")
    {:ok, json} = JSON.encode(cls)
    assert not String.contains? json, "__"
    assert Enum.any?(cls, &(&1["shortname"] == "SBDS-TST8"))


    Test.Client.stop(client)
  end


  test "Tags into components" do
    import Serverboards.Service.{Service, Component}

    user = Serverboards.Auth.User.get_user("dmoreno@serverboards.io")
    {:ok, component } = component_add %{ "name" => "Test component", "tags" => ~w(tag1 tag2 tag3), "type" => "email" }, user
    {:ok, info } = component_info component, user
    assert info.tags == ["tag1", "tag2", "tag3"]

    component_update component, %{ "tags" => ["a","b","c"] }, user
    {:ok, info } = component_info component, user
    assert info.tags == ["a", "b", "c"]

    component_delete component, user
  end
end
