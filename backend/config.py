from pydantic_settings import BaseSettings
from typing import Optional, List


class Settings(BaseSettings):
    # LLM
    openai_api_key: str = ""
    anthropic_api_key: Optional[str] = None
    model_name: str = "gpt-4o"
    fast_model_name: str = "gpt-4o-mini"
    temperature: float = 0.1
    max_tokens: int = 4096

    # Search Tools
    tavily_api_key: Optional[str] = None
    max_web_results: int = 5
    max_academic_results: int = 5

    # Research Config
    max_research_iterations: int = 3

    # Memory
    chroma_persist_dir: str = "./data/chroma_db"

    # API Config
    cors_origins: List[str] = ["http://localhost:5173", "http://localhost:3000"]

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
