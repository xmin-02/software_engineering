FROM python:3.12-slim

WORKDIR /app

# psycopg2-binary 런타임 의존성
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements-api.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ ./backend/

ENV PYTHONUNBUFFERED=1 \
    DISABLE_SCHEDULER=1

EXPOSE 3001

CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "3001"]
