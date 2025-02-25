const dataExtraction = require('./dataExtraction');
const axios = require('axios');
require("dotenv").config();

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

const axiosInstance = axios.create({
    timeout: 10000,  // Increase timeout to 10 seconds
    family: 4        // Force IPv4 instead of IPv6
});

async function getCoordinates(address) {
    try {
        const response = await axiosInstance.get("https://maps.googleapis.com/maps/api/geocode/json", {
            params: {
                address: address,
                key: GOOGLE_API_KEY
            }
        });

        if (response.data.status === "OK") {
            const location = response.data.results[0].geometry.location;
            return [location.lat, location.lng];
        } else {
            console.error(`Geocoding failed for ${address}: ${response.data.status}`);
            return null;
        }
    } catch (error) {
        console.error(`Error fetching coordinates for address: ${address}`, error.message);
        return null;
    }
}


exports.getAllOrders = async (req, res) => {
    try {
        const orders = await dataExtraction.getAllOrders();
        const fieldsOfTheOrders = orders.map(order => ({
            fullName: order.fullName,
            senderAddress: order.senderAddress,
            recipientAddress: order.recipientAddress,
            orderStatus: order.orderStatus,
            senderPhone: order.senderPhone,
            recipientPhone: order.recipientPhone,
            orderPrice: order.orderPrice
        }));

        res.status(200).json(fieldsOfTheOrders);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getOrdersForDelivery = async (req, res) => {
    try {
        const { status } = req.params;
        const allOrders = await dataExtraction.getAllOrders();

        // Extract addresses
        const filteredOrders = allOrders
            .filter(order => order.orderStatus === "for deployment")
            .map(order => order.senderAddress);

        if (filteredOrders.length === 0) {
            return res.status(400).json({ error: "No valid orders for deployment" });
        }

        // Convert addresses to coordinates
        const coordinates = await Promise.all(
            filteredOrders.map(async (address) => await getCoordinates(address))
        );

        // Filter out any failed conversions
        const validCoordinates = coordinates.filter(coord => coord !== null);

        if (validCoordinates.length === 0) {
            return res.status(400).json({ error: "Failed to retrieve any valid coordinates" });
        }

        // Send coordinates to Flask API
        const axiosResponse = await axios.post("http://127.0.0.1:5000/process-orders", validCoordinates);
        res.status(200).json(axiosResponse.data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getOrdersCanceled = async (req, res) => {
    try {
        const { status } = req.params;
        const allOrders = await dataExtraction.getAllOrders(); 
        const filteredOrders = allOrders.filter(order => order.orderStatus === "canceled"); 
        res.status(200).json(filteredOrders);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getOrdersPostponed = async (req, res) => {
    try {
        const { status } = req.params;
        const allOrders = await dataExtraction.getAllOrders(); 
        const filteredOrders = allOrders.filter(order => order.orderStatus === "posponed"); 
        res.status(200).json(filteredOrders);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};