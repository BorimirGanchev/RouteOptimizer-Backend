const dataExtraction = require('./dataExtraction');

exports.getAllOrders = async (req, res) => {
    try {
        const orders = await dataExtraction.getAllOrders();
        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};