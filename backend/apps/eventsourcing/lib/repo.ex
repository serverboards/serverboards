defmodule Eventsourcing.Repo do
  @moduledoc ~S"""
  Event sourcing repository for testing. Normally use your own repo.
  """

  use Ecto.Repo, otp_app: :eventsourcing
end
