FROM python:3.12-slim
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg fonts-dejavu-core curl ca-certificates \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
RUN mkdir -p /app/fonts && (curl -fsSL -o /app/fonts/Montserrat-ExtraBold.ttf \
      "https://github.com/JulietaUla/Montserrat/raw/master/fonts/ttf/Montserrat-ExtraBold.ttf" || true)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY app ./app
ENV PYTHONUNBUFFERED=1 FONT_DIR=/app/fonts PORT=8080
CMD exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT}
