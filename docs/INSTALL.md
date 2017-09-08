---
title: "APT repository"
layout: page
---

## Install Serverboards

Run this in a terminal as root (`sudo bash`):

```shell
apt-key adv --keyserver keyserver.ubuntu.com --recv-keys C1FCABC2
echo "deb https://serverboards.io/ubuntu/ stable main" >> /etc/apt/sources.list.d/serverboards.list
apt update
apt install serverboards
```

Explained by line:
1. Add signing keys:
2. Add repository
3. Update repository list
4. Install serverboards


## Fine tune Serverboards

Edit the file `/etc/serverboards.ini` to fine tune if you need your
configuration.

Default configuration should be OK in most cases.

## Enable and start Serverboards

Run this in a terminal as root:

```shell
systemctl enable serverboards
systemctl start serverboards
```

Now you can access at [http://localhost:8080](http://localhost:8080).

First access can be done using the main user of the installed server and
password. Its recommended to set up a new admin user and disable the PAM plugin.

## Configure NGINX

You dont need to use NGINX if you dont want to, but some HTTPS termination
proxy is needed to access from the internet. We suggest to use NGINX.

Update as needed the `/etc/nginx/sites-available/serverboards.conf` file.

It's very important to set the proper server name on every appearance,
specially at the CSP headers, as the WebSockets connection may fail otherwise.

Create the link to enable serverboards access.

```shell
ln -s /etc/nginx/sites-available/serverboards.conf /etc/nginx/sites-enabled/
service nginx restart
```

### Letsencrypt certificate

You may need a certificate. We recomend to start with a basic [Lets
Encrypt](https://letsencrypt.org/) certificate, with the following
command:

```shell
letsencrypt certonly \
  -a webroot \
  --webroot-path=/opt/serverboards/share/serverboards/frontend/ \
  -d mydomain.com
```

You may need to reload the nginx server again to get the new
certificate.

```shell
service nginx reload
```

### Self signed certificate

This is only recomended for testing pourposes. A simple self signed certificate
can be created in the proper place like this:

```shell
mkdir /etc/letsencrypt/live/beta.serverboards.io/ -p
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/letsencrypt/live/beta.serverboards.io/privkey.pem \
  -out /etc/letsencrypt/live/beta.serverboards.io/fullchain.pem
```

It will ask some questions. After it you can restart the nginx server.

The paths are set as the letsencrypt paths, to ease use, but may change as
desired.

## Keep it updated

```shell
apt install serverboards
```
