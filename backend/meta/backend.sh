#!/bin/bash

cd /var/www/onlineworkspace/ || {
    echo "Failed to change directory to /var/www/onlineworkspace/"
    exit 1
}

bun ./backend/src/index.ts
