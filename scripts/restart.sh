#!/bin/sh
set -e  # Exit immediately on any command failure (except where overridden)

# Stop and remove the old container if it exists
echo "Stopping and removing old container..."
docker stop expenseowl 2>/dev/null || echo "No running container to stop"
docker rm expenseowl 2>/dev/null || echo "No existing container to remove"

# Rebuild the Docker image
echo "Building Docker image..."
docker build -t expenseowl-custom .

# Run the container
echo "Starting container..."
docker run -d -p 8080:8080 --name expenseowl expenseowl-custom

# Wait for the container to initialize
echo "Waiting for container to initialize..."
sleep 5

# Run mock data script
echo "Populating mock data..."
./scripts/mock-data-populate.sh
