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
	@echo "  release  -- Prepares a release tarball."
	@echo

compile: compile-backend compile-frontend

compile-backend:
	(cd backend; $(MAKE) compile)

compile-frontend:
	(cd frontend; $(MAKE) compile)

setup: setup-backend setup-frontend

setup-backend:
	(cd backend; $(MAKE) setup)

setup-frontend:
	(cd frontend; $(MAKE) setup)

clean:
	cd backend; $(MAKE) clean
	cd frontend; $(MAKE) clean
	rm rel -rf
	rm serverboards.tar.gz -f

docker: compile
	docker build -t serverboards .

.PHONY: test test-backend test-frontend
test: test-backend test-frontend

test-backend:
	cd backend; $(MAKE) test

test-frontend:
	cd frontend; $(MAKE) test

docker-run:
	[ "${SERVERBOARDS_PATH}" ] # need SERVERBOARDS_PATH envvar
	mkdir -p ${SERVERBOARDS_PATH}/
	[ -e /etc/selinux ] && sudo chcon -Rt svirt_sandbox_file_t ${SERVERBOARDS_PATH}
	docker run -P \
		-v ${SERVERBOARDS_PATH}/data/:/home/serverboards/ \
		-v ${SERVERBOARDS_PATH}/postgres/:/var/lib/postgresql/9.5/main/ \
		serverboards

release: serverboards.tar.gz

serverboards.tar.gz: compile-frontend compile-backend
	cp backend/apps/serverboards/rel . -a
	mkdir -p rel/serverboards/share/serverboards/
	cp -a frontend/dist rel/serverboards/share/serverboards/frontend
	cp -a plugins rel/serverboards/share/serverboards/plugins
	mkdir -p rel/serverboards/share/serverboards/backend
	cp -a backend/apps/serverboards/priv/repo/initial.sql rel/serverboards/share/serverboards/backend/
	cp -a backend/apps/serverboards/priv/repo/migrations rel/serverboards/share/serverboards/backend/
	rm rel/serverboards/share/serverboards/plugins/.git -rf

	cd rel && tar cfz serverboards.tar.gz serverboards
