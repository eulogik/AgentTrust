# OpenTrustBench Docker

Run OpenTrustBench in a container.

## From Docker Hub

```bash
docker pull eulogik/opentrustbench
docker run --rm -v $(pwd):/workspace eulogik/opentrustbench scan .
docker run --rm -v $(pwd):/workspace eulogik/opentrustbench attack .
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
docker build -f docker/Dockerfile -t eulogik/opentrustbench:0.1.2 -t eulogik/opentrustbench:latest .
docker push eulogik/opentrustbench --all-tags
```

Bump `@opentrustbench/cli@x.y.z` in `docker/Dockerfile` on each release.

## License

Apache-2.0
