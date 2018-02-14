all: setup compile

setup: node_modules/

node_modules/.bin/babel: node_modules/

node_modules/.bin/rollupnode_modules/.bin/rollup: node_modules/
	yarn

node_modules/: package.json
	yarn

compile: static/*.js

static/%.js: src/%.js
	node_modules/.bin/rollup -c

clean:
	rm -rf static/*.js
	rm -rf node_modules

watch:
	node_modules/.bin/rollup -w -c -m
