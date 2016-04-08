all: setup compile

compile: dist/js/semantic.min.js dist/css/semantic.min.css dist/js/bundle.js \
	dist/css/serverboards.min.css dist/js/jsquery-2.2.3.min.js \
	 ../dist/css/themes/

dist/css/semantic.min.css: semantic/dist/semantic.min.css
	mkdir -p dist/css
	cp semantic/dist/semantic.min.css dist/css

dist/js/jsquery-2.2.3.min.js: static/*
	cp static/* dist/ -a


dist/js/semantic.min.js: semantic/dist/semantic.min.css
	mkdir -p dist/js
	cp semantic/dist/semantic.min.js dist/js

semantic/dist/semantic.min.css: semantic/dist/

semantic/dist/semantic.min.js: semantic/dist/

semantic/dist/: semantic
	cd semantic && ../node_modules/gulp/bin/gulp.js build

../dist/css/themes/: semantic/dist/
	cp semantic/dist/themes dist/css/ -a

dist/css/serverboards.min.css: css/*.sass
	sass $< $@

dist/js/bundle.js:
	npm run build

start: compile
	@echo "URL: http://localhost:8080/webpack-dev-server"
	npm start

help:
	@echo "all   -- Builds it all"
	@echo "setup -- Setups the dev environment"
	@echo "start -- Starts the webpack server at http://localhost:3000/webpack-dev-server"
	@echo "clean -- Cleans generated code"
	@echo "mrproper -- Cleans all development environment (node modules, semantic...)"

setup: node_modules

node_modules: node_modules/react

node_modules/react:
	npm install

semantic:
	npm install semantic-ui --save

mrproper: clean
	rm -rf node_modules

clean:
	rm -rf semantic/build/
	rm -rf dist
