#!/usr/bin/env bash
# Initialize both PostgreSQL 15 instances on first boot.
# Idempotent: skips initdb if data directory already exists,
# but always ensures the application database and extensions exist.
set -euo pipefail

PG_USER="luminance"
PG_PASS="luminance"

init_instance() {
  local data_dir="$1"
  local port="$2"
  local dbname="$3"
  local extensions="${4:-}"   # optional space-separated extension list

  if [ ! -f "${data_dir}/PG_VERSION" ]; then
    echo "[init-pg] Initializing PostgreSQL 15 at ${data_dir} (port ${port})"
    chown -R luminance:luminance "${data_dir}"
    local pwfile
    pwfile=$(mktemp)
    echo "${PG_PASS}" > "${pwfile}"
    chown luminance:luminance "${pwfile}"
    runuser -u luminance -- initdb -D "${data_dir}" --username="${PG_USER}" --pwfile="${pwfile}"
    rm -f "${pwfile}"

    # Set the correct port (default in postgresql.conf is #port = 5432)
    runuser -u luminance -- sed -i "s/^#port = 5432/port = ${port}/" "${data_dir}/postgresql.conf"
  else
    echo "[init-pg] Instance at ${data_dir} already initialized — ensuring database exists."
  fi

  # Always start temporarily to ensure database and extensions exist
  runuser -u luminance -- pg_ctl -D "${data_dir}" -l "/data/log/pg-init-${port}.log" -w -t 30 start

  runuser -u luminance -- env PGPASSWORD="${PG_PASS}" psql -U "${PG_USER}" -p "${port}" -d postgres \
    -c "SELECT 1 FROM pg_database WHERE datname = '${dbname}'" | grep -q 1 || \
    runuser -u luminance -- env PGPASSWORD="${PG_PASS}" psql -U "${PG_USER}" -p "${port}" -d postgres \
      -c "CREATE DATABASE ${dbname};"

  if [ -n "${extensions}" ]; then
    for ext in ${extensions}; do
      runuser -u luminance -- env PGPASSWORD="${PG_PASS}" psql -U "${PG_USER}" -p "${port}" -d "${dbname}" \
        -c "CREATE EXTENSION IF NOT EXISTS ${ext};" || true
    done
  fi

  runuser -u luminance -- pg_ctl -D "${data_dir}" -w -t 30 stop
  echo "[init-pg] Instance at ${data_dir} ready."
}

mkdir -p /data/pg-business /data/pg-vector /data/log
chown -R luminance:luminance /data/log /data/pg-business /data/pg-vector

# Business DB  — port 5432, no extensions
init_instance /data/pg-business 5432 luminance

# Vector DB — port 5433, pgvector extension
init_instance /data/pg-vector 5433 luminance_vector "vector"
