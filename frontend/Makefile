all: setup compile

compile: setup dist/

dist/: node_modules app/* app/*/* *.js
	rm dist -rf
	NODE_ENV=production node_modules/.bin/webpack -p --progress

start:
	@echo "URL: http://localhost:3000/webpack-dev-server"
	npm start

help:
	@echo "all   -- Builds it all"
	@echo "setup -- Setups the dev environment"
	@echo "start -- Starts the webpack server at http://localhost:3000/webpack-dev-server"
	@echo "clean -- Cleans generated code"
	@echo "watch -- Watches sources and remakes if necessary"
	@echo "mrproper -- Cleans all development environment (node modules)"

watch:
	npm run-script watch

setup: yarn.lock
	yarn

mrproper: clean
	rm -rf node_modules

.PHONY: test
test: all


clean:
	rm -rf dist
