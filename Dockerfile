FROM ubuntu:16.04

ENV LC_ALL=en-US.UTF-8

RUN apt-get -y update && apt-get install -y \
  git make gcc wget  \
  postgresql \
  nodejs npm  \
  sass

# setup postgres
RUN locale-gen en_US en_US.UTF-8 && dpkg-reconfigure locales -f none
RUN service postgresql start &&\
  su postgres -c "psql --command \"CREATE USER serverboards WITH SUPERUSER PASSWORD 'serverboards';\"" &&\
  su postgres -c "createdb -O serverboards serverboards"

# prepare node
RUN ln -s /usr/bin/nodejs /usr/local/bin/node

# prepare elixir
RUN wget https://packages.erlang-solutions.com/erlang-solutions_1.0_all.deb && dpkg -i erlang-solutions_1.0_all.deb
RUN rm erlang-solutions_1.0_all.deb
RUN apt-get -y update && apt-get install -y esl-erlang elixir rebar

# setup and compile
ADD . /opt/serverboards/

RUN cd /opt/serverboards; make setup
RUN cd /opt/serverboards; make compile

# go !
EXPOSE 8080
CMD service postgresql start && /opt/serverboards/serverboards.sh start
