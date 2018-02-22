all: build

build:
	cd optional-cloud && make
	cd optional-auth-pam && make
	cd optional-quickactions && make
	cd optional-backups && make
	cd core-widgets && make
	cd bindings/python/ && make

clean:
	cd optional-cloud && make clean
	cd optional-auth-pam && make clean
	cd optional-quickactions && make clean
	cd optional-backups && make clean
	cd core-widgets && make clean
	cd bindings/python/ && make clean
