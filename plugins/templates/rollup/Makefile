all: setup compile

setup: node_modules/

node_modules/.bin/babel: node_modules/

node_modules/.bin/rollupnode_modules/.bin/rollup: node_modules/
	yarn

node_modules/: package.json
	yarn

compile: static/[component-type].js

static/[component-type].js: src/[component-type].js
	node_modules/.bin/rollup -c

clean:
	rm static/[component-type].js

watch:
	node_modules/.bin/rollup -w -c -m
