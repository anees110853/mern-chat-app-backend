const { default: mongoose } = require('mongoose');
const { messageService } = require('../services');
const { text } = require('express');
const { SOCKET_EVENTS } = require('../constants');

const createMessage = async (req, res) => {
  try {
    const result = await messageService.addMessage({
      chatId: new mongoose.Types.ObjectId(req.body.chatId),
      sender: new mongoose.Types.ObjectId(req.body.sender),
      message: req.body.text,
    });

    if (result) {
      res.status(200).json({ message: 'Message Created Successfully' });

      const io = req.app.get('socketio');

      io.emit(SOCKET_EVENTS.re_fetch_messages, {
        chatId: req.body.chatId,
      });
    }
  } catch (error) {
    res.status(500).send('Something Went Wrong');
    console.log(error);
  }
};

const getMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const pageNo = Number(req.query.pageNo) || 1;
    const pageSize = Number(req.query.pageSize) || 10;
    const query = [
      {
        $match: {
          chatId: new mongoose.Types.ObjectId(chatId),
        },
      },
      {
        $sort: {
          createdAt: 1,
        },
      },
      {
        $facet: {
          meta: [{ $count: 'total' }],
          data: [{ $skip: (pageNo - 1) * pageSize }, { $limit: pageSize }],
        },
      },
    ];

    const result = await messageService.aggregate(query);

    let data = result[0].data;
    const meta = {
      current_page: parseInt(pageNo),
      total_pages: Math.ceil(result[0]?.meta[0]?.total / pageSize),
      total_count: result[0]?.meta[0]?.total,
      per_page: pageSize,
    };
    return res.status(200).send({ data, meta });
  } catch (error) {}
};

module.exports = {
  createMessage,
  getMessages,
};
