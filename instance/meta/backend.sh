#!/bin/bash

cd /var/www/workspaces/ || {
    echo "Failed to change directory to /var/www/workspaces/"
    exit 1
}

bun ./instance/src/index.ts

