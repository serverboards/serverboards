require Logger

defmodule Serverboards.NotificationTest do
  use ExUnit.Case
  @moduletag :capture_log

  doctest Serverboards.Notifications

  test "List notifications" do
    cat = Serverboards.Notifications.catalog
    assert is_list(cat)
    catk = Map.keys(hd cat)
    assert :call in catk
    assert :command in catk
    assert :name in catk
    assert :id in catk
    assert not :type in catk
    assert not :extra in catk
  end

  test "Simple notification" do
    chan = hd Serverboards.Notifications.catalog
    user = Test.User.system
    config = %{}
    {:ok, true} = Serverboards.Notifications.notify_real(user, chan, config, "Test message", "This is the body", [])
    {:ok, fd} = File.open("/tmp/lastmail.json")
    data = IO.read(fd, :all)
    {:ok, data} = JSON.decode(data)
    File.close(fd)

    assert data["user"]["email"] == user.email
  end

  test "Configure for user" do
    chan = hd Serverboards.Notifications.catalog
    user = Test.User.system
    config = %{ "email" => "test+notifications@serverboards.io" }

    # no config yet
    nil = Serverboards.Notifications.config_get(user.email, chan.id)

    # insert
    :ok = Serverboards.Notifications.config_update(user.email, chan.id, config, true, user)

    # get one
    conf = Serverboards.Notifications.config_get(user.email, chan.id)
    assert conf.config == config

    # get all
    [conf] = Serverboards.Notifications.config_get(user.email)

    config = %{ "email" => nil }
    # update
    :ok = Serverboards.Notifications.config_update(user.email, chan.id, config, true, user)

    # updated ok
    conf = Serverboards.Notifications.config_get(user.email, chan.id)
    assert conf.config == config
  end

end
