#!/bin/zsh

set -e

ENV_DIR="config/env"
ENV_FILE=".env.local.uat"
BACKUP_DIR="$ENV_DIR/backup"

if [ ! -e "$ENV_DIR/$ENV_FILE" ]; then
  echo "❌ No se encontró $ENV_DIR/$ENV_FILE"
  exit 1
fi

mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date +"%Y-%m-%dT%H-%M-%S")

TARGET="$BACKUP_DIR/$ENV_FILE.$TIMESTAMP.backup"

cp "$ENV_DIR/$ENV_FILE" "$TARGET"

echo "✅ Backup creado:"
echo "   $TARGET"
