# OpenTrustBench Docker

Run OpenTrustBench in a container. Replace `NS` with the Docker Hub namespace
(`opentrustbench`, or your username).

## From Docker Hub (once published)

```bash
docker run --rm -v $(pwd):/workspace NS/opentrustbench scan .
docker run --rm -v $(pwd):/workspace NS/opentrustbench attack .
```

## Build locally (from the repo root)

```bash
docker build -f docker/Dockerfile -t opentrustbench .
docker run --rm -v $(pwd):/workspace opentrustbench scan . --quiet
```

## Docker Compose (from the repo root)

```bash
docker compose -f docker/docker-compose.yml run scan
docker compose -f docker/docker-compose.yml run attack
docker compose -f docker/docker-compose.yml run eval
```

## Publish a release image

```bash
docker login
docker build -f docker/Dockerfile -t NS/opentrustbench:0.1.1 -t NS/opentrustbench:latest .
docker push NS/opentrustbench --all-tags
```

Bump `@opentrustbench/cli@x.y.z` in `docker/Dockerfile` on each release.

## License

Apache-2.0
