#!/usr/bin/env bash
set -euo pipefail

PORTS=(3001 5173)

kill_ports() {
  for port in "${PORTS[@]}"; do
    fuser -k "${port}/tcp" >/dev/null 2>&1 || true
  done
}

cleanup() {
  kill_ports
}

trap cleanup EXIT INT TERM

# Limpia puertos al iniciar por si quedaron procesos colgados.
kill_ports

vercel dev --listen 5173
