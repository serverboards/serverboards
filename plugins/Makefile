all: build

build:
	cd core-cloud && make
	cd optional-auth-pam && make
	cd optional-quickactions && make
	cd optional-backups && make

clean:
	cd core-cloud && make clean
	cd optional-auth-pam && make clean
	cd optional-quickactions && make clean
	cd optional-backups && make clean
