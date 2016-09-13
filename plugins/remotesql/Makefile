all: setup compile

setup: node_modules/

node_modules/.bin/babel: node_modules/

node_modules/.bin/rollupnode_modules/.bin/rollup: node_modules/
	npm install

node_modules/: package.json
	npm install


compile: static/console.js

static/console.js: src/index.js
	node_modules/.bin/rollup -c

clean:
	rm static/console.js

watch:
	node_modules/.bin/rollup -w -c
