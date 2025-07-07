#!/bin/bash

# ------ build the image WITHOUT running the data-populate script
set -e  # Exit immediately on any command failure

# Stop and remove the old container if it exists
echo "Stopping and removing old container..."
docker stop expenseowl 2>/dev/null || echo "No running container to stop"
docker rm expenseowl 2>/dev/null || echo "No existing container to remove"

# Rebuild the Docker image
echo "Building Docker image..."
docker build -t expenseowl-custom .
# ------ end building the image---------

# Tag for Docker Hub
docker tag expenseowl-custom yzpaul/expenseowl-creditcard:latest

# Push to Docker Hub
docker push yzpaul/expenseowl-creditcard:latest