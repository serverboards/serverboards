all: setup


test:
	env/bin/python tests/test_async_json.py
	env/bin/python tests/test_async_mock.py

setup:
	python3 -m venv env
	env/bin/pip install -r requirements.txt

	# copy them to current dir, so that PYTHONPATH is ok for all.
	cp -a env/lib/python*/site-packages/curio .
	cp -a env/lib/python*/site-packages/asks .
	cp -a env/lib/python*/site-packages/h11 .
	cp -a env/lib/python*/site-packages/multio .
	cp -a env/lib/python*/site-packages/async_generator .

clean:
	rm env -rf

# Custom dir for serverboards pacakges, normally /opt/serverboards/...
DIST_PACKAGES = $(INSTALL)/serverboards/lib/python3/dist-packages

install: setup
	mkdir -p $(DIST_PACKAGES)/

	# copy py files as base; might be better as module.
	cp -a *.py $(DIST_PACKAGES)/

	# overreaching.. may need custom package. No time now.
	cp -a curio $(DIST_PACKAGES)/
	cp -a asks $(DIST_PACKAGES)/
	cp -a h11 $(DIST_PACKAGES)/
	cp -a multio $(DIST_PACKAGES)/
	cp -a async_generator $(DIST_PACKAGES)/
