#!/bin/bash

# Script to update test run status in TestRail

# Check for required environment variables
if [ -z "$TESTRAIL_HOST" ] || [ -z "$TESTRAIL_USERNAME" ] || [ -z "$TESTRAIL_PASSWORD" ] || [ -z "$TESTRAIL_PROJECT_ID" ]; then
  echo "Error: Missing required environment variables"
  echo "Please set: TESTRAIL_HOST, TESTRAIL_USERNAME, TESTRAIL_PASSWORD, TESTRAIL_PROJECT_ID"
  exit 1
fi

# Optional: Create a new test run if RUN_ID is not provided
if [ -z "$TESTRAIL_RUN_ID" ]; then
  echo "Creating new test run..."
  pnpm --filter testrail create-run
else
  echo "Using existing test run ID: $TESTRAIL_RUN_ID"
fi

# Report test results to TestRail
echo "Reporting test results to TestRail..."
pnpm --filter testrail report

echo "TestRail update completed"
