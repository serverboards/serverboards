all: setup compile

setup: node_modules/

node_modules/.bin/babel: node_modules/

node_modules/.bin/rollupnode_modules/.bin/rollup: node_modules/
	npm install

node_modules/: package.json
	npm install

compile: static/watcher.js static/manager.js

static/watcher.js: src/watcher.js
	node_modules/.bin/rollup -c rollup.watcher.config.js

static/manager.js: src/manager.js
	node_modules/.bin/rollup -c rollup.manager.config.js

clean:
	rm -rf static/watcher.js static/manager.js

watch-manager:
	node_modules/.bin/rollup -w -c rollup.manager.config.js

watch-watcher:
	node_modules/.bin/rollup -w -c rollup.watcher.config.js
