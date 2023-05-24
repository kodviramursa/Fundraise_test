# Fundraise_test

-- stop the mongodb process - (brew services stop mongodb-community@6.0 with brew or just kill mongo process)

-- create a directory for db (in example this is ~/data/db)

-- mongod --port 27017 --dbpath ~/data/db --replSet rs0 --bind_ip localhost

-- mongosh 

-- rs.initiate()

-- rs.conf()

-- rs.status()
