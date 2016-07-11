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
	(cd backend; mix compile)

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

docker: compile-frontend
	docker build -t serverboards .

.PHONY: test test-backend test-frontend
test: test-backend test-frontend

test-backend:
	cd backend; make test

test-frontend:
	cd frontend; make test
