import time
from functools import wraps
from typing import Callable, Any


class RateLimiter:
    """요청 간격 제어"""

    def __init__(self, min_interval: float = 1.0):
        self.min_interval = min_interval
        self._last_call = 0.0

    def wait(self) -> None:
        elapsed = time.time() - self._last_call
        if elapsed < self.min_interval:
            time.sleep(self.min_interval - elapsed)
        self._last_call = time.time()


def rate_limited(min_interval: float = 1.0) -> Callable:
    """데코레이터: 함수 호출 간격 제한"""
    limiter = RateLimiter(min_interval)

    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args: Any, **kwargs: Any) -> Any:
            limiter.wait()
            return func(*args, **kwargs)
        return wrapper
    return decorator
