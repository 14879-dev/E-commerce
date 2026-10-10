#!/bin/bash
set -e

echo "=========================================================="
echo "🚀 Starting Peshawari Chappal E-Commerce Platform Services"
echo "=========================================================="

# Activate Python virtual environment if created during build
if [ -d "/opt/venv" ]; then
  echo "📦 Activating Python virtual environment at /opt/venv..."
  . /opt/venv/bin/activate
fi

# Determine Python command
PYTHON_BIN=""
if command -v python3 &>/dev/null; then
  PYTHON_BIN="python3"
elif command -v python &>/dev/null; then
  PYTHON_BIN="python"
fi

if [ -n "$PYTHON_BIN" ]; then
  echo "🐍 Starting Python FastAPI microservice on 127.0.0.1:8000 using $PYTHON_BIN..."
  (
    cd python_service
    $PYTHON_BIN -m uvicorn main:app --host 127.0.0.1 --port 8000 --workers 1
  ) &
  PY_PID=$!
  echo "✅ Python microservice running in background (PID: $PY_PID)"
else
  echo "⚠️ Python runtime not detected; skipping local microservice start."
fi

# Launch Node.js Backend Server in the foreground
echo "🌐 Starting Node.js backend server on port ${PORT:-5000}..."
exec node backend/dist/index.js
