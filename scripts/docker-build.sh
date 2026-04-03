#!/bin/bash
# OpenClaw Docker Build Script
# 自动化构建和推送 Docker 镜像

set -e

echo "🐳 OpenClaw Docker Image Builder"
echo "=" | head -c 60
echo ""

# Configuration
VERSION="${1:-2026.4.1-beta.2}"
IMAGE_NAME="openclaw/gateway"
REGISTRY="docker.io"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}Building OpenClaw v${VERSION}${NC}"

# Step 1: Check prerequisites
echo -e "\n🔍 Checking prerequisites..."

if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker not found. Please install Docker first.${NC}"
    exit 1
fi

if ! docker info &> /dev/null; then
    echo -e "${RED}❌ Docker daemon is not running.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker is ready${NC}"

# Step 2: Build the image
echo -e "\n🔨 Building Docker image..."

docker build \
    --tag "${IMAGE_NAME}:${VERSION}" \
    --tag "${IMAGE_NAME}:latest" \
    --build-arg VERSION="${VERSION}" \
    --target production \
    .

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Image built successfully${NC}"
else
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi

# Step 3: Tag and push (optional)
read -p "Do you want to push the image? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    
    # Check if logged in
    if ! docker info | grep -q "Username"; then
        echo -e "${YELLOW}⚠️  Not logged in to Docker Hub. Please login first.${NC}"
        exit 1
    fi
    
    echo -e "\n📤 Pushing image..."
    
    docker push "${IMAGE_NAME}:${VERSION}"
    docker push "${IMAGE_NAME}:latest"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Image pushed successfully${NC}"
    else
        echo -e "${RED}❌ Push failed${NC}"
        exit 1
    fi
    
else
    echo -e "${YELLOW}⏭️  Skipping push step${NC}"
fi

# Step 4: Display image info
echo -e "\n📊 Image Information:"
docker images "${IMAGE_NAME}" | grep -E "^(REPOSITORY|${IMAGE_NAME})"

echo ""
echo -e "${GREEN}✅ Build complete!${NC}"
echo ""
echo "To run the container:"
echo "  docker run -d --name openclaw-gateway ${IMAGE_NAME}:${VERSION}"
echo ""
echo "To view logs:"
echo "  docker logs -f openclaw-gateway"
