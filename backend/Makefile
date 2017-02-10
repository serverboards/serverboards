all:

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

compile: deps
	cd apps/serverboards/ && mix deps.get
	cd apps/serverboards/ && MIX_ENV=prod mix compile
	cd apps/serverboards/ && MIX_ENV=prod mix release
	# Run some hacks.
	make -f Makefile.hacks compile
