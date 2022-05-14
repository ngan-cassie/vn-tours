const express = require( 'express' )
const tourRouter = express.Router();
const tourController = require( '../controllers/tourController' );
const authController = require( '../controllers/authController' )
const reviewRouter = require( '../routes/reviewRouter' )


// tourRouter.route('/:tourId/reviews')
//   .post(authController.protect, authController.restrictTo('user'),
//   reviewController.createReview);

// tour router should use the review router whenever it encounter a route like this
tourRouter.use( '/:tourId/reviews', reviewRouter )
tourRouter
  .route( '/' )
  .get( tourController.getAllTours ) // cannot get all tours if not provide token first 
  .post( 
    authController.protect, 
    authController.restrictTo( 'admin', 'lead-guide' ), 
    tourController.createTour 
    );
tourRouter
  .route( '/:id' )
  .get( tourController.getTour )
  .patch( 
    authController.protect, 
    authController.restrictTo( 'admin', 'lead-guide' ), 
    tourController.updateTour )
  .delete( authController.protect,
    authController.restrictTo( 'admin', 'lead-guide' ),
    tourController.deleteTour );

tourRouter
  .route( '/top-5-cheap' )
  .get( tourController.aliasTopTours, tourController.getAllTours );

tourRouter.route( '/tour-stats' ).get( tourController.getTourStats );

tourRouter.route( '/monthly-plan/:year' )
  .get( 
    authController.protect, 
    authController.restrictTo( 'admin', 'lead-guide', 'guide' ),
    tourController.getMonthlyPlan 
    );

// pass in the coordinates of where you live, find sth within ... unit
tourRouter.route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(tourController.getToursWithin)
// /tours-within?distance=200&center=-40,45,&unit=mi
tourRouter.route('/distances/:latlng/unit/:unit')
    .get(tourController.getDistances)
module.exports = tourRouter;