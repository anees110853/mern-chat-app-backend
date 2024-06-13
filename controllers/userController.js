const { jwtService, userService } = require('../services');
const {
  FORGET_PASS_EMAIL_SUBJECT,
  FORGET_PASS_EMAIL_BODY,
  PLATFORMS,
  passwordRegex,
} = require('../constants');
const bcrypt = require('bcrypt');
const { sendMail } = require('../services/mailerService');
const _ = require('lodash');
const cloudinary = require('../config/cloudinary');
const { default: mongoose } = require('mongoose');

const signup = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(422).send({ error: 'Email or password missing!' });
    }

    if (!password.match(passwordRegex)) {
      return res.status(422).send({
        error:
          'Password must contain at least 8 characters, 1 uppercase letter, 1 special character and 1 number!',
      });
    }

    let user;
    user = await userService.getOneUser({ email: email.toLowerCase() });
    if (user) {
      return res.status(422).send({
        error: 'Email associated with another account',
      });
    }

    let result;
    if (req.body.image) {
      result = await cloudinary.uploader.upload(req.body.image, {
        upload_preset: 'mern_chat_app', // Optional, if you have presets set up
      });
    }

    user = await userService.addUser({
      email: req.body.email.toLowerCase(),
      password: req.body.password,
      name: req.body.firstName + ' ' + req.body.lastName,
      image: result?.url,
    });

    const accessToken = jwtService.generateAccessToken(user);

    res
      .header('access_token', accessToken)
      .status(200)
      .json(user?._doc ? _.omit(user?._doc, ['password']) : {});
  } catch (error) {
    console.log('Exception signup', error);
    res.status(500).send({
      error: error?.message ? error?.message : 'Something went wrong',
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password, firebaseToken } = req.body;

    if (!email || !password) {
      return res.status(422).send({ error: 'Email or password missing!' });
    }

    const user = await userService.getOneUser({ email: email.toLowerCase() });
    if (!user)
      return res.status(403).send({ error: 'Email or password incorrect!' });

    const isCorrectPass = await bcrypt.compareSync(password, user.password);
    if (!isCorrectPass)
      return res.status(403).send({ error: 'Password incorrect!' });

    const accessToken = jwtService.generateAccessToken(user);

    if (firebaseToken) {
      await userService.updateAllUsers(
        {
          'firebaseTokens.token': firebaseToken,
        },
        {
          $pull: {
            firebaseTokens: { token: firebaseToken },
          },
        }
      );
      user = await userService.updateUser(
        { _id: user._id },
        {
          $push: {
            firebaseTokens: {
              platform: req.headers.platform
                ? req.headers.platform.toLowerCase()
                : PLATFORMS.android,
              token: firebaseToken,
            },
          },
        }
      );
    }

    res
      .set('access-control-expose-headers', 'access_token')
      .header('access_token', accessToken)
      .status(200)
      .json(user?._doc ? _.omit(user?._doc, ['password']) : {});
  } catch (error) {
    console.log('Exception login', error);
    res.status(500).send({
      error: error?.message ? error?.message : 'Something went wrong',
    });
  }
};

const forgetPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(422).send({ error: 'Email missing!' });

    const user = await userService.getOneUser({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const text = FORGET_PASS_EMAIL_BODY({ _id: user._id }, user.password);
    await sendMail(user.email, FORGET_PASS_EMAIL_SUBJECT, text);

    res.status(200).json({ message: 'Email sent successfully!' });
  } catch (error) {
    console.log('Exception forgetPassword', error);
    res.status(500).send({
      error: error?.message ? error?.message : 'Something went wrong',
    });
  }
};

const validateLink = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(422).send({ error: 'Token missing!' });

    const decoded = jwtService.decodeToken(token);
    if (!decoded) return res.status(401).json({ error: 'Token is not valid!' });

    const user = await userService.getOneUser({ _id: decoded.payload._id });
    if (!user) return res.status(404).json({ error: 'User not found' });

    jwtService.verifyToken(token, user.password, (error, user) => {
      if (error) {
        return res.status(401).json({ error: 'Token is not valid!' });
      }
      return res.status(200).json({ message: 'Token valid!' });
    });
  } catch (error) {
    console.log('Exception validateLink', error);
    res.status(500).send({
      error: error?.message ? error?.message : 'Something went wrong',
    });
  }
};

