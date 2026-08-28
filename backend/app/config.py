"""Application configuration."""
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "Vaahan Saarthi"
    # Azure OpenAI — optional. When empty, the AI layer uses a rule-based fallback.
    azure_openai_api_key: str = ""
    azure_openai_endpoint: str = ""
    azure_openai_deployment: str = "gpt-4o"
    azure_openai_api_version: str = "2024-08-01-preview"

    # Web search providers — optional. Used to ground answers with live data.
    tavily_api_key: str = ""
    google_api_key: str = ""
    google_cse_id: str = ""

    # OCR.space — free tier at https://ocr.space/ocrapi (demo key: helloworld)
    ocr_space_api_key: str = "helloworld"

    @property
    def azure_enabled(self) -> bool:
        return bool(self.azure_openai_api_key and self.azure_openai_endpoint)

    @property
    def search_enabled(self) -> bool:
        return bool(self.tavily_api_key or (self.google_api_key and self.google_cse_id))


@lru_cache
def get_settings() -> Settings:
    return Settings()
