all: build

DIRECTORIES = $(wildcard core*)

build:
	cd core-widgets && make
	cd bindings/python/ && make

clean:
	cd core-widgets && make clean
	cd bindings/python/ && make clean

install: build
	cd bindings/python && make install INSTALL=$(INSTALL)
	mkdir -p $(INSTALL)/../opt/serverboards/share/serverboards/plugins/
	cp -a $(DIRECTORIES) $(INSTALL)/../opt/serverboards/share/serverboards/plugins/
	# try delete unnecesary files. Maybe not there.
	find $(INSTALL)/../opt/serverboards/share/serverboards/plugins/ -name node_modules | xargs rm -rf || true
	find $(INSTALL)/../opt/serverboards/share/serverboards/plugins/ -name __pycache__ | xargs rm -rf || true
