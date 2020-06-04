#!/bin/bash
tag="sannoob/sirubot:stable"
echo "Building Docker Image for $tag"
sudo docker build -t $tag -f ./Dockerfile .
