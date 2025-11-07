#!/bin/bash
cd /home/kavia/workspace/code-generation/nodejs-crud-api-template-184106-184115/nodejs_crud_api
source venv/bin/activate
flake8 .
LINT_EXIT_CODE=$?
if [ $LINT_EXIT_CODE -ne 0 ]; then
  exit 1
fi

