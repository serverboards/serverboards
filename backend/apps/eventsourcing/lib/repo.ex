defmodule Eventsourcing.Repo do
  @moduledoc ~S"""
  Event sourcing repository for testing. Normally use your own repo.

  This Repo is needed for tests, but on real world the repo to use is set at
  the Model.subscribe.
  """

  use Ecto.Repo, otp_app: :eventsourcing
end
