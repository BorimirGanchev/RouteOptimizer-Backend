from flask import Flask, request, jsonify
import numpy as np
from sklearn.cluster import KMeans
from scipy.spatial.distance import cdist
from pymongo import MongoClient
from dotenv import load_dotenv
import os

app = Flask(__name__)

load_dotenv()
mongo_uri = os.getenv("MONGODB_URI")
client = MongoClient(mongo_uri)
db = client.get_database()
users_collection = db["Users"] 

@app.route('/process-orders', methods=['POST'])
def process_orders():
    try:
        data = request.json  # Expecting an array of arrays
        locations = np.array(data)

        # Given locations (delivery points)
        # locations = np.array([
        #     [42.6977, 23.3219],  # Sofia City Center
        #     [42.6511, 23.3793],  # Lyulin District
        #     [42.6895, 23.3321],  # NDK (National Palace of Culture)
        #     [42.6675, 23.3516],
        #     [42.7111, 23.3247],
        #     [42.6745, 23.2861],
        #     [42.6567, 23.2705],
        #     [42.6833, 23.3167],
        #     [42.6951, 23.3307],
        #     [42.6804, 23.3197],
        #     [42.7022, 23.3105],
        #     [42.6615, 23.2897],
        #     [42.7198, 23.3462],
        #     [42.6789, 23.3644],
        #     [42.6903, 23.2789],
        #     [42.7057, 23.3361],
        #     [42.6731, 23.3074],
        #     [42.6882, 23.2902],
        #     [42.6589, 23.3591],
        #     [42.7123, 23.3658],
        # ])
        
        # Define the office location
        office = np.array([[42.7000, 23.3200]])  # Example: Office in central Sofia
        
        # Fetch the number of users with status = "available"
        num_clusters = users_collection.count_documents({"status": "available"})
        
        # If no available users, default to 1 cluster
        num_clusters = max(num_clusters, 1)
        
        # Compute distances from office for each location
        distances = cdist(locations, office, metric='euclidean').flatten()
        
        # Define workload as: workload = number of packages (1 per location) + distance
        workload = np.ones(len(locations)) + distances
        
        # Normalize workload for fairness
        workload = workload / np.max(workload)
        
        # Modify locations for clustering by adding workload as an additional feature
        locations_with_workload = np.hstack((locations, workload.reshape(-1, 1)))
        
        # Perform K-Means clustering considering workload
        kmeans = KMeans(n_clusters=num_clusters, random_state=42, n_init=10)
        kmeans.fit(locations_with_workload)  # Fit with workload-enhanced locations
        
        labels = kmeans.labels_
        
        # Organize results into clusters
        clusters = {i: [] for i in range(num_clusters)}
        for i, label in enumerate(labels):
            clusters[label].append(locations[i].tolist())
        
        # Convert clusters to an array of arrays
        cluster_result = [clusters[i] for i in range(num_clusters)]
        
        return jsonify(cluster_result)
    except Exception as e:
        return jsonify({"error": str(e)})

if __name__ == '__main__':
    app.run(debug=True)
