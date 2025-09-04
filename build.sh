# Extract Git hash and package.json details
export GIT_HASH=$(git rev-parse --short HEAD)
export GIT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
export PACKAGE_VERSION=$(jq -r .version package.json)
export PACKAGE_NAME=$(jq -r .name package.json)

# Display extracted values
echo "Git Hash: $GIT_HASH"
echo "Git Branch: $GIT_BRANCH"
echo "Package Version: $PACKAGE_VERSION"
echo "Package Name: $PACKAGE_NAME"

# Run docker build with multiple tags
docker build \
  --build-arg GIT_HASH=$GIT_HASH \
  --build-arg GIT_BRANCH=$GIT_BRANCH \
  --build-arg PACKAGE_VERSION=$PACKAGE_VERSION \
  --build-arg PACKAGE_NAME=$PACKAGE_NAME \
  -t $PACKAGE_NAME:$PACKAGE_VERSION \
  -t $PACKAGE_NAME:latest \
  -t $PACKAGE_NAME:$GIT_BRANCH-$GIT_HASH \
  .
