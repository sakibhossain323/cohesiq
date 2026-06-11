from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str
    secret_key: str
    access_token_expire_minutes: int = 60 * 24  # 24 hours
    clerk_webhook_secret: str | None = None
    cron_secret: str | None = None  # Shared secret for n8n → backend cron endpoints
    redis_url: str | None = None    # e.g. redis://redis:6379/0 — optional, soft-fail
    clerk_issuer_url: str | None = None
    clerk_secret_key: str | None = None
    youtube_api_key: str | None = None
    apify_api_token: str | None = None
    apify_actor_id: str | None = None
    apify_instagram_actor_id: str | None = None
    apify_tiktok_actor_id: str | None = None
    apify_wait_secs: int = 120
    groq_api_key: str | None = None
    gemini_api_key: str | None = None

    # --- AI-usage stack (branch sakib/ai-score-max) ---
    # Admin AI Assistant (LangChain agent → Cohesiq MCP server)
    assistant_enabled: bool = True
    assistant_model: str = "llama-3.1-8b-instant"
    mcp_http_url: str = "http://mcp:8001/mcp"
    # Optional local-LLM runtime (Ollama / Hermes). When set, providers may prefer it.
    ollama_base_url: str | None = None
    ollama_model: str = "hermes3"

    @property
    def resolved_apify_api_token(self) -> str | None:
        # Keep a compatibility alias for the common "Appify" typo.
        import os

        return self.apify_api_token or os.getenv("APPIFY_API_TOKEN")

    @property
    def resolved_apify_instagram_actor_id(self) -> str:
        import os

        return (
            os.getenv("APIFY_INSTAGRAM_ACTOR_ID")
            or os.getenv("APPIFY_INSTAGRAM_ACTOR_ID")
            or self.apify_instagram_actor_id
            or os.getenv("APIFY_ACTOR_ID")
            or os.getenv("APPIFY_ACTOR_ID")
            or self.apify_actor_id
            or "apify/instagram-scraper"
        )

    @property
    def resolved_apify_tiktok_actor_id(self) -> str:
        import os

        return (
            os.getenv("APIFY_TIKTOK_ACTOR_ID")
            or os.getenv("APPIFY_TIKTOK_ACTOR_ID")
            or self.apify_tiktok_actor_id
            or os.getenv("APIFY_ACTOR_ID")
            or os.getenv("APPIFY_ACTOR_ID")
            or self.apify_actor_id
            or "clockworks/free-tiktok-scraper"
        )

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
