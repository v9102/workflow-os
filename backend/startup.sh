#!/bin/bash
# Run the app from wwwroot directly so we always use the freshly deployed
# source — never an old Oryx output.tar.zst extracted to /tmp.
set -e
cd /home/site/wwwroot
python -m pip install --upgrade pip --quiet
python -m pip install -r requirements.txt --quiet
export PYTHONPATH=/home/site/wwwroot
exec python -m uvicorn main:app --host 0.0.0.0 --port 8000
