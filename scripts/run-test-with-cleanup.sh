#!/bin/bash
# Wrapper script to run Vitest and force cleanup of MessagePort handles

set -e

TEST_FILE="$1"
shift

# Run vitest in background
NODE_OPTIONS="--max-old-space-size=8192" npx vitest run "$TEST_FILE" "$@" &
VITEST_PID=$!

# Wait for vitest to complete or timeout
TIMEOUT=30
ELAPSED=0
while kill -0 $VITEST_PID 2>/dev/null && [ $ELAPSED -lt $TIMEOUT ]; do
  sleep 1
  ELAPSED=$((ELAPSED + 1))
done

# If vitest is still running, it's hung
if kill -0 $VITEST_PID 2>/dev/null; then
  echo "=== Test colgado después de ${TIMEOUT}s, forzando cierre ===" >&2
  kill -TERM $VITEST_PID 2>/dev/null || true
  sleep 2
  kill -KILL $VITEST_PID 2>/dev/null || true
  exit 1
else
  # Wait for vitest to finish and get exit code
  wait $VITEST_PID
  exit $?
fi

