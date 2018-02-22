all: setup


test: setup
	./test_s10s_curio.py

setup: env/bin/pip
	python3 -m venv env
	env/bin/pip install -r requirements.txt

clean:
	rm env -rf
