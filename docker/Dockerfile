# OpenTrustBench — registry-pinned runtime image.
# Built from the published npm package (reproducible per release).
# Bump the version below on each release.
FROM node:20-slim
RUN npm install -g @opentrustbench/cli@0.1.1 \
  && npm cache clean --force
WORKDIR /workspace
ENTRYPOINT ["opentrustbench"]
CMD ["--help"]
