all:

.PHONY: test test-setup test-do setup
test: test-setup test-do

setup:
	yes | mix local.hex --force
	yes | mix local.rebar --force
	mix deps.get

test-setup: setup
	mix deps.compile
	MIX_ENV=test mix compile
	MIX_ENV=test mix ecto.migrate -r Serverboards.Repo
	MIX_ENV=test mix run apps/serverboards/priv/repo/test_seeds.exs

test-do:
	MIX_ENV=test mix test
