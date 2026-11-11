import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))

from app.mcp_server import mcp

if __name__ == "__main__":
    # Runs the stdio MCP server for Claude Desktop
    mcp.run(transport="stdio")

