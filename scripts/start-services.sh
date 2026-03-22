#!/usr/bin/env bash
# Start all services via monit.  Called by entrypoint.sh (child of tini).
set -euo pipefail

echo "[start] Initializing persistent data directories..."
mkdir -p /var/run/postgresql
chown luminance:luminance /var/run/postgresql
bash /opt/luminance/scripts/init-pg.sh

# 启动临时 PostgreSQL 实例用于迁移（如果 monit 还没启动 PG）
echo "[start] Starting temporary PostgreSQL for migrations..."
runuser -u luminance -- /usr/local/bin/pg_ctl -D /data/pg-business -l /data/log/pg-business-migrate.log start -w -t 30 || true
runuser -u luminance -- /usr/local/bin/pg_ctl -D /data/pg-vector -l /data/log/pg-vector-migrate.log start -w -t 30 || true

sleep 2

# 运行数据库迁移
echo "[start] Running database migrations..."
cd /opt/luminance

# 业务库迁移
/opt/luminance/bin/luminance-migrate -command=up -db=business || true

# 向量库迁移
/opt/luminance/bin/luminance-migrate -command=up -db=vector || true

# 停止临时 PG 实例（让 monit 接管）
echo "[start] Stopping temporary PostgreSQL instances..."
runuser -u luminance -- /usr/local/bin/pg_ctl -D /data/pg-business stop || true
runuser -u luminance -- /usr/local/bin/pg_ctl -D /data/pg-vector stop || true

# 确保 redis pid 目录存在（redis 进程以 root 运行）
echo "[start] Ensuring Redis runtime directories..."
mkdir -p /var/run/redis

# 初始化 SSL 证书
echo "[start] Initializing SSL certificates..."
mkdir -p /data/ssl

# 如果环境变量提供了证书，写入文件
if [[ -n "${SSL_CERT_B64:-}" ]]; then
    echo "$SSL_CERT_B64" | base64 -d > /data/ssl/server.crt
    echo "[start] SSL certificate written from env SSL_CERT_B64"
fi
if [[ -n "${SSL_KEY_B64:-}" ]]; then
    echo "$SSL_KEY_B64" | base64 -d > /data/ssl/server.key
    chmod 600 /data/ssl/server.key
    echo "[start] SSL key written from env SSL_KEY_B64"
fi

# 如果证书不存在，生成自签名证书
if [[ ! -f /data/ssl/server.crt ]] || [[ ! -f /data/ssl/server.key ]]; then
    echo "[start] Generating self-signed SSL certificate..."
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout /data/ssl/server.key \
        -out /data/ssl/server.crt \
        -subj "/CN=localhost" \
        -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"
    chmod 600 /data/ssl/server.key
    echo "[start] Self-signed certificate generated at /data/ssl/"
fi

# 初始化 JWT 密钥
echo "[start] Initializing JWT secret..."
if [[ -n "${JWT_SECRET_B64:-}" ]]; then
    echo "$JWT_SECRET_B64" | base64 -d > /opt/luminance/configs/jwt_secret
    chmod 600 /opt/luminance/configs/jwt_secret
    echo "[start] JWT secret written from env JWT_SECRET_B64"
elif [[ -n "${JWT_SECRET:-}" ]]; then
    echo "$JWT_SECRET" > /opt/luminance/configs/jwt_secret
    chmod 600 /opt/luminance/configs/jwt_secret
    echo "[start] JWT secret written from env JWT_SECRET"
fi

echo "[start] Handing off to monit..."
exec /usr/local/bin/monit -Ic /etc/monit/monitrc
