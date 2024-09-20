const mongoose = require("mongoose"); // Erase if already required
const validator = require("validator");
const bcrypt = require("bcryptjs");
const createError = require("../utils/createError");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: [true, "Your username is not unique"],
    },
    email: {
      type: String,
      required: true,
      unique: [true, "Your Email is already registered"],
    },
    // mobile: {
    //   type: String,
    //   required: true,
    // },
    password: {
      type: String,
      required: true,
    },
    photo: {
      type: String,
      default:
        "https://th.bing.com/th/id/OIP.tmgWGdzGFmIwg1iaqCbSvgHaHa?w=179&h=194&c=7&r=0&o=5&pid=1.7",
    },
    lastLogin: {
      type: Date,
      default: Date.now,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    resetPasswordToken: String,
    resetPasswordExpiresAt: Date,
    verificationToken: String,
    verificationTokenExpiresAt: Date,
  },

  {
    timestamps: true,
  }
);

userSchema.statics.registerStatics = async function (
  username,
  email,
  password
) {
  if (!username || !email || !password) {
    throw createError(400, "Please fill in all fields");
  }

  const isAlreadyRegistered = await this.findOne({ email, isVerified: true });
  if (isAlreadyRegistered) {
    throw createError(
      409,
      "You already have registered. Please login to continue"
    );
  }

  const isUsernameUnique = await this.findOne({ username });
  if (isUsernameUnique) {
    throw createError(409, "You must have a unique Username");
  }

  if (!validator.isEmail(email)) {
    throw createError(400, "Invalid email address");
  }

  if (!validator.isLength(username, { min: 3 })) {
    throw createError(400, "Username should be at least 3 characters long");
  }

  if (!validator.isStrongPassword(password)) {
    throw createError(400, "Weak Password");
  }

  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);

  const verificationToken = Math.floor(
    100000 + Math.random() * 900000
  ).toString();

  const user = await this.create({
    username,
    email,
    password: hash,
    verificationToken,
    verificationTokenExpiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
  });

  return user;
};

userSchema.statics.loginStatics = async function (email, password) {
  if (!email || !password) {
    throw createError(400, "Please enter all credentials");
  }

  if (!validator.isEmail(email)) {
    throw createError(400, "Invalid email address");
  }

  const user = await this.findOne({ email });
  if (!user) {
    throw createError(404, "You haven't registered yet");
  }

  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    throw createError(401, "Password doesn't match");
  }

  return user;
};

const UserModel = mongoose.model("User", userSchema);
module.exports = UserModel;
