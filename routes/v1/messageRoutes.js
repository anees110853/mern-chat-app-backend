const router = require('express').Router();
const { messsageController } = require('../../controllers');
const { authMiddleware } = require('../../middlewares');

router.post('/create', messsageController.createMessage);

module.exports = router;
