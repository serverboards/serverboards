#!/bin/bash

set -x

$(basedir $0)/setup-ubuntu-1804.sh

wget -LO- https://packages.gitlab.com/install/repositories/runner/gitlab-ci-multi-runner/script.deb.sh | sudo bash

sudo apt update
sudo apt install -y gitlab-ci-multi-runner

sudo sudo -u postgres psql << EOF
CREATE USER "gitlab-runner";
ALTER USER "gitlab-runner" WITH CREATEDB;
ALTER USER "gitlab-runner" WITH SUPERUSER;
EOF

echo
echo Get the Runner Id and all data from the gitlab web ui
echo

sudo gitlab-runner register
