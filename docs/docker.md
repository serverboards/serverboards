# Some notes on how to deploy on docker, testing

Create the docker image with

```
make docker
```

Deploy local with

```bash
make docker-run SERVERBOARDS_PATH=~/.serverboards/
```

Copy to remote with

```bash
docker save serverboards | pv | ssh server docker load
```

Run remotely with

```bash
export SERVERBOARDS_PATH=~/.serverboards/
docker run -P \
  -v ${SERVERBOARDS_PATH}/data/:/home/serverboards/ \
  -v ${SERVERBOARDS_PATH}/postgres/:/var/lib/postgresql/9.5/main/ \
  -m 512m \
  serverboards
```
