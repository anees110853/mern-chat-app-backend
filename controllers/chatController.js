const { default: mongoose } = require('mongoose');
const { jwtService, userService, chatService } = require('../services');
const { SOCKET_EVENTS } = require('../constants');

const createChat = async (req, res) => {
  try {
    const { users, isGroup, groupName } = req.body;

    if (!users?.length) {
      return res.status(403).json({ error: 'Users required' });
    }

    // here i want to check if there is any chat already exist that have creator as req.user._id, isGroup false and participants array equal to users

    const userIds = users.map((id) => {
      return new mongoose.Types.ObjectId(id);
    });

    let condition;

    if (isGroup) {
      condition = { groupName: groupName, isGroup: true };
    }

    const existingChat = await chatService.getOneChat({
      ...condition,
      participants: { $all: [...userIds, req?.user?._id] },
    });

    if (existingChat) {
      return res
        .status(409)
        .json({ error: `${isGroup ? 'Group' : 'Chat'} already exists` });
    }

    const newChat = await chatService.addChat({
      creator: new mongoose.Types.ObjectId(req.user?._id),
      participants: [...userIds, req.user?._id],
      ...condition,
    });

    if (!newChat) {
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    const io = req.app.get('socketio');

    io.emit(SOCKET_EVENTS.re_fetch_chats, {
      ids: [...users, req.user._id.toString()],
    });

    res.status(200).json({ message: 'Success' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const getMyChats = async (req, res) => {
  try {
    const user = req.user;

    const query = [
      {
        $match: {
          $or: [{ creator: user?._id }, { participants: user?._id }],
        },
      },
      {
        $addFields: {
          participants: {
            $cond: {
              if: { $eq: ['$isGroup', false] },
              then: {
                $filter: {
                  input: '$participants',
                  as: 'participant',
                  cond: { $ne: ['$$participant', user?._id] },
                },
              },
              else: '$participants',
            },
          },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'participants',
          foreignField: '_id',
          as: 'users',
        },
      },
      {
        $sort: {
          updatedAt: -1,
        },
      },
    ];

    const data = await chatService.aggregate(query);

    res.status(200).json({ message: 'Chat Finds Successfully', data: data });
  } catch (error) {
    res.status(500).json({ error });
  }
};

const getChatDetail = async (req, res) => {
  try {
    const { chatId } = req.params;

    const query = [
      {
        $match: {
          _id: new mongoose.Types.ObjectId(chatId),
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'participants',
          foreignField: '_id',
          as: 'users',
        },
      },
    ];

    const data = await chatService.aggregate(query);

    res.status(200).json({ message: 'Chat Finds Successfully', data: data });
  } catch (error) {
    res.status(500).json({ error });
  }
};

module.exports = {
  createChat,
  getMyChats,
  getChatDetail,
};
