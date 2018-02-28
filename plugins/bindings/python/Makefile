all: setup


test:
	env/bin/python tests/test_async_json.py
	env/bin/python tests/test_async_mock.py

setup:
	python3 -m venv env
	env/bin/pip install -r requirements.txt

clean:
	rm env -rf
