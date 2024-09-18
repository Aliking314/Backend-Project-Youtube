import asyncHandler from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from '../utils/Cloudinary.js';
import ApiResponse from '../utils/ApiResponse.js';
import jwt from 'jsonwebtoken';

const generateAccessAndRefreshToken = async(userId) => {
  try {
    const user = await User.findById(userId);
    const AccessToken = user.generateAccessToken();
    const RefreshToken = user.generateRefreshToken();

    user.RefreshToken = RefreshToken;
    await user.save({ validateBeforeSave: false });

    return { AccessToken, RefreshToken };
  } catch (error) {
    throw new ApiError(500, "Something went wrong while generating access and refresh tokens");
  }
};

const registerUser = asyncHandler(async (req, res, next) => {
  const { fullName, email, username, password } = req.body;

  if ([fullName, email, username, password].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "All fields are required");
  }

  const userExist = await User.findOne({
    $or: [{ username }, { email }]
  });
  if (userExist) {
    throw new ApiError(409, "The user with this email or username already exists");
  }

  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  let coverImageLocalPath;
  if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  if (!avatar) {
    throw new ApiError(400, "Avatar upload failed");
  }

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || '',
    email,
    password,
    username: username.toLowerCase()
  });

  const userCreated = await User.findById(user._id).select("-password -RefreshToken");

  if (!userCreated) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  return res.status(201).json(
    new ApiResponse(200, userCreated, "User registered successfully")
  );
});

const loginUser = asyncHandler(async (req, res, next) => {
  const { username, email, password } = req.body;

  if (!username && !email) {
    throw new ApiError(400, "Username or email is required");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }]
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(400, "Invalid user credentials");
  }

  const { RefreshToken, AccessToken } = await generateAccessAndRefreshToken(user._id);
  const userLoggedIn = await User.findById(user._id).select("-password -RefreshToken");

  const options = {
    httpOnly: true,
    secure: true
  };

  return res.status(200)
    .cookie("AccessToken", AccessToken, options)
    .cookie("RefreshToken", RefreshToken, options)
    .json(
      new ApiResponse(200, { user: userLoggedIn, AccessToken, RefreshToken }, "User logged in successfully")
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    { $set: { RefreshToken: '' } },
    { new: true }
  );

  const options = {
    httpOnly: true,
    secure: true
  };

  return res
    .clearCookie("AccessToken", options)
    .clearCookie("RefreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res, next) => {
  const incomingRefreshToken = req.cookies.RefreshToken || req.body.refreshToken;
  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized request");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken._id);

    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    if (incomingRefreshToken !== user.RefreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }

    const options = {
      httpOnly: true,
      secure: true
    };
    
    const { AccessToken, RefreshToken: newRefreshToken } = await generateAccessAndRefreshToken(user._id);

    return res
      .status(200)
      .cookie("AccessToken", AccessToken, options)
      .cookie("RefreshToken", newRefreshToken, options)
      .json(new ApiResponse(200, { AccessToken, RefreshToken: newRefreshToken }, "Access token refreshed successfully"));
  } catch (error) {
    throw new ApiError(401, error.message || "Invalid refresh token");
  }
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken
};
