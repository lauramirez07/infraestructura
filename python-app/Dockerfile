
FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt \
    && adduser --disabled-password --gecos "" --uid 10001 appuser

COPY --chown=appuser:appuser app.py .

EXPOSE 5000

USER appuser

CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "2", "app:app"]
