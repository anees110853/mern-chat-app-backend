const { default: mongoose } = require('mongoose');
const { jwtService, userService, chatService } = require('../services');

const createChat = async (req, res) => {
  try {
    const { users } = req.body;

    if (!users?.length) {
      return res.status(403).json({ error: 'Users required' });
    }

    // here i want to check if there is any chat already exist that have creator as req.user._id, isGroup false and participants array equal to users

    const userIds = users.map((id) => {
      return new mongoose.Types.ObjectId(id);
    });

    const existingChat = await chatService.getOneChat({
      creator: req.user?._id,
      isGroup: false,
      participants: { $size: userIds.length, $all: userIds },
    });

    if (existingChat) {
      return res.status(409).json({ error: 'Chat already exists' });
    }

    const newChat = await chatService.addChat({
      creator: new mongoose.Types.ObjectId(req.user?._id),
      participants: userIds,
      isGroup: false,
    });

    if (!newChat) {
      return res.status(500).json({ error: 'Internal Server Error' });
    }
    res.status(200).json({ message: 'Success' });
  } catch (error) {}
};

module.exports = {
  createChat,
};
