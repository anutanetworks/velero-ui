FROM python:3.10-slim-bullseye

RUN apt-get update && apt-get install -y curl && \
    curl -L https://github.com/vmware-tanzu/velero/releases/download/v1.11.0/velero-v1.11.0-linux-amd64.tar.gz | tar xvz && \
    mv velero-v1.11.0-linux-amd64/velero /usr/local/bin && \
    chmod +x /usr/local/bin/velero && \
    rm -rf velero-v1.11.0-linux-amd64

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY ./src /app/src
COPY ./static /app/static
COPY ./templates /app/templates

CMD ["gunicorn", "src.main:app", "--bind", "0.0.0.0:5000"]
