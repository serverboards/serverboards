FROM ubuntu:16.04

ENV LANG=C.UTF-8

RUN apt-get -y update && apt-get install -y \
  git make gcc wget  \
  postgresql \
  nodejs npm  \
  sass \
  supervisor inotify-tools
# prepare elixir
RUN wget https://packages.erlang-solutions.com/erlang-solutions_1.0_all.deb && dpkg -i erlang-solutions_1.0_all.deb
RUN rm erlang-solutions_1.0_all.deb

RUN apt-get -y update && apt-get install -y \
  esl-erlang elixir rebar

RUN useradd serverboards -m -U

# setup and compile
ADD . /opt/serverboards/
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf
RUN chown :serverboards /opt/serverboards/

ENV MIX_ENV=prod SERVERBOARDS_PATH=/home/serverboards
ENV SERVERBOARDS_DB=postgres://serverboards:serverboards@localhost:5432/serverboards

# go !
EXPOSE 8080
VOLUME /var/lib/postgresql/9.5/main/ /home/serverboards/ /etc/postgresql/
# USER serverboards
#CMD sleep 10000
CMD /usr/bin/supervisord
