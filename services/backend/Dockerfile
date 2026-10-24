FROM python:3.13-slim

WORKDIR /app

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY ruff.toml .

COPY ./app ./app

COPY ./tests ./tests

CMD ["fastapi", "dev", "app/main.py", "--host", "0.0.0.0", "--port", "8000", "--reload"]
