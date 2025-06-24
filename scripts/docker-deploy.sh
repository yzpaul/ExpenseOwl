#!/bin/bash

# Variables
LOCAL_IMAGE="expenseowl-custom"
REMOTE_IMAGE="yzpaul/expenseowl-creditcard:latest"

# Tag local image with your Docker Hub repo name
docker tag $LOCAL_IMAGE $REMOTE_IMAGE

# Push the image to Docker Hub
docker push $REMOTE_IMAGE