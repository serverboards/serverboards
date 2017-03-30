all:
	@echo "test -- runs all test, coverage and generates html"

test:
	coverage-3.4 run serverboards-cli.py --test
	coverage-3.4 html
	coverage-3.4 report
	@echo
	@echo "HTML at htmlcov/ directory"

install: DESTDIR=../rel/serverboards/bin/
install: serverboards-cli.py serverboards-i18n-compile.py serverboards-i18n-update.sh serverboards-i18n-update--extract-manifest-yaml-po.py
	mkdir -p ${DESTDIR}
	cp $^ ${DESTDIR} -a
