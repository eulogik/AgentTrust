# OpenTrustBench

Open-source AI agent and MCP server security scanner. Graded trust cards (A–F) for AI agents and MCP tool servers.

## Installation

```bash
pip install opentrustbench
```

**Prerequisites:** Node.js 18+ and npm must be installed. The npm `@opentrustbench/cli` package will be resolved at runtime.

## Usage

```bash
# Scan an AI agent or MCP server
opentrustbench scan ./my-agent

# Generate a Trust Card
opentrustbench trust ./my-agent

# Attack surface analysis
opentrustbench attack ./my-agent

# Dependency audit
opentrustbench deps ./my-agent
```

## License

Apache-2.0
