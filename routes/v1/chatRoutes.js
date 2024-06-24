const router = require('express').Router();
const { chatController } = require('../../controllers');
const { authMiddleware } = require('../../middlewares');

router.post(
  '/create_chat',
  authMiddleware.verifyUser,
  chatController.createChat
);

router.get(
  '/get_my_chats',
  authMiddleware.verifyUser,
  chatController.getMyChats
);

router.get(
  '/get_chat_detail/:chatId',
  authMiddleware.verifyUser,
  chatController.getChatDetail
);

module.exports = router;
