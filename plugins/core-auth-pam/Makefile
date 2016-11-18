all: serverboards-auth-helper


CFLAGS=-O2 -Wall -Werror -fPIC
LDFLAGS=/usr/lib/x86_64-linux-gnu/libpam.so

# order was importnat to properly compile
serverboards-auth-helper: serverboards-auth-helper.c
	${CC} ${CFLAGS} serverboards-auth-helper.c   -o serverboards-auth-helper ${LDFLAGS}
clean:
	rm -rf serverboards-auth-helper

