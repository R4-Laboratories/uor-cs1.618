set -euo pipefail
image=$(sed -n 's/.*"sdk_image":"\([^"]*\)".*/\1/p' prismpm.lock)
if [[ ! $image =~ ^[a-z0-9.-]+(:[0-9]{1,5})?/[a-z0-9./_-]+@sha256:[0-9a-f]{64}$ ]]; then
  printf '%s\n' 'prismpm.lock does not select an immutable SDK image' >&2
  exit 64
fi
docker_config=$(mktemp -d)
trap 'rm -rf "$docker_config"' EXIT
if test -f "$HOME/.docker/config.json"; then
  cp "$HOME/.docker/config.json" "$docker_config/config.json"
else
  printf '{}\n' >"$docker_config/config.json"
fi
docker run --rm \
  --user "$(id -u):$(id -g)" \
  --group-add "$(stat -c '%g' /var/run/docker.sock)" \
  --tmpfs /tmp:rw,exec,nosuid,size=2g \
  --volume "$PWD:$PWD" \
  --volume /var/run/docker.sock:/var/run/docker.sock \
  --volume "$docker_config:/tmp/prismpm-home/.docker:ro" \
  --workdir "$PWD" \
  --env DOCKER_CONFIG=/tmp/prismpm-home/.docker \
  --env BUILDX_CONFIG=/tmp/prismpm-buildx \
  --env HOME=/tmp/prismpm-home \
  --env PRISMPM_EPHEMERAL_HOME=1 \
  --env SDK_IMAGE="$image" \
  "$image" bash -c '
    set -euo pipefail
    umask 077
    docker buildx version
    docker buildx inspect --bootstrap
    manifest=$(docker buildx imagetools inspect "$SDK_IMAGE")
    grep -q "linux/amd64" <<< "$manifest"
    grep -q "linux/arm64" <<< "$manifest"
    devcontainer --version
    exec just vv
  '
