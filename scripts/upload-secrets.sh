#!/bin/bash

# Usage: ./scripts/upload-secrets.sh [environment]
# Example: ./scripts/upload-secrets.sh testnet (uses .env.testnet)

ENV=$1

if [ -z "$ENV" ]; then
  echo "Error: No environment specified."
  echo "Usage: $0 [environment]"
  echo "Example: $0 testnet"
  exit 1
fi

# Define the expected env file based on the environment name
ENV_FILE=".env.$ENV"

# Check if the specific environment file exists
if [ ! -f "$ENV_FILE" ]; then
  echo "Warning: $ENV_FILE not found."
  # Fallback to .env if the specific one is missing
  if [ -f ".env" ]; then
    echo "Falling back to .env..."
    ENV_FILE=".env"
  else
    echo "Error: Neither $ENV_FILE nor .env was found in the root directory!"
    exit 1
  fi
fi

echo "Reading secrets from $ENV_FILE and uploading to Cloudflare environment: $ENV..."

# Read the chosen file line by line
while IFS='=' read -r key value || [ -n "$key" ]; do
  # Skip comments, empty lines, or lines without a key
  if [[ "$key" =~ ^#.*$ ]] || [ -z "$key" ] || [[ ! "$key" =~ [a-zA-Z0-9_] ]]; then
    continue
  fi

  # Clean up the key and value (remove whitespace and quotes)
  clean_key=$(echo "$key" | xargs)
  clean_value=$(echo "$value" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//' -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//")

  # Only upload if there is a value
  if [ -n "$clean_value" ]; then
    echo "--- Uploading: $clean_key ---"
    # Use printf to handle special characters and pipe to wrangler
    printf "%s" "$clean_value" | bunx wrangler secret put "$clean_key" --env "$ENV"
    
    if [ $? -ne 0 ]; then
      echo "Error: Failed to upload $clean_key. Ensure you are logged in (bunx wrangler login)."
      exit 1
    fi
  fi
done < "$ENV_FILE"

echo "Successfully uploaded all secrets from $ENV_FILE to $ENV!"
