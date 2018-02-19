require Logger

defmodule Serverboards.QueryTest do
  use ExUnit.Case
	@moduletag :capture_log

  alias Serverboards.Query
  setup do
    # Explicitly get a connection before each test
    :ok = Ecto.Adapters.SQL.Sandbox.checkout(Serverboards.Repo)
    # Setting the shared mode must be done only after checkout
    Ecto.Adapters.SQL.Sandbox.mode(Serverboards.Repo, {:shared, self()})

    :ok
  end

  test "Get schema" do
    {:ok, tables} = Query.schema(%{ service: nil, extractor: "test.extractor/extractor", user: nil })

    Logger.debug("Got tables #{inspect tables}")
    assert tables == ["random"]

    {:ok, random} = Query.schema(%{ service: nil, extractor: "test.extractor/extractor", user: nil}, "random")
    Logger.debug("Got random definition #{inspect random}")
  end

  test "Simple query" do
    context = %{
      "A" => %{
        service: nil,
        extractor: "test.extractor/extractor",
        user: nil
      }
    }

    {:ok, result} = Query.query("SELECT random FROM A.random", context)

    assert Enum.count(result.columns) == 1
    assert Enum.count(result.rows) == 1
    assert Enum.count(Enum.at(result.rows,0)) == 1

    Logger.debug inspect(result)
  end

  test "Simple query using RPC" do
    context = %{
      "A" => %{
        service: nil,
        extractor: "test.extractor/extractor",
        user: nil
      }
    }

    {:ok, client} = Test.Client.start_link as: "dmoreno@serverboards.io"

    {:ok, result} = Test.Client.call client, "query.query", %{
      query: "SELECT random FROM A.random",
      context: context
    }

    assert Enum.count(result["columns"]) == 1
    assert Enum.count(result["rows"]) == 1
    assert Enum.count(Enum.at(result["rows"],0)) == 1

    Logger.debug("Response #{inspect result}")
  end
end
