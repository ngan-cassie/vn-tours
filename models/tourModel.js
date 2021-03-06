const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');
// schema for model (similar to Java's class/ interface)
const tourSchema = new mongoose.Schema(
    {
      name: {
        type: String,
        required: [true, 'A tour must have a name'], // [boolean, error handler]
        unique: true,
        trim: true,
        maxlength: [40, 'A tour name must have less or equal than 40 characters'],
        minlength: [10, 'A tour name must have more or equal than 10 characters'],
      },
      slug: String,
      duration: {
        type: Number,
        required: [true, 'A tour must have a duration'],
      },
      maxGroupSize: {
        type: Number,
        required: [true, 'A tour must have a group size'],
      },
      difficulty: {
        type: String,
        required: [true, 'A tour must have a difficulty'],
        enum: {
          values: ['easy', 'medium', 'difficult'],
          message: 'Difficulty is either: easy, medium, difficult',
        },
      }, // enum: only for String
      ratingsAverage: {
        type: Number,
        default: 4.5,
        min: [1, 'Rating must be above 1.0'],
        max: [5, 'Rating must be below 5.0'],
        set: val => Math.round(val*10) / 10
      }, // min, max also work with dates
      ratingsQuantity: {
        type: Number,
        default: 0,
      },
      price: {
        type: Number,
        required: [true, 'A tour must have a price'],
      },
      priceDiscount: {
        type: Number,
        validate: {
          validator: function (val) {
            // this only points to current doc on NEW document creation
            return val < this.price; // 100 < 200
          },
          message: 'Discount price ({VALUE}) should be below regular price',
        },
      },
      summary: {
        type: String,
        trim: true,
        required: [true, 'A tour must have a description'],
      },
      description: {
        type: String,
        trim: true,
      },
      imageCover: {
        type: String,
        required: [true, 'A tour must have a cover image'],
      },
      images: [String],
      createAt: {
        type: Date,
        default: Date.now(),
        select: false,
      },
      startDates: [Date],
      secretTour: {
        type: Boolean,
        default: false,
      },
      startLocation: {
        // GeoJSON
        type: {
          type: String,
          default: 'Point', // Polygon, line, etc
          enum: ['Point']
        },
        coordinates: [Number], // long, lat in GeoJSON 
        address: String,
        description: String 
      },
      locations: [
        {
          type: {
            type: String,
            default: 'Point',
            enum: ['Point']
          },
          coordinates: [Number], // long, lat in GeoJSON 
          address: String,
          description: String,
          day: Number 
        }
      ],
      guides: [
        {
          type: mongoose.Schema.ObjectId, // each element is a Mongo object
          ref: 'User' // child reference
        }
      ]
    },
    {
      toJSON: { virtuals: true },
      toObject: { virtuals: true },
    }
  );

// ascending, scan documents faster 
tourSchema.index({price: 1, ratingsAverage: -1})
tourSchema.index({slug: 1})
tourSchema.index({startLocation: '2dsphere'})

tourSchema.virtual('durationWeeks').get(function () {
  // not arrow bc we need "this"
  return this.duration / 7;
});

// Virtual populate 
tourSchema.virtual('reviews', {
  ref:'Review', 
  foreignField: 'tour',
  localField: '_id' 
})
// DOCUMENT MIDDLEWARE: runs before .save() and .create()
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// QUERY MIDDLEWARE
// tourSchema.pre('find', function(next)) - /^find/ name starts with find
tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });
  this.start = Date.now();
  next();
});

// run before the query

tourSchema.pre(/^find/, function(next){
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt'
  }
    ).select('-__v');
  next()
})
//AGGREGATION MIDDLEWARE
// tourSchema.pre('aggregate', function (next) {
//   // add another stage to the beginning of the array
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
//   console.log(this.pipeline());
//   next();
// });




// model
const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;

