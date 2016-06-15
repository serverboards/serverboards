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

end
