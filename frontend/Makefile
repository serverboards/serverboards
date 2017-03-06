all: setup compile

compile: setup dist/

dist/: node_modules app/* app/*/* *.js
	rm dist -rf
	NODE_ENV=production node_modules/.bin/webpack -p --progress

compile-dev: setup
	rm dist -rf
	NODE_ENV=development node_modules/.bin/webpack -p --progress

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
	yarn --no-progress

.PHONY: test
test: all

clean:
	rm -rf dist
	rm -rf node_modules

i18n-update: JSFILES=$(shell find app -name "*.js" | grep -Ev "(test|min)" )
i18n-update: YAMLFILES=$(shell find ../plugins -name "manifest.yaml" | grep -Ev "templates" )
i18n-update:
	@echo -n "Updating po files..."
	@xgettext --language=C -o lang/es.po --force-po --keyword=i18n_nop --keyword=i18n_c:1c,2 --keyword=i18n --join-existing ${JSFILES}
	@lang/extract-manifest-yaml-po.py ${YAMLFILES} | msgcat lang/es.po - --use-first -o lang/es.po
	@echo " Done"

i18n-compile:
	lang/compile-po.py lang/es.po lang/es.json
