const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');
const bcrypt = require('bcryptjs')
const crypto = require('crypto')

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        require: [true, 'Name is required'],
        trim: true
    },
    email: {
        type: String,
        require: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, 'Email is invalid']
    },
    photo: String,
    role: {
        type: String,
        enum: ['user','guide','lead-guide', 'admin'],
        default: 'user'
    },
    password: {
        type: String,
        require: [true, 'Password is required'],
        minlength: [8, 'Password must have at least 8 characters'],
        select: false 
    },
    passwordConfirm: {
        type: String,
        require: [true, 'Password must match'],
        validate: {
            // only work on CREATE and SAVE
            validator: function(el) {
                return el === this.password; 
            },
            message: 'Passwords are not the same'
        }
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date ,
    active: {
        type: Boolean,
        default: true,
        select: false // not showing it to anyone
    }
})

userSchema.pre('save', async function(next) {
    // only run this password if password was actually modified
    if (!this.isModified('password')) return next(); 

    // hash the password with cost 12
    this.password = await bcrypt.hash(this.password, 12)

    this.passwordConfirm = undefined; // not to be persisted to the database 
    next(); 
}) 

userSchema.pre('save', function (next) {
    if (!this.isModified('password') || this.isNew) return next();

    this.passwordChangedAt = Date.now()-1000;
    next(); 
  });


userSchema.pre(/^find/, function(next) {
    // this points to the current query
    this.find({active: {$ne: false}});
    next(); 
})
// instant function, available on all models 
userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword); 
}

userSchema.methods.changePasswordAfter = function(JWTTimestamp) {
    if (this.passwordChangedAt){
        const changedTimestamp = parseInt(
            this.passwordChangedAt.getTime() / 1000,
            10
        )
       
        return JWTTimestamp < changedTimestamp; // token creation time < password change time -> password was changed!
    }
    return false; // the user hasn't changed the pass after this timestamp
}

userSchema.methods.createPasswordResetToken = function() {
    const resetToken = crypto.randomBytes(32).toString('hex'); 

    this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken).digest('hex'); 

    console.log({resetToken}, this.passwordResetToken);

    this.passwordResetExpires = Date.now() + 10*60*1000;

    return resetToken; 
}
const User = mongoose.model('User', userSchema)
module.exports = User 