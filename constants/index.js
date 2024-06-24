const { generateTokenWithSecret } = require('../services/jwtService');

const FORGET_PASS_EMAIL_SUBJECT = `Reset Password`;

const FORGET_PASS_EMAIL_BODY = (user, oldPass) =>
  `Visit the following link to reset your password\n${
    process.env.HOST
  }/auth/reset-password/${generateTokenWithSecret(user, oldPass)}`;

const getS3Url = (key) =>
  encodeURI(
    `https://${process.env.AWS_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`
  );

// password must contain a capital Letter, a symbol and a number, and must be minimum 8 digits long
const passwordRegex =
  /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

const PLATFORMS = {
  ios: 'ios',
  android: 'android',
  reactApp: 'react-app',
};

const USER_LOCKED_FIELDS = ['email', 'password'];

const SOCKET_EVENTS = {
  re_fetch_chats: 'RE_FETCH_CHATS',
  re_fetch_messages: 'RE_FETCH_MESSAGES',
};

module.exports = {
  FORGET_PASS_EMAIL_BODY,
  getS3Url,
  FORGET_PASS_EMAIL_SUBJECT,
  passwordRegex,
  PLATFORMS,
  USER_LOCKED_FIELDS,
  SOCKET_EVENTS,
};
