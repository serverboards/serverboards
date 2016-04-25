# Initial test data.
# It is initialized once at test start, and as every test runs in a transaction
# it is ensured it will be like this at the begining.
#
# It can be run manually with:
#   MIX_ENV=test mix run priv/repo/test_seeds.exsmix run priv/repo/test_seeds.exs
#
require Logger

all_perms = [
    "auth.modify_self", "auth.modify_any",
    "auth.create_user", "auth.create_token",
    "plugin",
    "service.add", "service.update", "service.delete", "service.info",
    "service.component.add", "service.component.attach",
    "service.component.update", "service.component.delete",
    "debug"
  ]

data = [
  users: [
      %{
        email: "dmoreno@serverboards.io",
        first_name: "David",
        last_name: "Moreno",
        is_active: true,
        groups: ["user", "admin"]
      }
    ],
  groups: [
    %{ name: "user", perms: []},
    %{ name: "admin", perms: all_perms}
  ],
  password: [ {"dmoreno@serverboards.io", "asdfasdf"} ]
]


defmodule Seeds do
  alias Serverboards.Repo
  alias Serverboards.Auth.{User, Group}

  def import_data([]) do
    :ok
  end
  def import_data([ h | t ]) do
    {what, value} = h
    Logger.info("Update #{inspect what} with #{inspect value}")
    case what do
      :users -> Enum.map value, &import_user(&1)
      :groups -> Enum.map value, &import_group(&1)
      :password -> Enum.map value, &import_password(&1)
      _ ->
        Logger.error("Dont know how to import #{inspect what} data")
    end

    import_data(t)
  end


  def import_user(user) do
    u = Repo.get_or_create_and_update(User, [email: user.email], user)

    Enum.map user.groups, fn gn ->
      g = Repo.get_or_create_and_update(Group, [name: gn], %{name: gn})
      Group.add_user g, u
    end
  end

  def import_group(group) do
    g = Repo.get_or_create_and_update(Group, [name: group.name], group)
    Enum.map group.perms, fn p ->
      Group.add_perm g, p
    end
  end

  def import_password({email, password}) do
    user = User.get_user(email)
    User.Password.set_password(user, password)
  end
end

Serverboards.Repo.transaction fn ->
  Seeds.import_data(data)
end
