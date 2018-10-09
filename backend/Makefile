all: compile-dev

compile-dev: setup
	iex --version
	mix compile

setup: deps

deps: mix.exs
	mix deps.get > /dev/null
	touch deps

test:
	make clean deps
	MIX_ENV=test mix test --trace --color

clean:
	rm apps/serverboards/rel apps/eventsourcing/rel -rf
	rm -f erl_crash.dump
	rm -rf deps _build
	make -f Makefile.hacks clean

_build/prod/rel/serverboards/bin/serverboards: deps
	MIX_ENV=prod mix release

compile: _build/prod/rel/serverboards/bin/serverboards
	make -f Makefile.hacks compile

run: compile _build/prod/rel/serverboards/bin/serverboards
	_build/prod/rel/serverboards/bin/serverboards foreground
