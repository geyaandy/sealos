#!/bin/bash
set -e
export readonly ARCH=${1:-amd64}
mkdir -p tars

RetryPullImageInterval=3
RetrySleepSeconds=3

retryPullImage() {
    local image=$1
    local retry=0
    local retryMax=3
    set +e
    while [ $retry -lt $RetryPullImageInterval ]; do
        sealos pull --policy=always --platform=linux/"${ARCH}" $image >/dev/null && break
        retry=$(($retry + 1))
        echo "retry pull image $image, retry times: $retry"
        sleep $RetrySleepSeconds
    done
    set -e
    if [ $retry -eq $retryMax ]; then
        echo "pull image $image failed"
        exit 1
    fi
}

retryPullImage ghcr.io/labring/sealos-cloud-objectstorage-controller:latest
retryPullImage ghcr.io/labring/sealos-cloud-objectstorage-frontend:latest
retryPullImage ghcr.io/labring/sealos-cloud-minio-service:latest

sealos save -o tars/objectstorage-controller.tar ghcr.io/labring/sealos-cloud-objectstorage-controller:latest
sealos save -o tars/objectstorage-frontend.tar ghcr.io/labring/sealos-cloud-objectstorage-frontend:latest
sealos save -o tars/objectstorage-service.tar ghcr.io/labring/sealos-cloud-minio-service:latest
