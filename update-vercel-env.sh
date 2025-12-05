#!/bin/bash

# Update Vercel Environment Variables
# This script updates the environment variables in Vercel

echo "📝 Updating Vercel Environment Variables..."

# Create temp files with values
# NOTE: Replace these with actual values from .env.local
echo "YOUR_YOUTUBE_CLIENT_ID_HERE" > /tmp/youtube_client_id.txt
echo "YOUR_YOUTUBE_CLIENT_SECRET_HERE" > /tmp/youtube_client_secret.txt
echo "YOUR_GEMINI_API_KEY_HERE" > /tmp/gemini_api_key.txt

# Function to add env var to all environments
add_env_var() {
  local name=$1
  local file=$2
  
  echo "Adding $name to Production..."
  cat "$file" | vercel env add "$name" production --force 2>&1
  
  echo "Adding $name to Preview..."
  cat "$file" | vercel env add "$name" preview --force 2>&1
  
  echo "Adding $name to Development..."
  cat "$file" | vercel env add "$name" development --force 2>&1
}

# Update environment variables
add_env_var "YOUTUBE_CLIENT_ID" "/tmp/youtube_client_id.txt"
add_env_var "YOUTUBE_CLIENT_SECRET" "/tmp/youtube_client_secret.txt"
add_env_var "GEMINI_API_KEY" "/tmp/gemini_api_key.txt"

# Clean up
rm -f /tmp/youtube_client_id.txt /tmp/youtube_client_secret.txt /tmp/gemini_api_key.txt

echo "✅ Environment variables updated!"




