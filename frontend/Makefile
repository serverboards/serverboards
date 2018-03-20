all: setup compile

compile: setup dist/index.html

dist/index.html: node_modules $(shell find app/js -name "*.js") $(shell find app/sass -name "*.sass")
	rm dist -rf
	NODE_ENV=production node_modules/.bin/webpack -p

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

setup: node_modules node_modules/gifsicle/vendor/gifscle

node_modules/gifsicle/vendor/gifscle:
	cd node_modules/pngquant-bin ; node lib/install.js
	cd node_modules/gifsicle ; node lib/install.js
	mkdir -p node_modules/imagemin-pngquant/node_modules/pngquant-bin/vendor/
	rm -rf node_modules/imagemin-pngquant/node_modules/pngquant-bin/vendor/pngquant
	ln -s $(shell pwd)/node_modules/.bin/pngquant node_modules/imagemin-pngquant/node_modules/pngquant-bin/vendor/


node_modules: yarn.lock package.json
	yarn --no-progress
	touch node_modules

.PHONY: test
test: all

clean:
	rm -rf dist
	rm -rf node_modules

i18n-update:
	@echo -n "Updating po files..."
	../cli/serverboards-i18n-update.sh lang/es.po app ../plugins/
	@echo " Done"

i18n-compile:
	../cli/serverboards-i18n-compile.py lang/es.po lang/es.json
