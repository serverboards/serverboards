defmodule Test.Ecto do
  def setup() do
    Serverboards.Repo.stop(Process.whereis(Serverboards.Repo))
    Enum.reduce_while(1..100, 0, fn i, _acc ->
      :timer.sleep(20)
      if Process.whereis(Serverboards.Repo) != nil do
        {:halt, i}
      else
        {:cont, i}
      end
    end)
    :ok = Ecto.Adapters.SQL.Sandbox.checkout(Serverboards.Repo)
    # Setting the shared mode must be done only after checkout
    Ecto.Adapters.SQL.Sandbox.mode(Serverboards.Repo, {:shared, self()})
  end
end
