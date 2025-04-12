const express = require('express');
const app = express();
const cors = require('cors');
const processedData = require('../dataProcessing/dataProcessing');
const router = express.Router();

app.use(cors());
app.use(express.json());

router.get('/', processedData.getOrdersForDelivery);

module.exports = router;