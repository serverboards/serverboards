all: setup compile

setup: node_modules/

node_modules/.bin/babel: node_modules/

node_modules/.bin/rollupnode_modules/.bin/rollup: node_modules/

node_modules/: package.json
	yarn --no-progress

compile: static/editor.js

static/editor.js: src/editor.js
	node_modules/.bin/rollup -c
	node_modules/.bin/rollup -c rollup.config.widget.js

clean:
	rm -rf node_modules
	rm -f static/editor.js static/editor.js.map
	rm -f static/widget.js static/widget.js.map

watch:
	make -j watch_editor watch_widget

watch_editor:
	node_modules/.bin/rollup -w -c -m

watch_widget:
	node_modules/.bin/rollup -w -c rollup.config.widget.js -m
