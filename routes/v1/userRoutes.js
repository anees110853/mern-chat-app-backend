const router = require('express').Router();
const { userController } = require('../../controllers');
const { authMiddleware } = require('../../middlewares');

router.post('/signup', userController.signup);

router.post('/login', userController.login);

router.post('/forgot_password', userController.forgetPassword);

router.put(
  '/update_password',
  authMiddleware.verifyUser,
  userController.changePassword
);

router.put('/update', authMiddleware.verifyUser, userController.updateProfile);

router.post('/validate_pass_reset_link', userController.validateLink);

router.post('/reset_password', userController.resetPassword);

router.post('/refresh-token', userController.refreshToken);

router.post(
  '/all_users',
  authMiddleware.verifyUser,
  userController.getAllUsers
);

module.exports = router;
