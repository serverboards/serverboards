all: setup


test: setup
	./test_s10s_curio.py

setup:
	python3 -m venv env
	env/bin/pip install -r requirements.txt

clean:
	rm env -rf
