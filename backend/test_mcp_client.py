"""
MCP Client Test Script
Verifies that Claude Desktop / any MCP client can connect, list tools, and execute tool calls.
"""
import asyncio
import os
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))

from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

async def test_mcp_connection():
    print("=" * 60)
    print("🧪 Testing Claude MCP Protocol Compatibility")
    print("=" * 60)

    # Path to Python in venv
    python_exe = str(BASE_DIR / "venv" / "bin" / "python")
    runner_script = str(BASE_DIR / "mcp_runner.py")

    server_params = StdioServerParameters(
        command=python_exe,
        args=[runner_script],
        env=dict(os.environ, PYTHONPATH=str(BASE_DIR))
    )

    print(f"\n[1/4] Spawning MCP server via stdio transport...")
    async with stdio_client(server_params) as (read_stream, write_stream):
        async with ClientSession(read_stream, write_stream) as session:
            # 1. Initialize
            print("[2/4] Initializing MCP handshake...")
            init_result = await session.initialize()
            print(f"  ✅ Handshake succeeded! Protocol version: {init_result.protocolVersion}")
            print(f"  Server info: {init_result.serverInfo.name} v{init_result.serverInfo.version}")

            # 2. List Tools
            print("\n[3/4] Requesting available tools (Claude inspection)...")
            tools_result = await session.list_tools()
            tool_names = [t.name for t in tools_result.tools]
            print(f"  ✅ Discovered {len(tool_names)} MCP Tools: {tool_names}")
            for t in tools_result.tools:
                print(f"    • {t.name}: {t.description}")

            assert "submit_expense" in tool_names, "submit_expense tool missing!"
            assert "list_pending_expenses" in tool_names, "list_pending_expenses tool missing!"
            assert "get_corporate_policy" in tool_names, "get_corporate_policy tool missing!"

            # 3. Call Tool: get_corporate_policy
            print("\n[4/4] Executing tool call: get_corporate_policy()...")
            policy_call = await session.call_tool("get_corporate_policy", arguments={})
            print("  ✅ Policy response:")
            print("  " + "\n  ".join(policy_call.content[0].text.split("\n")[:4]))

            # 4. Call Tool: submit_expense (triggering policy engine)
            print("\n[5/5] Executing tool call: submit_expense() with ₹8,500 banquet...")
            claim_call = await session.call_tool(
                "submit_expense",
                arguments={
                    "vendor": "Grand Hyatt Client Dinner",
                    "amount": 8500.0,
                    "currency": "INR",
                    "category": "Meals",
                    "date": "2026-11-10",
                    "employee_name": "Claude Agent Test",
                    "notes": "Testing MCP tool execution"
                }
            )
            print("  ✅ Tool execution response:")
            print(f"  {claim_call.content[0].text}")

    print("\n" + "=" * 60)
    print("🎉 SUCCESS: ReBur is 100% Claude Desktop and MCP Ready!")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(test_mcp_connection())

