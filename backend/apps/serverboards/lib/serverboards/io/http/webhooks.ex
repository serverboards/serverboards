require Logger

defmodule Serverboards.IO.HTTP.Webhooks.Handler do

  @allowed_trigger_type "serverboards.core.triggers/webhook"
  @allowed_trigger_type_test "serverboards.test.auth/webhook"

  def init(_type, req, []) do
    {:ok, req, :no_state}
  end

  def filter_query(uuid, vals) do
    alias Serverboards.Utils

    # Logger.debug("Get rule #{inspect uuid}")
    rule = Serverboards.RulesV2.Rules.get(uuid)
    # Logger.debug("Webhook rule #{inspect rule, pretty: true}")
    params = Utils.map_get(rule, [:rule, "when", "params"], %{})
    required = (params["required"] || "" ) |> String.split(~r"[,\s]", trim: true)
    # Logger.debug("Required: #{inspect required}")
    optional = (params["optional"] || "" ) |> String.split(~r"[,\s]", trim: true)
    # Logger.debug("Optional: #{inspect optional}")

    has_all = required |> Enum.all?(&(Map.has_key?(vals, &1)))

    if has_all do
      qsvals = %{
        "id" => uuid,
        "data" => vals |> Map.take(optional ++ required)
      }

      {:ok, qsvals, params}
    else
      {:error, :required_keys_not_present, params}
    end
  end

  def do_webhook_call(uuid, qsvals) do
    case filter_query(uuid, qsvals) do
      {:ok, qsvals, params} ->
        Logger.info("Webhook trigger #{inspect uuid} #{inspect @allowed_trigger_type} #{inspect qsvals}", rule_uuid: uuid)
        res = Serverboards.RulesV2.Rule.trigger_wait(uuid, qsvals)
        {:ok, %{status: :ok, data: res}, params}
      {:error, e, params} ->
        Logger.error("Webhook call is missing some keys #{inspect uuid}", rule_uuid: uuid)
        {:error, %{ status: :error, data: e}, params}
    end
  end

  def handle(req, state) do
    # Do trigger
    {uuid, _} = :cowboy_req.binding(:uuid, req)
    {qsvals, _} = :cowboy_req.qs_vals(req)
    qsvals = if qsvals == [] do
      {:ok, qsvals, _} = :cowboy_req.body_qs(req)
      qsvals
    end
    qsvals = Map.new(qsvals)

    trigger_data = try do
      Serverboards.RulesV2.Rule.trigger_type(uuid)
    catch
      :exit, _ -> # not existing
        {:error, :not_found}
    end

    reply = case trigger_data do
      {:ok, @allowed_trigger_type} ->
        do_webhook_call(uuid, qsvals)
      {:ok, @allowed_trigger_type_test} ->
        do_webhook_call(uuid, qsvals)
      {:ok, other_trigger} ->
        Logger.error("Try to trigger bad trigger type #{inspect uuid} / #{inspect other_trigger}", rule_uuid: uuid)
        {:error, %{status: :not_found, data: %{}}}
      _ ->
        Logger.error("Could not access to trigger data of #{inspect uuid}")
        {:error, %{status: :not_found, data: %{}}}
    end
    reply = case reply do
      {:ok, res, params} ->
        if params["redirect_ok"] do
          :cowboy_req.reply(301, [
              {"location", params["redirect_ok"]}
            ],"",req)
        else
          res = res.data
            |> Map.drop(["changes", "prev", "rule"])
            |> Map.put("status", res.status)
          {:ok, json_reply} = Poison.encode(res)
          :cowboy_req.reply(200, [
              {"content-type", "application/json"}
            ],
            json_reply,
            req
            )
        end
      {:error, res, params} ->
        if params["redirect_nok"] do
          :cowboy_req.reply(301, [
              {"location", params["redirect_nok"]}
            ],"",req)
        else
          {:ok, json_reply} = Poison.encode(res)
          :cowboy_req.reply(404, [
              {"content-type", "application/json"}
            ],
            json_reply,
            req
            )
        end
    end


    {:ok, reply, state}
  end

  def terminate(_reason, _req, _state) do
    :ok
  end
end
