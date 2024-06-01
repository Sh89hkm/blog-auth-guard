#!/bin/bash

mongorestore --db myblog --gzip --drop --quiet \
 --archive="/dbseed.gz" \
 -u $MONGO_INITDB_ROOT_USERNAME \
 -p $MONGO_INITDB_ROOT_PASSWORD  \
 --authenticationMechanism SCRAM-SHA-256 \
 --authenticationDatabase admin \
 && echo "Database reset successfully!"