defmodule Serverboards.Auth.Reauth do
  @moduledoc ~S"""
  Reauth server that stores request by clients and controls the cancelation or
  authorization of them.

  Reauths are per client, so that when client dies, the reauths are all
  automatically cancelled.

  Also this ensures that the original calling client is the one accepting the
  reauth.

    iex> {:ok, r} = start_link
    iex> msg = request_reauth r, fn -> :reauth_success end
    iex> msg.type
    :needs_reauth
    iex> "token" in msg.available
    true
    iex> reauth r, msg.uuid, %{ "type" => "freepass", "data" => %{} }
    :reauth_success

  """
  use GenServer
  alias Serverboards.Auth

  def start_link(options \\ []) do
    GenServer.start_link(__MODULE__, :ok, options)
  end

  def request_reauth(pid, cont) do
    GenServer.call(pid, {:request_reauth, cont})
  end

  def reauth(pid, uuid, data) do
    case GenServer.call(pid, {:reauth, uuid, data}) do
      {:error, err} -> {:error, err}
      f when is_function(f) -> f.()
    end
  end

  # server impl
  def init(:ok) do
    {:ok, %{
      auths: %{} # list of pending authorizations
    }}
  end

  def needs_reauth_map(uuid) do
    %{
      type: :needs_reauth,
      description: "Restricted operation",
      available: Auth.list_auth,
      uuid: uuid
    }
  end

  # stores the request, and returns the error to reply to the other side
  def handle_call({:request_reauth, cont}, _from, status) do
    uuid = UUID.uuid4
    error = needs_reauth_map(uuid)
    status = %{
      status |
      auths: Map.put(status.auths, uuid, cont)
    }

    { :reply, error, status }
  end

  def handle_call({:reauth, uuid, data}, _from, status) do
    ret = case Map.get(status.auths, uuid) do
      nil -> {:error, :unknown_reauth}
      cont ->
        case Auth.auth(data) do
          false -> {:error, needs_reauth_map(uuid)}
          _email -> cont
        end
    end
    {:reply, ret, status}
  end
end
