import json
from pathlib import Path

CONFIG_DIR = Path(__file__).parent.parent / "config"


def _load_config(filename: str) -> dict:
    """JSON 설정 파일 로드"""
    path = CONFIG_DIR / filename
    if not path.exists():
        return {}
    with open(path, encoding="utf-8") as f:
        return json.load(f)


class Settings:
    """JSON 설정 파일 기반 설정"""

    def __init__(self):
        self._db = _load_config("database.json")
        self._naver = _load_config("naver_api.json")
        self._kakao = _load_config("kakao_api.json")
        self._saramin = _load_config("saramin_api.json")
        self._data_go_kr = _load_config("data_go_kr_api.json")
        self._pipeline = _load_config("pipeline.json")
        self._ollama = _load_config("ollama.json")

    # DB
    @property
    def database_url(self) -> str:
        d = self._db
        return (
            f"postgresql://{d.get('user', 'postgres')}:{d.get('password', 'postgres')}"
            f"@{d.get('host', 'localhost')}:{d.get('port', 5432)}/{d.get('db', 'cheonan_sentiment')}"
        )

    # 네이버 API
    @property
    def naver_client_id(self) -> str:
        return self._naver.get("client_id", "")

    @property
    def naver_client_secret(self) -> str:
        return self._naver.get("client_secret", "")

    # 카카오 API
    @property
    def kakao_rest_api_key(self) -> str:
        return self._kakao.get("rest_api_key", "")

    # 사람인 API
    @property
    def saramin_api_key(self) -> str:
        return self._saramin.get("api_key", "")

    # data.go.kr API
    @property
    def data_go_kr_api_key(self) -> str:
        return self._data_go_kr.get("api_key", "")

    # 파이프라인 인증
    @property
    def pipeline_api_key(self) -> str:
        return self._pipeline.get("api_key", "")

    # Ollama
    @property
    def ollama_host(self) -> str:
        return self._ollama.get("host", "http://localhost:11434")


settings = Settings()
