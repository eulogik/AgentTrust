class Opentrustbench < Formula
  desc "Open-source AI agent and MCP server security scanner"
  homepage "https://www.opentrustbench.com"
  url "https://github.com/eulogik/OpenTrustBench/archive/refs/tags/v0.1.2.tar.gz"
  sha256 "891653485a4bf0f0f0d305be97224d44cc96889296ba5b83887c1220a7b6ef15"
  license "Apache-2.0"

  depends_on "node"

  def install
    # Full install (devDeps needed to compile TypeScript; root `prepare` hook builds core then cli)
    system "npm", "ci"
    # Prune dev dependencies, keep workspace symlinks + prod deps (reinstall without scripts so dist/ stays built)
    rm_r "node_modules"
    system "npm", "ci", "--omit=dev", "--ignore-scripts"
    libexec.install Dir["packages", "node_modules"]
    chmod 0755, libexec/"packages/cli/dist/index.js"
    (bin/"opentrustbench").write <<~EOS
      #!/bin/bash
      exec "#{libexec}/packages/cli/dist/index.js" "$@"
    EOS
    chmod 0755, bin/"opentrustbench"
  end

  test do
    assert_match "opentrustbench", shell_output("#{bin}/opentrustbench --version")
    (testpath/"probe.js").write("console.log('hi');\n")
    output = shell_output("#{bin}/opentrustbench scan #{testpath} --no-banner --no-color")
    assert_match "Trust Grade:", output
  end
end
