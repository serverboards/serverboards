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

  defp empty?(nil), do: true
  defp empty?(""), do: true
  defp empty?(_), do: false

  def do_webhook_call(uuid, qsvals) do
    case filter_query(uuid, qsvals) do
      {:ok, qsvals, params} ->
        Logger.info("Webhook trigger #{inspect uuid} #{inspect @allowed_trigger_type} #{inspect qsvals}", rule_uuid: uuid)
        wait = empty?(params["redirect_ok"]) or empty?(params["redirect_nok"])
        res = if wait do
          Serverboards.RulesV2.Rule.trigger_wait(uuid, qsvals)
        else
          Serverboards.RulesV2.Rule.trigger(uuid, qsvals)
        end
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
    # Logger.debug(inspect {qsvals})
    qsvals = if qsvals == [] do
      # Logger.debug("No qvals?")
      {:ok, qsvals, _} = :cowboy_req.body_qs(req)
      qsvals
    else
      qsvals
    end
    # Logger.debug(inspect {qsvals})
    qsvals = Map.new(qsvals)

    trigger_data = try do
      Serverboards.RulesV2.Rule.trigger_type(uuid)
    catch
      :exit, _ -> # not existing
        {:error, :not_enabled}
    end

    reply = case trigger_data do
      {:ok, @allowed_trigger_type} ->
        do_webhook_call(uuid, qsvals)
      {:ok, @allowed_trigger_type_test} ->
        do_webhook_call(uuid, qsvals)
      {:ok, other_trigger} ->
        Logger.error("Try to trigger bad trigger type #{inspect uuid} / #{inspect other_trigger}", rule_uuid: uuid)
        {:error, %{status: :not_found, data: %{}}, %{}}
      e ->
        Logger.error("Could not access to trigger data of #{inspect uuid}: #{inspect e}")
        {:error, %{status: :not_enabled, data: %{}}, %{}}
    end


    {:ok, reply} = case reply do
      {:ok, res, params} ->
        redirect_ok = params["redirect_ok"]
        if redirect_ok do
          :cowboy_req.reply(302, [
              {"location", redirect_ok}
            ],"",req)
        else
          res = res.data
            |> Map.drop(["changes", "prev", "rule"])
            |> Map.put("status", res.status)
          {:ok, json_reply} = Poison.encode(res)
          :cowboy_req.reply(200, [
              {"content-type", "application/json"}
            ],
            (json_reply),
            req
            )
        end
      {:error, res, params} ->
        redirect_nok = params["redirect_nok"]
        if redirect_nok do
          :cowboy_req.reply(302, [
              {"location", redirect_nok}
            ],'',req)
        else
          {:ok, json_reply} = Poison.encode(res)
          :cowboy_req.reply(404, [
              {"content-type", "application/json"}
            ],
            (json_reply),
            req
            )
        end
    end


    {:ok, reply, state}
  end

  def terminate(reason, request, state) do
    if reason != {:normal, :shutdown} do
      Logger.error("Not normal webhook termination", request: request, state: state, reason: reason)
    end
    :ok
  end
end
