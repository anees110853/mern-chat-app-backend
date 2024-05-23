const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const messageSchema = new Schema(
  {
    chatId: {
      type: Schema.Types.ObjectId,
      ref: 'Chat',
      required: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timeStamp: true }
);

const Message = mongoose.model('Message', messageSchema);
module.exports = Message;
