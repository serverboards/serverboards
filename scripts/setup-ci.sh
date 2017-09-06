#!/bin/bash

set -x

sudo apt update
sudo apt install -y wget

wget https://packages.erlang-solutions.com/erlang-solutions_1.0_all.deb
wget -q -O - https://deb.nodesource.com/setup_6.x | sudo -E bash -
wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | sudo apt-key add -
sudo sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google-chrome.list'
wget -LO- https://packages.gitlab.com/install/repositories/runner/gitlab-ci-multi-runner/script.deb.sh | sudo bash

sudo dpkg -i erlang-solutions_1.0_all.deb

sudo apt update
sudo apt install -y debhelper esl-erlang elixir nodejs libpam-dev \
  pkg-config libsystemd-dev dh-systemd python3 \
  python3-requests python3-pexpect python3-yaml python3-markdown \
  postgresql postgresql-client inotify-tools git nginx \
  python3-venv python3-sh pwgen uuid-runtime parallel \
  openjdk-9-jre-headless xvfb google-chrome-stable firefox \
  gitlab-ci-multi-runner psmisc openssh-server

systemctl enable postgresql

sudo sudo -u postgres psql << EOF
CREATE USER "gitlab-runner";
ALTER USER "gitlab-runner" WITH CREATEDB;
ALTER USER "gitlab-runner" WITH SUPERUSER;

CREATE USER "serverboards";
ALTER ROLE "serverboards" WITH PASSWORD 'serverboards';
ALTER USER "serverboards" CREATEDB;
ALTER USER serverboards WITH SUPERUSER;

EOF

npm install -g yarn

echo
echo Get the Runner Id and all data from the gitlab web ui
echo

sudo gitlab-runner register
