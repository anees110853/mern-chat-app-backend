const { ChatModel } = require('../models');

const getOneChat = async (condition) => {
  return new Promise((resolve, reject) => {
    ChatModel.findOne(condition)
      .then((data) => resolve(data))
      .catch((err) => reject(err));
  });
};

const getChats = async (condition) => {
  return new Promise((resolve, reject) => {
    ChatModel.find(condition)
      .then((data) => resolve(data))
      .catch((err) => reject(err));
  });
};

const updateChat = async (condition, data) => {
  return new Promise((resolve, reject) => {
    ChatModel.findOneAndUpdate(condition, data, {
      new: true,
      runValidators: true,
    })
      .then((data) => resolve(data))
      .catch((err) => reject(err));
  });
};

const updateAllChats = async (condition, data) => {
  return new Promise((resolve, reject) => {
    ChatModel.updateMany(condition, data, {
      new: true,
      runValidators: true,
    })
      .then((data) => resolve(data))
      .catch((err) => reject(err));
  });
};

const deleteChat = async (condition) => {
  return new Promise((resolve, reject) => {
    ChatModel.deleteOne(condition)
      .then((data) => resolve(data))
      .catch((err) => reject(err));
  });
};

const addChat = async (data) => {
  return new Promise((resolve, reject) => {
    new ChatModel(data)
      .save()
      .then((data) => resolve(data))
      .catch((err) => reject(err));
  });
};

module.exports = {
  getOneChat,
  updateChat,
  deleteChat,
  addChat,
  getChats,
  updateAllChats,
};
