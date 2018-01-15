require Logger

defmodule Serverboards.QueryTest do
  use ExUnit.Case
	#@moduletag :capture_log

  alias Serverboards.Query

  test "Get schema" do
    {:ok, tables} = Query.schema(%{ service: nil, extractor: "test.extractor/extractor", user: nil })

    Logger.debug("Got tables #{inspect tables}")
    assert tables == ["random", "user", "group", "permission"]

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

    Logger.debug ExoSQL.format_result(result)
  end
end
