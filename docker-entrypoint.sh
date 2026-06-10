#!/bin/sh
set -e

# Initialise Postgres data dir on first run.
if [ ! -s "$PGDATA/PG_VERSION" ]; then
  echo "[init] initdb"
  su-exec postgres initdb -D "$PGDATA" --auth=trust --username=postgres >/dev/null
  echo "listen_addresses='localhost'" >> "$PGDATA/postgresql.conf"
fi

echo "[start] postgres"
su-exec postgres pg_ctl -D "$PGDATA" -l "$PGDATA/postgres.log" start

echo "[wait] postgres ready"
until su-exec postgres pg_isready -h localhost -U postgres >/dev/null 2>&1; do
  sleep 1
done

# Ensure the app role and database exist (idempotent — survives restarts with a volume).
su-exec postgres psql -v ON_ERROR_STOP=1 -U postgres <<EOSQL
DO \$\$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '$POSTGRES_USER') THEN
    CREATE ROLE $POSTGRES_USER LOGIN PASSWORD '$POSTGRES_PASSWORD';
  END IF;
END \$\$;
EOSQL

if ! su-exec postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='$POSTGRES_DB'" -U postgres | grep -q 1; then
  su-exec postgres createdb -U postgres -O "$POSTGRES_USER" "$POSTGRES_DB"
fi

echo "[migrate] api"
cd /app/api
npm run migration:run

echo "[start] api"
node /app/api/dist/src/main &
API_PID=$!

# Forward shutdown signals to the children.
trap 'kill $API_PID 2>/dev/null; su-exec postgres pg_ctl -D "$PGDATA" stop -m fast; exit 0' INT TERM

echo "[start] frontend"
cd /app/frontend
# PORT is set to 7000 for the API; pin Next to 3000 explicitly.
exec env PORT=3000 npm run start
