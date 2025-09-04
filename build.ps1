# Extract Git hash and branch
$GIT_HASH = git rev-parse --short HEAD
$GIT_BRANCH = git rev-parse --abbrev-ref HEAD

# Extract package.json version and name
$PACKAGE_VERSION = (Get-Content package.json | ConvertFrom-Json).version
$PACKAGE_NAME = (Get-Content package.json | ConvertFrom-Json).name

# Display extracted values
Write-Host "Git Hash: $GIT_HASH"
Write-Host "Git Branch: $GIT_BRANCH"
Write-Host "Package Version: $PACKAGE_VERSION"
Write-Host "Package Name: $PACKAGE_NAME"

# Run Docker build
docker build --build-arg GIT_HASH=$GIT_HASH `
             --build-arg GIT_BRANCH=$GIT_BRANCH `
             --build-arg PACKAGE_VERSION=$PACKAGE_VERSION `
             --build-arg PACKAGE_NAME=$PACKAGE_NAME `
             -t "${PACKAGE_NAME}:${PACKAGE_VERSION}" `
             -t "${PACKAGE_NAME}:latest" `
             -t "${PACKAGE_NAME}:${GIT_BRANCH}-${GIT_HASH}" .
