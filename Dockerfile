FROM ubuntu:18.04

ENV LANG=C.UTF-8

RUN apt-get -y update && apt-get install -y \
  postgresql \
  supervisor inotify-tools \
  ssh openssh-server \
  python3 python3-pexpect

RUN useradd serverboards -m -U

# Uncompress serverboards
ADD serverboards.tar.gz /opt/
RUN chown :serverboards /opt/serverboards/

# copy some extra data
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY serverboards.sh /opt/serverboards/

ENV SERVERBOARDS_DB=postgres://serverboards:serverboards@localhost:5432/serverboards

# go !
EXPOSE 8080
VOLUME /var/lib/postgresql/10/main/ /home/serverboards/ /etc/postgresql/
# USER serverboards
#CMD sleep 10000
CMD /usr/bin/supervisord
