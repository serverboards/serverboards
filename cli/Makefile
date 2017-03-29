all:
	@echo "test -- runs all test, coverage and generates html"

test:
	coverage-3.4 run serverboards-cli.py --test
	coverage-3.4 html
	coverage-3.4 report
	@echo
	@echo "HTML at htmlcov/ directory"

install: serverboards-cli.py serverboards-i18n-compile.sh serverboards-i18n-update.sh
	cp $^ $DESTDIR/bin/
