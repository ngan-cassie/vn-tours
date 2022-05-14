const express = require('express')
const reviewController = require('./../controllers/reviewController')
const authController = require('./../controllers/authController')

const reviewRouter = express.Router({mergeParams: true});
/* Merge params: Whichever route
POST /tour/123/reviews
GET /tour/123/reviews
POST /reviews
all goes to these functions
*/ 

reviewRouter.use(authController.protect);
reviewRouter
	.route('/')
	.get(reviewController.getAllReviews)
  	.post(
		  authController.restrictTo('user'),
		  reviewController.setTourUserIds,
  		  reviewController.createReview
		);

reviewRouter
	.route('/:id')
	.get(reviewController.getReview)
	.patch(authController.restrictTo('user', 'admin'), reviewController.updateReview)
	.delete(authController.restrictTo('user', 'admin'), reviewController.deleteReview)
module.exports = reviewRouter; 