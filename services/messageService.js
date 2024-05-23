const { MessageModel } = require('../models');

const getOneMessage = async (condition) => {
  return new Promise((resolve, reject) => {
    MessageModel.findOne(condition)
      .then((data) => resolve(data))
      .catch((err) => reject(err));
  });
};

const getMessages = async (condition) => {
  return new Promise((resolve, reject) => {
    MessageModel.find(condition)
      .then((data) => resolve(data))
      .catch((err) => reject(err));
  });
};

const updateMessage = async (condition, data) => {
  return new Promise((resolve, reject) => {
    MessageModel.findOneAndUpdate(condition, data, {
      new: true,
      runValidators: true,
    })
      .then((data) => resolve(data))
      .catch((err) => reject(err));
  });
};

const updateAllMessages = async (condition, data) => {
  return new Promise((resolve, reject) => {
    MessageModel.updateMany(condition, data, {
      new: true,
      runValidators: true,
    })
      .then((data) => resolve(data))
      .catch((err) => reject(err));
  });
};

const deleteMessage = async (condition) => {
  return new Promise((resolve, reject) => {
    MessageModel.deleteOne(condition)
      .then((data) => resolve(data))
      .catch((err) => reject(err));
  });
};

const addMessage = async (data) => {
  return new Promise((resolve, reject) => {
    new MessageModel(data)
      .save()
      .then((data) => resolve(data))
      .catch((err) => reject(err));
  });
};

module.exports = {
  getOneMessage,
  updateMessage,
  deleteMessage,
  addMessage,
  getMessages,
  updateAllMessages,
};
