all:

.PHONY: test
test: export MIX_ENV=test
test:
	mix deps.get
	mix deps.compile
	mix compile
	mix test
