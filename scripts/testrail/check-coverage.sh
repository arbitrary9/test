#!/bin/bash

# Script to check test coverage against TestRail

# Check for required environment variables
if [ -z "$TESTRAIL_HOST" ] || [ -z "$TESTRAIL_USERNAME" ] || [ -z "$TESTRAIL_PASSWORD" ] || [ -z "$TESTRAIL_PROJECT_ID" ]; then
  echo "Error: Missing required environment variables"
  echo "Please set: TESTRAIL_HOST, TESTRAIL_USERNAME, TESTRAIL_PASSWORD, TESTRAIL_PROJECT_ID"
  exit 1
fi

# Check test coverage
echo "Checking test coverage against TestRail..."
pnpm --filter testrail coverage

echo "Coverage check completed"
