#!/bin/sh

set -e
RDBMS=/files/projects/imunisasi/.env.json
cat >"$RDBMS" <<JSONEOF
{
  "variables": [
    {
      "name": "STAGING_DB",
      "value": "${STAGING_DB}",
      "description": ""
    },
    {
      "name": "STAGING_HOST",
      "value": "${STAGING_HOST}",
      "description": ""
    },
    {
      "name": "STAGING_PORT",
      "value": "${STAGING_PORT}",
      "description": ""
    },
    {
      "name": "STAGING_USER",
      "value": "${STAGING_USER}",
      "description": ""
    },
    {
      "name": "STAGING_PASSWORD",
      "value": "${STAGING_SA_PASSWORD}",
      "description": ""
    },
    {
      "name": "MASTER_DB",
      "value": "${MASTER_DB}",
      "description": ""
    },
    {
      "name": "MASTER_HOST",
      "value": "${MASTER_HOST}",
      "description": ""
    },
    {
      "name": "MASTER_PORT",
      "value": "${MASTER_PORT}",
      "description": ""
    },
    {
      "name": "MASTER_USER",
      "value": "${MASTER_USER}",
      "description": ""
    },
    {
      "name": "MASTER_PASSWORD",
      "value": "${MASTER_PASSWORD}",
      "description": ""
    },
    {
      "name": "WAREHOUSE_DB",
      "value": "${WAREHOUSE_DB}",
      "description": ""
    },
    {
      "name": "WAREHOUSE_HOST",
      "value": "${WAREHOUSE_HOST}",
      "description": ""
    },
    {
      "name": "WAREHOUSE_PORT",
      "value": "${WAREHOUSE_PORT}",
      "description": ""
    },
    {
      "name": "WAREHOUSE_USER",
      "value": "${WAREHOUSE_USER}",
      "description": ""
    },
    {
      "name": "WAREHOUSE_PASSWORD",
      "value": "${WAREHOUSE_PASSWORD}",
      "description": ""
    }
  ]
}
JSONEOF
