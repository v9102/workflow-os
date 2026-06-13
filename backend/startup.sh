#!/bin/bash
cd /home/site/wwwroot
pip install -r requirements.txt --quiet
export PYTHONPATH=/home/site/wwwroot
python -m uvicorn main:app --host 0.0.0.0 --port 8000