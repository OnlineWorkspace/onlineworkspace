#!/usr/bin bash

cd /var/www/workspaces/instance/ || {
    echo "Failed to change directory to /var/www/workspaces/instance/"
    exit 1
}

bun /var/www/workspaces/instance/src/index.ts
