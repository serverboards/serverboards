help:
	@echo "Serverboards Development Helper"
	@echo
	@echo "Targets:"
	@echo
	@echo "  compile -- Compiles all. Requires already setup system"
	@echo "  setup   -- Prepares to be compiled. May require root if installs system packages."
	@echo "  clean   -- Cleans all development data."
	@echo "  test    -- Runs all tests."
	@echo "  docker  -- Creates a docker image. Compiles all beforehand."
	@echo

compile: compile-backend compile-frontend

compile-backend:
	(cd backend; make compile)

compile-frontend:
	(cd frontend; make compile)

setup: setup-backend setup-frontend

git-submodules:
	git submodule update --recursive

setup-backend:
	(cd backend; make setup)

setup-frontend:
	(cd frontend; make setup)

clean:
	cd backend; mix clean
	cd frontend; make clean

docker: compile
	docker build -t serverboards .

.PHONY: test test-backend test-frontend
test: test-backend test-frontend

test-backend:
	cd backend; make test

test-frontend:
	cd frontend; make test

docker-run:
	[ "${SERVERBOARDS_PATH}" ] # need SERVERBOARDS_PATH envvar
	mkdir -p ${SERVERBOARDS_PATH}/
	docker run -P \
		-v ${SERVERBOARDS_PATH}/data/:/home/serverboards/ \
		-v ${SERVERBOARDS_PATH}/postgres/:/var/lib/postgresql/9.5/main/ \
		serverboards
