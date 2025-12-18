#!/bin/sh
cd .next/standalone
export HOSTNAME="0.0.0.0"
export PORT="${PORT:-3000}"
exec node server.js
