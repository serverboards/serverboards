defmodule Eventsourcing.Repo do
  @moduledoc ~S"""
  Event sourcing repository for testing. Normally use your own repo.

  You can set a "via" repo using the :via config option, to another repository
  repo.
  """

  use Ecto.Repo, otp_app: :eventsourcing
end
