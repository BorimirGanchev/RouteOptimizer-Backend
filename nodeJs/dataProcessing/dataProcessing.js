const dataExtraction = require('./dataExtraction');
const axios = require('axios');


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
        const coordinates = [
            [42.6977, 23.3219], // Sofia City Center
            [42.6511, 23.3793], // Lyulin District
            [42.6895, 23.3321], // NDK (National Palace of Culture)
            [42.6675, 23.3516],
            [42.7111, 23.3247],
            [42.6745, 23.2861],
            [42.6567, 23.2705],
            [42.6833, 23.3167],
            [42.6951, 23.3307],
            [42.6804, 23.3197],
            [42.7022, 23.3105],
            [42.6615, 23.2897],
            [42.7198, 23.3462],
            [42.6789, 23.3644],
            [42.6903, 23.2789],
            [42.7057, 23.3361],
            [42.6731, 23.3074],
            [42.6882, 23.2902],
            [42.6589, 23.3591],
            [42.7123, 23.3658]
        ];
        const filteredOrders = allOrders
            .filter(order => order.orderStatus === "for deployment")
            .map(order => ({
                senderAddress: order.senderAddress,
            }));

        if (filteredOrders.length === 0) {
            return res.status(400).json({ error: "No valid orders for deployment" });
        }
        const axiosResponse = await axios.post("http://127.0.0.1:5000/process-orders", coordinates);
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