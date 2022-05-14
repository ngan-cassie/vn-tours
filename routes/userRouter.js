const express = require('express')
const userRouter = express.Router();
const userController = require('./../controllers/userController')
const authController = require('../controllers/authController')

// only post data for this signup route 
userRouter.post('/signup', authController.signup)

userRouter.post('/login', authController.login)
userRouter.get('/logout', authController.logout)
userRouter.post('/forgotPassword', authController.forgotPassword)

userRouter.patch('/resetPassword/:token', authController.resetPassword)

// all routes after this are now protected
userRouter.use(authController.protect)

userRouter.patch('/updatePassword', authController.updatePassword)
userRouter.get('/me', userController.getMe, userController.getUser);
userRouter.patch('/updateMe', userController.updateMe)
userRouter.delete('/deleteMe',userController.deleteMe)

userRouter.use(authController.restrictTo('admin'))

// all users route
userRouter
    .route('/')
    .get(userController.getAllUsers)
    .post(userController.createUser)

// single user route
userRouter
    .route('/:id')
    .get(userController.getUser)
    .patch(userController.updateUser)
    .delete(userController.deleteUser);

module.exports = userRouter;

