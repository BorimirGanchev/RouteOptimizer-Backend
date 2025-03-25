FROM python:latest

WORKDIR /app

COPY kMeansClusteringAlgorithum.py requirements.txt ./

RUN pip install --no-cache-dir -r requirements.txt || echo "No requirements.txt found, skipping installation."

EXPOSE 5000

ENV FLASK_APP=kMeansClusteringAlgorithum.py

CMD ["flask", "run", "--host=0.0.0.0", "--port=5000"]