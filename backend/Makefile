all:

.PHONY: test test-setup test-do
test: test-setup test-do

setup:
	yes Y | mix local.hex --force
	yes Y | mix local.rebar --force
	yes Y | mix deps.get

test-setup: setup
	mix deps.compile
	MIX_ENV=test mix compile
	MIX_ENV=test mix ecto.migrate -r Serverboards.Repo
	MIX_ENV=test mix run apps/serverboards/priv/repo/test_seeds.exs

test-do:
	MIX_ENV=test mix test

compile: apps/serverboards/rel/serverboards/bin/serverboards

clean:
	rm apps/serverboards/rel apps/eventsourcing/rel -rf
	rm build -rf
	rm -f erl_crash.dump

mrproper:
	rm -rf deps

apps/serverboards/rel/serverboards/bin/serverboards:
	$(MAKE) setup
	cd apps/serverboards/ && mix deps.get
	cd apps/serverboards/ && MIX_ENV=prod mix compile
	cd apps/serverboards/ && MIX_ENV=prod mix release
