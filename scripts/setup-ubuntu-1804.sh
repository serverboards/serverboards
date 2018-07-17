#!/bin/bash

set -x

sudo apt update
sudo apt install -y wget

wget https://packages.erlang-solutions.com/erlang-solutions_1.0_all.deb
wget https://packages.erlang-solutions.com/erlang/esl-erlang/FLAVOUR_1_general/esl-erlang_20.3.6-1~ubuntu~bionic_amd64.deb
wget -q -O - https://deb.nodesource.com/setup_6.x | sudo -E bash -

sudo dpkg -i erlang-solutions_1.0_all.deb
sudo dpkg -i esl-erlang_20.3.6-1~ubuntu~bionic_amd64.deb
echo "esl-erlang hold" | dpkg --set-selections

rm erlang-solutions_1.0_all.deb


sudo apt update
sudo apt install -y debhelper esl-erlang nodejs libpam-dev \
  pkg-config libsystemd-dev dh-systemd python3 \
  python3-requests python3-pexpect python3-yaml python3-markdown \
  postgresql postgresql-client inotify-tools git nginx \
  python3-venv python3-sh pwgen uuid-runtime \
  psmisc openssh-server npm \
  elixir libpng-dev libjpeg-dev python3-psycopg2 python3-bcrypt

sudo systemctl enable postgresql
sudo systemctl start postgresql

sudo sudo -u postgres psql << EOF
CREATE USER "serverboards";
ALTER ROLE "serverboards" WITH PASSWORD 'serverboards';
ALTER USER "serverboards" CREATEDB;
ALTER USER serverboards WITH SUPERUSER;
CREATE DATABASE serverboards;
EOF

sudo npm install -g yarn
