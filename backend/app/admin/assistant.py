"""Admin AI Assistant — a LangChain agent that answers admin questions by
calling the Cohesiq MCP server's tools.

This closes a real MCP loop:

    admin question
      → LangChain tool-calling agent (Groq llama-3.1-8b-instant)
      → tools loaded from the Cohesiq MCP server via langchain-mcp-adapters
      → real PostgreSQL data

Design rules:
  * Fail-soft. Any missing key / unreachable MCP / import error returns a
    friendly "assistant offline" payload — it NEVER raises into the request
    path, so the admin panel always renders.
  * Read-mostly. The agent can run matching and read stats, but the heavy
    deterministic logic still lives in the service layer behind the MCP tools.
"""

from __future__ import annotations

from app.config import settings


async def ask_admin_assistant(question: str) -> dict:
    """Answer an admin question using the LangChain + MCP agent.

    Returns a dict: {ok, answer, tools_used, offline_reason?}.
    """
    question = (question or "").strip()
    if not question:
        return {"ok": False, "answer": "Please enter a question.", "tools_used": []}

    if not settings.assistant_enabled:
        return _offline("The AI Assistant is disabled (ASSISTANT_ENABLED=false).")

    if not settings.groq_api_key:
        return _offline("GROQ_API_KEY is not configured on the backend.")

    try:
        from langchain_groq import ChatGroq
        from langchain_mcp_adapters.client import MultiServerMCPClient
    except Exception as exc:  # pragma: no cover - deps present in prod image
        return _offline(f"Assistant dependencies unavailable: {exc}")

    try:
        # 1. Load the Cohesiq MCP server's tools as LangChain tools.
        mcp_client = MultiServerMCPClient(
            {
                "cohesiq": {
                    "url": settings.mcp_http_url,
                    "transport": "streamable_http",
                }
            }
        )
        tools = await mcp_client.get_tools()
    except Exception as exc:
        return _offline(f"Could not reach the Cohesiq MCP server: {exc}")

    if not tools:
        return _offline("The Cohesiq MCP server exposed no tools.")

    try:
        llm = ChatGroq(
            model=settings.assistant_model,
            api_key=settings.groq_api_key,
            temperature=0,
        )
        result = await _run_agent(llm, tools, question)
        return result
    except Exception as exc:
        return _offline(f"The assistant failed to answer: {exc}")


async def _run_agent(llm, tools, question: str) -> dict:
    """Run a tool-calling agent over the MCP tools.

    Prefers langgraph's prebuilt ReAct agent (robust multi-step loop); falls
    back to langchain's AgentExecutor if langgraph is unavailable.
    """
    system = (
        "You are the Cohesiq admin assistant. Cohesiq is a B2B influencer-"
        "matching platform for Bangladesh. Answer the admin's question using "
        "the provided tools, which read the live database. Be concise and "
        "factual. When you cite numbers, they come from the tools. If a tool "
        "returns an error, say so plainly instead of guessing."
    )

    # --- Path A: langgraph prebuilt ReAct agent ---
    try:
        from langgraph.prebuilt import create_react_agent
        from langchain_core.messages import HumanMessage, SystemMessage

        agent = create_react_agent(llm, tools)
        state = await agent.ainvoke(
            {"messages": [SystemMessage(content=system), HumanMessage(content=question)]}
        )
        messages = state.get("messages", [])
        answer = messages[-1].content if messages else ""
        tools_used = [
            tc["name"]
            for m in messages
            for tc in (getattr(m, "tool_calls", None) or [])
        ]
        return {"ok": True, "answer": answer, "tools_used": sorted(set(tools_used))}
    except ImportError:
        pass  # langgraph not installed — fall through to AgentExecutor.

    # --- Path B: langchain AgentExecutor (tool-calling) ---
    from langchain.agents import AgentExecutor, create_tool_calling_agent
    from langchain_core.prompts import ChatPromptTemplate

    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", system),
            ("human", "{input}"),
            ("placeholder", "{agent_scratchpad}"),
        ]
    )
    agent = create_tool_calling_agent(llm, tools, prompt)
    executor = AgentExecutor(agent=agent, tools=tools, max_iterations=6, verbose=False)
    out = await executor.ainvoke({"input": question})
    return {
        "ok": True,
        "answer": out.get("output", ""),
        "tools_used": sorted({t.name for t in tools}),
    }


def _offline(reason: str) -> dict:
    return {
        "ok": False,
        "answer": (
            "The AI Assistant is temporarily offline, so I can't answer that "
            "right now. The rest of the admin panel is unaffected."
        ),
        "tools_used": [],
        "offline_reason": reason,
    }
