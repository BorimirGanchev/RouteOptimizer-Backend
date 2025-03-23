from flask import Flask, request, jsonify
import numpy as np
from sklearn.cluster import KMeans
from scipy.spatial.distance import cdist
from pymongo import MongoClient
from dotenv import load_dotenv
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)

load_dotenv()
mongo_uri = os.getenv("MONGODB_URI")
client = MongoClient(mongo_uri)
db = client.get_database()
users_collection = db["Users"] 

@app.route('/process-orders', methods=['POST'])
def process_orders():
    try:
        data = request.get_json()

        if not data:
            return jsonify({"error": "Received empty data"}), 400

        order_ids = list(data.keys())
        locations = list(data.values())

        if not all(isinstance(coord, list) and len(coord) == 2 for coord in locations):
            return jsonify({"error": "XA must be a 2-dimensional array."}), 400

        locations = np.array(locations)

        if locations.shape[0] == 0 or locations.shape[1] != 2:
            return jsonify({"error": "Invalid locations format"}), 400

        office = np.array([[42.7000, 23.3200]])

        num_clusters = users_collection.count_documents({"status": "available"})
        num_clusters = max(num_clusters, 1)

        distances = cdist(locations, office, metric='euclidean').flatten()

        workload = (np.ones(len(locations)) + distances) / np.max(distances)

        locations_with_workload = np.hstack((locations, workload.reshape(-1, 1)))

        kmeans = KMeans(n_clusters=num_clusters, random_state=42, n_init=10)
        kmeans.fit(locations_with_workload)

        labels = kmeans.labels_

        result_map = {order_ids[i]: int(labels[i]) for i in range(len(order_ids))}
        return jsonify(result_map)

    except Exception as e:
        return jsonify({"error": str(e)})

if __name__ == '__main__':
    app.run(debug=True)
