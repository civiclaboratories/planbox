#!/usr/bin/env bash

# Copying from...
DB1=$1

# Copying to...
DB2=$2

heroku addons:add heroku-postgresql:standard-0 --app $DB2
heroku pgbackups:capture --app $DB1
heroku pgbackups:restore DATABASE_URL $(heroku pgbackups:url --app $DB1) --app $DB2 --confirm $DB2
