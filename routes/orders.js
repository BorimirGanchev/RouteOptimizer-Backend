const express = require('express');
const processedData = require('../DataProcessing/dataProcessing');
const router = express.Router();

router.get('/', processedData.getOrdersCanceled);

module.exports = router;