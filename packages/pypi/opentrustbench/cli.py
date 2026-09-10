"""OpenTrustBench CLI - delegates to the npm @opentrustbench/cli package."""
import subprocess
import shutil
import sys
import os

def find_npm_binary():
    """Find the opentrustbench npm binary."""
    # Check if opentrustbench is in PATH
    npm_bin = shutil.which("opentrustbench")
    if npm_bin:
        return npm_bin

    # Try common npm global locations
    if sys.platform == "win32":
        npm_prefix = subprocess.run(
            ["npm", "config", "get", "prefix"],
            capture_output=True, text=True, timeout=10
        ).stdout.strip()
        candidate = os.path.join(npm_prefix, "opentrustbench.cmd")
    else:
        npm_prefix = subprocess.run(
            ["npm", "config", "get", "prefix"],
            capture_output=True, text=True, timeout=10
        ).stdout.strip()
        candidate = os.path.join(npm_prefix, "bin", "opentrustbench")

    if os.path.exists(candidate):
        return candidate

    return None

def main():
    """Main entry point - delegates to npm binary."""
    npm_bin = find_npm_binary()

    if npm_bin is None:
        print("Error: opentrustbench npm package not found.", file=sys.stderr)
        print("Install it with: npm install -g @opentrustbench/cli", file=sys.stderr)
        print("Or install the npm package manually.", file=sys.stderr)
        sys.exit(1)

    try:
        result = subprocess.run(
            [npm_bin] + sys.argv[1:],
            capture_output=False,
        )
        sys.exit(result.returncode)
    except KeyboardInterrupt:
        sys.exit(130)
    except Exception as e:
        print(f"Error running opentrustbench: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
