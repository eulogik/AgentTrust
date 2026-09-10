class Opentrustbench < Formula
  desc "Open-source AI agent and MCP server security scanner"
  homepage "https://opentrustbench.com"
  url "https://github.com/eulogik/OpenTrustBench/archive/refs/tags/v0.1.0.tar.gz"
  sha256 "PLACEHOLDER_SHA256"
  license "Apache-2.0"

  depends_on "node@20"

  def install
    system "npm", "install", *std_npm_args
    system "npm", "run", "build"
    libexec.install Dir["packages/*"]
    bin.install_symlink Dir["#{libexec}/packages/cli/dist/index.js"]
  end

  test do
    assert_match "OpenTrustBench", shell_output("#{bin}/opentrustbench --version")
  end
end
