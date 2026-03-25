#!/bin/bash
# Wait for Xvfb and fluxbox to be ready
sleep 3

# Launch Antigravity with flags for container environment
exec antigravity \
    --no-sandbox \
    --disable-gpu \
    --disable-dev-shm-usage \
    --ozone-platform=x11 \
    --user-data-dir=/root/.config/antigravity \
    2>&1
