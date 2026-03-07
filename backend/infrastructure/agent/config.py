from pydantic import ConfigDict
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    LLM_PROVIDER: str = "gemini"
    GOOGLE_API_KEY: str | None = None
    OPENAI_API_KEY: str | None = None
    LLM_MAX_TOKENS: int = 4096

    model_config = ConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
