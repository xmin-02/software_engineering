from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # DB
    postgres_db: str = "cheonan_sentiment"
    postgres_user: str = "postgres"
    postgres_password: str = "postgres"
    postgres_host: str = "localhost"
    postgres_port: int = 5432

    # API 인증
    pipeline_api_key: str = ""

    # 네이버 API
    naver_client_id: str = ""
    naver_client_secret: str = ""

    # 카카오 API
    kakao_rest_api_key: str = ""

    # Ollama
    ollama_host: str = "http://localhost:11434"

    # 크롤링 스케줄
    crawl_schedule_hours: int = 6

    @property
    def database_url(self) -> str:
        return (
            f"postgresql://{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
