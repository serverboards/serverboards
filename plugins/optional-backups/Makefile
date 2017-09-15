all: setup compile

setup: node_modules/

node_modules/.bin/babel: node_modules/

node_modules/.bin/rollupnode_modules/.bin/rollup: node_modules/
	yarn

node_modules/: package.json
	yarn

compile: static/screen.js

static/screen.js: src/screen.js
	node_modules/.bin/rollup -c

clean:
	rm static/screen.js

watch:
	node_modules/.bin/rollup -w -c -m
