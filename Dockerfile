FROM ubuntu:16.04

ENV LANG=C.UTF-8

RUN apt-get -y update && apt-get install -y \
  git make gcc wget  \
  postgresql \
  nodejs npm  \
  sass

# prepare elixir
RUN wget https://packages.erlang-solutions.com/erlang-solutions_1.0_all.deb && dpkg -i erlang-solutions_1.0_all.deb
RUN rm erlang-solutions_1.0_all.deb
RUN apt-get -y update && apt-get install -y esl-erlang elixir rebar

# setup postgres
RUN service postgresql start &&\
su postgres -c "psql --command \"CREATE USER serverboards WITH SUPERUSER PASSWORD 'serverboards';\"" &&\
su postgres -c "createdb -O serverboards serverboards"

# setup and compile
ADD . /opt/serverboards/

ENV MIX_ENV=prod
ENV SERVERBOARDS_DB=ecto://serverboards:serverboards@localhost:5432/serverboards

RUN service postgresql start && \
  cd /opt/serverboards && make setup-backend && \
  cd /opt/serverboards && make compile-backend && \
  cd /opt/serverboards/backend && mix deps.get && \
  cd /opt/serverboards/backend && mix compile && \
  cd /opt/serverboards/backend/apps/mom && mix deps.get && \
  cd /opt/serverboards/backend/apps/mom && mix compile

# go !
EXPOSE 8080
CMD service postgresql start && /opt/serverboards/serverboards.sh start
