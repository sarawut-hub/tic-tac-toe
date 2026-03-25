#!/bin/bash
# Azure App Service startup script
# Runs Gunicorn with multiple workers for better concurrency
# Formula: 2 * num_cores + 1 (use 4 workers for a 2-core Azure instance)

exec gunicorn main:app \
    --workers 4 \
    --worker-class uvicorn.workers.UvicornWorker \
    --bind 0.0.0.0:8000 \
    --timeout 120 \
    --keep-alive 65 \
    --access-logfile - \
    --error-logfile -
