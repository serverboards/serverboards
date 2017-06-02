#!/usr/bin/bash

set -x

wget https://packages.erlang-solutions.com/erlang-solutions_1.0_all.deb
sudo dpkg -i erlang-solutions_1.0_all.deb

sudo apt update
sudo apt install -y debhelper esl-erlang elixir nodejs libpam-dev \
  pkg-config libsystemd-dev dh-systemd python3 \
  python3-requests python3-pexpect python3-yaml python3-markdown \
  postgresql postgresql-client inotify-tools git nginx \
  python3-venv python3-sh pwgen uuid-runtime parallel

systemctl enable postgresql

sudo sudo -u postgres psql << EOF
CREATE USER "gitlab-runner";
ALTER USER "gitlab-runner" WITH CREATEDB;
EOF
