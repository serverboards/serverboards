all: setup compile

compile: dist/

dist/: app/* app/*/* *.js
	NODE_ENV=production node_modules/.bin/webpack --progress --colors --display-error-detailsnode_modules/.bin/webpack --progress --colors --display-error-details

app/css/semantic.min.css: semantic/dist/semantic.min.css
	mkdir -p dist/css
	cp semantic/dist/semantic.min.css app/css

app/js/semantic.min.js: semantic/dist/semantic.min.js
	cp semantic/dist/semantic.min.js app/js

semantic/dist/semantic.min.css: semantic/dist/

semantic/dist/semantic.min.js: semantic/dist/

semantic/dist/: semantic
	cd semantic && ../node_modules/gulp/bin/gulp.js build

app/css/themes/: semantic/dist/
	cp semantic/dist/themes app/css/ -a

start:
	@echo "URL: http://localhost:3000/webpack-dev-server"
	npm start

help:
	@echo "all   -- Builds it all"
	@echo "setup -- Setups the dev environment"
	@echo "start -- Starts the webpack server at http://localhost:3000/webpack-dev-server"
	@echo "clean -- Cleans generated code"
	@echo "watch -- Watches sources and remakes if necessary"
	@echo "mrproper -- Cleans all development environment (node modules, semantic...)"

watch:
	npm run-script watch


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
