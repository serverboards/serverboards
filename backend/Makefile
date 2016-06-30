all:

.PHONY: test test-setup test-do
test: test-setup test-do

test-setup:
	mix local.hex --force
	mix local.rebar --force
	mix deps.get
	mix deps.compile
	MIX_ENV=test mix compile
	MIX_ENV=test mix ecto.migrate -r Serverboards.Repo
	MIX_ENV=test mix run apps/serverboards/priv/repo/test_seeds.exs

test-do:
	MIX_ENV=test mix test
	
