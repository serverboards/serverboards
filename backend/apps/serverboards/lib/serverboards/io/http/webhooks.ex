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
        Logger.info("Webhook trigger #{inspect uuid} #{inspect @allowed_trigger_type} #{inspect Map.keys(qsvals)}", rule_uuid: uuid)
        wait = empty?(params["redirect_ok"]) or empty?(params["redirect_nok"])
        res = if wait do
          Serverboards.RulesV2.Rule.trigger_wait(uuid, qsvals)
        else
          Serverboards.RulesV2.Rule.trigger(uuid, qsvals)
        end
        {:ok, %{status: :ok, data: res}, params}
      {:error, e, params} ->
        required = (params["required"] || "" ) |> String.split(~r"[,\s]", trim: true)
        Logger.error(
          "Webhook call is missing some keys #{inspect uuid}. Required #{inspect required}, has #{inspect Map.keys(qsvals)}.",
          rule_uuid: uuid)
        {:error, %{ status: :error, data: e}, params}
    end
  end

  defp get_multipart_params(req, params \\ []) do
    case :cowboy_req.part(req) do
      {:ok, headers, req2} ->
        case :cow_multipart.form_data(headers) do
          {:data, name} ->
            {:ok, body, req3} = :cowboy_req.part_body(req2)

            get_multipart_params(req3, [{name, body} | params])
          other ->
            Logger.debug("Dont know how to parse multipart type #{inspect other}")
            get_multipart_params(req2, params)
        end
      {:done, _} ->
        params
      other ->
        Logger.debug("Dont know how to parse multipart part #{inspect other}")
        params
    end
  end

  defp get_params(req) do
    {:ok, {content, type, _}, _} = :cowboy_req.parse_header("content-type", req)
    content_type = {content, type}
    # Logger.debug("Got data: #{inspect content_type}")
    params = cond do
      content_type == {"multipart", "form-data"} ->
        get_multipart_params(req)

      content_type == {"application", "x-www-form-urlencoded"} ->
        {:ok, params, _} = :cowboy_req.body_qs(req)
        # Logger.debug("url encoded")
        params

      true ->
        # Logger.debug("other")
        {params, _} = :cowboy_req.qs_vals(req)
        params
    end

    Map.new(params)
  end

  def handle(req, state) do
    # Do trigger
    {uuid, _} = :cowboy_req.binding(:uuid, req)

    qsvals = get_params(req)

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
        if not empty?(redirect_ok) do
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
        if not empty?(redirect_nok) do
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
