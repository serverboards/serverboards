all: s10s s10s-shell

CMDDIR=../rel/serverboards/lib/serverboards/cli/
BINDIR=../rel/serverboards/bin/
FINALDIR=/opt/serverboards/lib/serverboards/cli/
CFLAGS=-O2 -DCOMMANDS_NAME=\"s10s\" -DDEFAULT_COMMANDS_PATH=\"${FINALDIR}\"

libcommands.c: libcommands.h

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

CMDS=s10s-cli.py s10s-i18n-compile.py s10s-i18n-update.sh \
		 s10s-i18n-update--extract-manifest-yaml-po.py \
		 s10s-shell

install: ${CMDS} s10s
	mkdir -p ${BINDIR}
	mkdir -p ${CMDDIR}
	cp s10s ${BINDIR} -a
	cp ${CMDS} ${CMDDIR} -a
