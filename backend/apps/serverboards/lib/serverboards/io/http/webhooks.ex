require Logger

defmodule Serverboards.IO.HTTP.Webhooks.Handler do
  @allowed_trigger_type "serverboards.core.triggers/webhook"
  @allowed_trigger_type_test "serverboards.test.auth/webhook"

  def init(_type, req, []) do
    {:ok, req, :no_state}
  end

  def filter_query(uuid, vals, peer) do
    alias Serverboards.Utils
    # Logger.debug("Filter query #{inspect {uuid, vals, peer}}")

    # Logger.debug("Get rule #{inspect uuid}")
    rule = Serverboards.RulesV2.Rules.get(uuid)
    # Logger.debug("Webhook rule #{inspect rule, pretty: true}")
    params = Utils.map_get(rule, [:rule, "when", "params"], %{})
    required = (params["required"] || "") |> String.split(~r"[,\s]", trim: true)
    # Logger.debug("Required: #{inspect required}")
    optional = (params["optional"] || "") |> String.split(~r"[,\s]", trim: true)
    # Logger.debug("Optional: #{inspect optional}")

    has_all = required |> Enum.all?(&Map.has_key?(vals, &1))

    my_origin = peer["origin"]

    allowed =
      case params["allowed_origins"] do
        "" ->
          true

        nil ->
          true

        origins ->
          String.split(origins, "\n")
          |> Enum.any?(fn origin ->
            # Logger.debug("Check origin #{inspect origin} ==? #{inspect my_origin}")
            origin != "" and origin == my_origin
          end)
      end

    cond do
      not allowed ->
        {:error, :origin_not_allowed}

      has_all ->
        qsvals = %{
          "id" => uuid,
          "data" => vals |> Map.take(optional ++ required),
          "peer" => peer
        }

        {:ok, qsvals, params}

      true ->
        {:error, :required_keys_not_present, params}
    end
  end

  defp empty?(nil), do: true
  defp empty?(""), do: true
  defp empty?(_), do: false

  def do_webhook_call(uuid, qsvals, peer) do
    case filter_query(uuid, qsvals, peer) do
      {:ok, qsvals, params} ->
        Logger.info(
          "Webhook trigger #{inspect(uuid)} #{inspect(@allowed_trigger_type)} #{
            inspect(Map.keys(qsvals))
          }",
          rule_uuid: uuid
        )

        wait = empty?(params["redirect_ok"]) or empty?(params["redirect_nok"])

        res =
          if wait do
            Serverboards.RulesV2.Rule.trigger_wait_queue(uuid, qsvals)
          else
            Serverboards.RulesV2.Rule.trigger_queue(uuid, qsvals)
          end

        {:ok, %{status: :ok, data: res}, params}

      {:error, e, params} ->
        required = (params["required"] || "") |> String.split(~r"[,\s]", trim: true)

        Logger.error(
          "Webhook call is missing some keys #{inspect(uuid)}. Required #{inspect(required)}, has #{
            inspect(Map.keys(qsvals))
          }.",
          rule_uuid: uuid
        )

        {:error, %{status: :error, data: e}, params}
    end
  end

  def get_peer_data(req) do
    {:undefined, origin, _} = :cowboy_req.parse_header("origin", req, "direct")
    {{ip, port}, _} = :cowboy_req.peer(req)

    %{
      "origin" => origin,
      "ip" => ip,
      "port" => port
    }
  end

  def handle(req, state) do
    # Do trigger
    {uuid, _} = :cowboy_req.binding(:uuid, req)

    qsvals = Serverboards.IO.HTTP.Utils.get_params(req)
    peer = get_peer_data(req)

    trigger_data =
      try do
        Serverboards.RulesV2.Rule.trigger_type(uuid)
      catch
        # not existing
        :exit, e ->
          Logger.error("Exit when running rule: #{inspect(e)}")
          {:error, :not_enabled}
      end

    reply =
      case trigger_data do
        {:ok, @allowed_trigger_type} ->
          do_webhook_call(uuid, qsvals, peer)

        {:ok, @allowed_trigger_type_test} ->
          do_webhook_call(uuid, qsvals, peer)

        {:ok, other_trigger} ->
          Logger.error(
            "Try to trigger bad trigger type #{inspect(uuid)} / #{inspect(other_trigger)}",
            rule_uuid: uuid
          )

          {:error, %{status: :not_found, data: %{}}, %{}}

        e ->
          Logger.error("Could not access to trigger data of #{inspect(uuid)}: #{inspect(e)}")
          {:error, %{status: :not_enabled, data: %{}}, %{}}
      end

    {:ok, reply} =
      case reply do
        {:ok, res, params} ->
          redirect_ok = params["redirect_ok"]

          if not empty?(redirect_ok) do
            :cowboy_req.reply(
              302,
              [
                {"location", redirect_ok}
              ],
              "",
              req
            )
          else
            res =
              case params["response"] do
                "" ->
                  %{status: res.status}

                nil ->
                  %{status: res.status}

                response ->
                  {:ok, rendered} = Serverboards.Utils.Template.render(response, res.data)
                  YamlElixir.read_from_string(rendered)
              end

            {:ok, json_reply} = Poison.encode(res)

            :cowboy_req.reply(
              200,
              [
                {"access-control-allow-origin", peer["origin"]},
                {"content-type", "application/json"}
              ],
              json_reply,
              req
            )
          end

        {:error, res, params} ->
          redirect_nok = params["redirect_nok"]

          if not empty?(redirect_nok) do
            :cowboy_req.reply(
              302,
              [
                {"location", redirect_nok}
              ],
              '',
              req
            )
          else
            {:ok, json_reply} = Poison.encode(res)

            :cowboy_req.reply(
              404,
              [
                {"content-type", "application/json"}
              ],
              json_reply,
              req
            )
          end
      end

    {:ok, reply, state}
  end

  def terminate(reason, request, state) do
    if reason != {:normal, :shutdown} do
      Logger.error("Not normal webhook termination",
        request: request,
        state: state,
        reason: reason
      )
    end

    :ok
  end
end
