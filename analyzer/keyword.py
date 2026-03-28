from keybert import KeyBERT
from sentence_transformers import SentenceTransformer

# 한국어 SBERT 모델
EMBEDDING_MODEL = "jhgan/ko-sbert-nli"


class KeywordExtractor:
    """KeyBERT 기반 키워드 추출"""

    def __init__(self, embedding_model: str = EMBEDDING_MODEL):
        self._embedding_model_name = embedding_model
        self._model = None

    def _load_model(self) -> None:
        if self._model is None:
            sentence_model = SentenceTransformer(self._embedding_model_name)
            self._model = KeyBERT(model=sentence_model)

    def extract(self, text: str, top_n: int = 5) -> list[str]:
        """텍스트에서 키워드 추출 → 키워드 리스트"""
        self._load_model()
        keywords = self._model.extract_keywords(
            text,
            keyphrase_ngram_range=(1, 2),
            stop_words=None,
            top_n=top_n,
            use_mmr=True,
            diversity=0.5,
        )
        return [kw for kw, _ in keywords]

    def extract_batch(self, texts: list[str], top_n: int = 5) -> list[list[str]]:
        """배치 키워드 추출"""
        self._load_model()
        results = self._model.extract_keywords(
            texts,
            keyphrase_ngram_range=(1, 2),
            stop_words=None,
            top_n=top_n,
            use_mmr=True,
            diversity=0.5,
        )
        # 단일 문서면 리스트 감싸기
        if texts and isinstance(results[0], tuple):
            results = [results]
        return [[kw for kw, _ in doc_kws] for doc_kws in results]
