#!/bin/bash

# Script to export test cases from TestRail

# Check for required environment variables
if [ -z "$TESTRAIL_HOST" ] || [ -z "$TESTRAIL_USERNAME" ] || [ -z "$TESTRAIL_PASSWORD" ] || [ -z "$TESTRAIL_PROJECT_ID" ]; then
  echo "Error: Missing required environment variables"
  echo "Please set: TESTRAIL_HOST, TESTRAIL_USERNAME, TESTRAIL_PASSWORD, TESTRAIL_PROJECT_ID"
  exit 1
fi

# Export test cases
echo "Exporting test cases from TestRail..."
pnpm --filter testrail export

echo "Export completed"