const refreshToken = async (req, res) => {
  try {
    const refreshToken = req.body.access_token;

    if (!refreshToken) {
      return res.status(401).json('You are not authenticated!');
    }

    jwtService.verifyToken(
      refreshToken,
      process.env.JWT_TOKEN_KEY,
      async (err, user) => {
        err && console.log(err);

        const newAccessToken = jwtService.generateAccessToken(user);
        const newRefreshToken = jwtService.generateAccessToken(user, true);

        res
          .set('access-control-expose-headers', '*')
          .header('access_token', newAccessToken)
          .header('refresh_token', newRefreshToken)
          .status(200)
          .json({});
      }
    );
  } catch (err) {
    res.status(500).send(err);
  }
};

const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword, confirmNewPassword } = req.body;
    const userId = req.user._id;
    if (!oldPassword || !newPassword || !confirmNewPassword) {
      return res.status(422).send({ error: 'Required fields missing!' });
    }

    if (newPassword !== confirmNewPassword) {
      return res
        .status(403)
        .send({ error: 'Password and confirm password are not same.' });
    }

    if (!newPassword.match(passwordRegex)) {
      return res.status(200).send({
        error:
          'Password must contain at least 8 characters, 1 uppercase letter, 1 special character and 1 number!',
      });
    }

    const user = await userService.getOneUser({ _id: userId });
    if (!user) return res.status(403).send({ error: 'Data not found!' });

    const isCorrectPass = await bcrypt.compareSync(oldPassword, user.password);
    if (!isCorrectPass) {
      return res.status(200).send({ error: 'Password incorrect!' });
    }

    await userService.updateUser({ _id: userId }, { password: newPassword });
    return res.status(200).json({ message: 'Password Changed successfully!' });
  } catch (error) {
    console.log('Exception change password', error);
    res.status(500).send({
      error: error?.message ? error?.message : 'Something went wrong',
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password)
      return res.status(422).send({ error: 'Token or password missing!' });

    if (!password.match(passwordRegex)) {
      return res.status(200).send({
        error:
          'Password must contain at least 8 characters, 1 uppercase letter, 1 special character and 1 number!',
      });
    }

    const decoded = jwtService.decodeToken(token);
    if (!decoded) return res.status(401).json({ error: 'Token is not valid!' });

    const user = await userService.getOneUser({ _id: decoded.payload._id });
    jwtService.verifyToken(token, user.password, async (error, user) => {
      if (error) {
        return res.status(401).json({ error: 'Token is not valid!' });
      }
      await userService.updateUser({ _id: decoded.payload._id }, { password });
      return res
        .status(200)
        .json({ message: 'Password Changed successfully!' });
    });
  } catch (error) {
    console.log('Exception resetPassword', error);
    res.status(500).send({
      error: error?.message ? error?.message : 'Something went wrong',
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    let { body } = req;
    body = removeUserLockedFields(body);
    await userService.updateUser({ _id: req.user._id }, { $set: body });
    res.status(200).json({ message: 'Profile Updated successfully' });
  } catch (error) {
    console.log('Exception verifyOTP', error);
    res.status(500).send({
      error: error?.message ? error?.message : 'Something went wrong',
    });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const { search } = req.body;
    const user = req.user;

    const query = [
      {
        $match: {
          _id: { $ne: new mongoose.Types.ObjectId(user?._id) },
          ...(req.body.search && {
            name: {
              $regex: req.body.search,
              $options: 'i',
            },
          }),
        },
      },
    ];
    const users = await userService.aggregate(query);
    res
      .status(200)
      .json({ message: 'User retrieved successfully', data: users });
  } catch (error) {
    console.log(error);
    res.status(500).json('Internal Server Error');
  }
};

module.exports = {
  signup,
  login,
  forgetPassword,
  validateLink,
  resetPassword,
  changePassword,
  updateProfile,
  getAllUsers,
  refreshToken,
};
