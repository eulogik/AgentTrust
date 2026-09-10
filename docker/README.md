# OpenTrustBench Docker

Run OpenTrustBench in a container.

## Quick Start

```bash
# Build
docker build -t opentrustbench .

# Scan current directory
docker run --rm -v $(pwd):/workspace opentrustbench scan .

# Trust Card
docker run --rm -v $(pwd):/workspace opentrustbench trust .

# Attack analysis
docker run --rm -v $(pwd):/workspace opentrustbench attack .
```

## Docker Compose

```bash
docker compose run scan
docker compose run trust
docker compose run attack
```

## License

Apache-2.0
