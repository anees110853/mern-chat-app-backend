const router = require('express').Router();
const { chatController } = require('../../controllers');
const { authMiddleware } = require('../../middlewares');

router.post(
  '/create_chat',
  authMiddleware.verifyUser,
  chatController.createChat
);

module.exports = router;
