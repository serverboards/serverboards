require Logger

defmodule Serverboards.IO.HTTP.Webhooks.Handler do

  @allowed_trigger_type "serverboards.core.triggers/webhook"

  def init(_type, req, []) do
    {:ok, req, :no_state}
  end

  def handle(req, state) do
    # Do trigger
    {uuid, _} = :cowboy_req.binding(:uuid, req)
    {qsvals, _} = :cowboy_req.qs_vals(req)
    qsvals = Map.new(qsvals) |> Map.put("id", uuid)

    trigger_data = try do
      Serverboards.RulesV2.Rule.trigger_type(uuid)
    catch
      :exit, _ -> # not existing
        {:error, :not_found}
    end

    reply = case trigger_data do
      {:ok, @allowed_trigger_type} ->
        Logger.info("Webhook trigger #{inspect uuid} #{inspect @allowed_trigger_type} #{inspect qsvals}", rule_uuid: uuid)
        res = Serverboards.RulesV2.Rule.trigger_wait(uuid, qsvals)
        {:ok, %{status: :ok, data: res}}

      {:ok, other_trigger} ->
        Logger.error("Try to trigger bad trigger type #{inspect uuid} / #{inspect other_trigger}", rule_uuid: uuid)
        {:error, %{status: :not_found, data: %{}}}
      _ ->
        Logger.error("Could not access to trigger data of #{inspect uuid}")
        {:error, %{status: :not_found, data: %{}}}
    end
    reply = case reply do
      {:ok, res} ->
        {:ok, json_reply} = Poison.encode(res)
        {:ok, reply} = :cowboy_req.reply(200, [
            {"content-type", "application/json"}
          ],
          json_reply,
          req
          )
        reply
      {:error, res} ->
        {:ok, json_reply} = Poison.encode(res)
        {:ok, reply} = :cowboy_req.reply(404, [
            {"content-type", "application/json"}
          ],
          json_reply,
          req
          )
        reply
    end


    {:ok, reply, state}
  end

  def terminate(_reason, _req, _state) do
    :ok
  end
end
