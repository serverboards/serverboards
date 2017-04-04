all: s10s s10s-shell

libcommands.c: libcommands.h

CFLAGS=-O2 -DCOMMANDS_NAME=\"s10s\" -DDEFAULT_COMMANDS_PATH=\"/opt/serverboards/share/serverboards/cli/:.\"
s10s: s10s.c libcommands.c

s10s-shell: s10s-shell.c libcommands.c

clean:
	rm -rf s10s s10s-shell

test:
	coverage-3.4 run serverboards-cli.py --test
	coverage-3.4 html
	coverage-3.4 report
	@echo
	@echo "HTML at htmlcov/ directory"

install: DESTDIR=../rel/serverboards/bin/
install: s10s-cli.py s10s-i18n-compile.py s10s-i18n-update.sh \
				 s10s-i18n-update--extract-manifest-yaml-po.py \
				 s10s s10s-shell
	mkdir -p ${DESTDIR}
	cp $^ ${DESTDIR} -a
