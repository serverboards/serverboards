all: setup


test:
	env/bin/python tests/test_async_json.py
	env/bin/python tests/test_async_mock.py

setup:
	python3 -m venv env
	env/bin/pip install -r requirements.txt

clean:
	rm env -rf

DIST_PACKAGES = $(INSTALL)../usr/lib/python3/dist-packages

install: setup
	mkdir -p $(DIST_PACKAGES)/serverboards/
	cp serverboards.py $(DIST_PACKAGES)/serverboards/__init__.py
	cp serverboards_aio.py $(DIST_PACKAGES)/serverboards/aio.py
	cp pcolor.py $(DIST_PACKAGES)/serverboards/
	cp smock.py $(DIST_PACKAGES)/serverboards/

	# overreaching.. may need custom package. No time now.
	cp -a env/lib/python3.6/site-packages/curio $(DIST_PACKAGES)/
	cp -a env/lib/python3.6/site-packages/asks $(DIST_PACKAGES)/
	cp -a env/lib/python3.6/site-packages/h11 $(DIST_PACKAGES)/
	cp -a env/lib/python3.6/site-packages/multio $(DIST_PACKAGES)/
	cp -a env/lib/python3.6/site-packages/async_generator $(DIST_PACKAGES)/
