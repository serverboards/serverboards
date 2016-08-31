require Logger

defmodule Serverboards.Repo do
  use Ecto.Repo, otp_app: :serverboards

  def get_or_create_and_update(model, get_by, update) do
    case get_by(model, get_by) do
      %{__struct__: model} = g ->
        #Logger.debug("Update struct #{inspect [g, update]}")
        update(apply(model, :changeset, [g, update]))
        g
      _ ->
        #Logger.debug("Create struct #{inspect [struct(model), update]}")
        {:ok, g} = insert(apply(model, :changeset, [struct(model), update] ))
        g
    end
  end
end
