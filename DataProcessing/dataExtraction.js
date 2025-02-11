const Order = require('../database/shemas/index').Order; 

exports.getAllOrders = async () => {
    try {
        const orders = await Order.find();
        return orders; 
    } catch (error) {
        console.error('Error fetching orders:', error.message);
        throw new Error('Failed to fetch orders');
    }
};
