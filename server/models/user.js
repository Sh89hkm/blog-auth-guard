const mongoose = require('mongoose');
const slugify = require('slugify');

const userSchema = mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  firstname: {
    type: String,
  },
  lastname: {
    type: String,
  },
  password_hash: {
    type: String,
    required: true,
  },
  registered_at: {
    type: Date,
    default: Date.now,
  },
  avatar: {
    type: String,
  },
});

userSchema.virtual('fullname').get(function () {
  if (!this.firstname) {
    return this.username;
  } else if (!this.lastname) {
    return this.firstname;
  }
  return `${this.firstname} ${this.lastname}`;
});

userSchema.pre('validate', function (next) {
  // slugify username
  this.username = slugify(
    this.username.trim().replace(/[^a-zA-Z0-9 .]/g, '.'),
    {
      replacement: '.',
      lower: 'true',
      strict: 'true',
    }
  );
  next();
});

const transform = function (doc, ret, options) {
  if (options.hide) {
    options.hide.split(' ').forEach(function (prop) {
      delete ret[prop];
    });
  }
  return ret;
};

userSchema.set('toObject', { virtuals: true, transform });
userSchema.set('toJSON', { virtuals: true, transform });
userSchema.options.toJSON.hide = 'password_hash';
// userSchema.options.toObject.hide = 'password_hash';

module.exports = mongoose.model('User', userSchema);
