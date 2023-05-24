# Fundraise_test

## Set up local development

Install all NodeJS dependencies with:

    npm install

## Add secrets and credentials

Create  `.env` file in root, add `DB_URI` variable where should be mongodb uri, add `DB_NAME` variable.

## Add mongodb replication configuration

Stop the mongodb process - (`brew services stop mongodb-community@6.0` with brew or just kill mongo process)

Create a directory for db (in example this is `~/data/db`)

Run command `mongod --port 27017 --dbpath ~/data/db --replSet rs0 --bind_ip localhost` where `~/data/db` is your previous db folder

Open mongo shell with `mongosh` command

Run `rs.initiate()`

Run `rs.conf()` to view replica set configuration 

Run `rs.status()` to check the status of replica set
