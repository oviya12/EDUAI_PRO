from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    litellm_base_url: str = "http://localhost:4000"
    litellm_api_key: str = ""
    litellm_model: str = "medical-gemini"
    ncbi_tool_email: str = ""
    ncbi_api_key: str = ""
    openfda_api_key: str = ""
    app_host: str = "127.0.0.1"
    app_port: int = 8000
    max_results_per_source: int = 5
    request_timeout_seconds: float = 20.0

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
