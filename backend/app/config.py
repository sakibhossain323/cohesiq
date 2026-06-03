from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str
    secret_key: str
    access_token_expire_minutes: int = 60 * 24  # 24 hours
    clerk_webhook_secret: str | None = None  # Set in production via CLERK_WEBHOOK_SECRET
    clerk_issuer_url: str | None = None  # Needed to fetch JWKS for JWT verification
    youtube_api_key: str | None = None

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
