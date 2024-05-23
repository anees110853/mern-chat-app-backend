const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const chatSchema = new Schema(
  {
    creator: {
      type: String,
    },
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    isGroup: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Chat = mongoose.model('Chat', chatSchema);
module.exports = Chat;
