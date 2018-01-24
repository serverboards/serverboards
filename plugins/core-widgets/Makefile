all: setup compile

setup: node_modules/

node_modules/.bin/babel: node_modules/

node_modules/.bin/rollupnode_modules/.bin/rollup: node_modules/
	yarn

node_modules/: package.json
	yarn

compile: static/mini5.js static/mini2.js static/markdown.js static/clock.js

static/%.js: src/%.js
	node_modules/.bin/rollup -c

clean:
	rm static/*.js

watch:
	node_modules/.bin/rollup -w -c -m
