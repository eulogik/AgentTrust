# Installing OpenTrustBench via Homebrew

## For users

```bash
brew tap eulogik/opentrustbench https://github.com/eulogik/OpenTrustBench
brew install opentrustbench
```

## For maintainers

Update the formula when releasing a new version:

1. Update `url` to the new release tarball
2. Update `sha256` with `curl -sL <url> | shasum -a 256`
3. Test with `brew install --build-from-source opentrustbench.rb`
4. Push to the tap repo

## Prerequisites

- Homebrew
- Node.js 20+ (installed as a dependency)
