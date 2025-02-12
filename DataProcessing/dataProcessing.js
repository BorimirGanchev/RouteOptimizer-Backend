const dataExtraction = require('./dataExtraction');

exports.getAllOrders = async (req, res) => {
    try {
        const orders = await dataExtraction.getAllOrders();
        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getOrdersForDelivery = async (req, res) => {
    try {
        const { status } = req.params;
        const allOrders = await dataExtraction.getAllOrders();
        const filteredOrders = allOrders.filter(order => order.orderStatus === "for delivery"); 
        res.status(200).json(filteredOrders);
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