require Logger

defmodule Serverboards.Events do
  import MOM

  def setup do
    MOM.Channel.subscribe(:auth_authenticated, fn %{ payload: %{ client: client, user: user } } ->
      MOM.Channel.subscribe(:client_events, fn %{ payload: payload } ->
        # FIXME Add guards! Subscription!
        try do
          MOM.RPC.Client.event_to_client(
            client, payload.type,
            Serverboards.Utils.clean_struct(payload.data)
            )
        rescue
          e ->
            Logger.error("Error sending event: #{inspect e}\n#{Exception.format_stacktrace}")
        end
      end)
    end)

    MOM.Channel.subscribe(:client_events, fn %{ payload: payload } ->
      Logger.info("Sent #{payload.type} event: #{inspect payload}.")
    end)
    :ok
  end
end
