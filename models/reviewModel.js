// review / rating / createdAt / ref to tour / ref to user
const mongoose = require('mongoose');
const Tour = require('./tourModel')
const reviewSchema = new mongoose.Schema(
	{
		review: {
			type: String,
			required: [true, 'Review cannot be empty']
		},
		rating: {
			type: Number,
			min: 1,
			max: 5
		}, 
		createdAt: {
			type: Date,
			default: Date.not
		}, 
		tour: {
			type: mongoose.Schema.ObjectId,
			ref: 'Tour',
			required: [true, 'Review must belong to a tour']
		},
		user: {
			type: mongoose.Schema.ObjectId,
			ref: 'User',
			required: [true, 'Review must belong to a user']
		}
	},
	{
		toJSON: {virtuals: true},
		toObject: {virtuals: true}
	}
)

reviewSchema.index({
	tour: 1,
	user: 1,
},
	{
		unique: true
	}
)
reviewSchema.pre(/^find/, function(next) {
	this.populate({
		path: 'user',
		select: 'name photo'
	})
	next()
})
reviewSchema.statics.calcAverageRatings = async function(tourId) {
	const stats = await this.aggregate([
		{
			$match: {tour: tourId}
		},
		{
			$group: {
				_id: '$tour',
				numRating: {$sum: 1},
				avgRating: {$avg: '$rating'}
			}
		}
	])
	console.log(stats);
	if (stats.length > 0) {
	await Tour.findByIdAndUpdate(tourId, {
		ratingsQuantity: stats[0].numRating,
		ratingsAverage: stats[0].avgRating
	})
} else {
	await Tour.findByIdAndUpdate(tourId, {
		ratingsQuantity: 4.5,
		ratingsAverage: 0
	})
}
}

reviewSchema.post('save', function() {
	// this points to current review
	this.constructor.calcAverageRatings(this.tour)
})


reviewSchema.post(/^findOneAnd/, async function(doc, next) {
	await doc.constructor.calcAverageRatings(doc.tour)
	next();
})
const Review = mongoose.model('Review', reviewSchema)

module.exports = Review