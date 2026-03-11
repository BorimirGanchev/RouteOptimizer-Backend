const dataExtraction = require('./dataExtraction');
const axios = require('axios');
require("dotenv").config();

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const API_HOST = process.env.API_HOST || "http://localhost:5000";

const axiosInstance = axios.create({
    timeout: 10000,  
    family: 4        
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
        const allOrders = await dataExtraction.getAllOrders();
        console.log("Fetched all orders:", allOrders);

        const orderAddressMap = {};
        allOrders.forEach(order => {
            if (order.orderStatus === "for deployment") {
                orderAddressMap[order._id] = order.senderAddress;
            }
        });
        console.log("Order address map:", orderAddressMap);

        if (Object.keys(orderAddressMap).length === 0) {
            return res.status(400).json({ error: "No valid orders for deployment" });
        }

        const orderCoordinatesMap = {};
        for (const [orderId, address] of Object.entries(orderAddressMap)) {
            const coords = await getCoordinates(address);
            console.log(`Coordinates for ${address}:`, coords);
            if (coords) {
                orderCoordinatesMap[orderId] = coords;
            }
        }
        console.log("Order coordinates map:", orderCoordinatesMap);

        if (Object.keys(orderCoordinatesMap).length === 0) {
            return res.status(400).json({ error: "Failed to retrieve any valid coordinates" });
        }

        const axiosResponse = await axios.post(
            `${API_HOST}/process-orders`,
            orderCoordinatesMap,
            {
                headers: {
                    Authorization: req.headers.authorization,
                },
            }
        );
        console.log("Response from K-Means service:", axiosResponse.data);

        res.status(200).json(axiosResponse.data);
    } catch (error) {
        console.error("Error in getOrdersForDelivery:", error.message);
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