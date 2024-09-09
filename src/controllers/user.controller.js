import asyncHandler from '../utils/asyncHandler.js';
import {ApiError} from '../utils/ApiError.js'
import {User} from "../models/user.model.js"
import { uploadOnCloudinary } from '../utils/Cloudinary.js';
import ApiResponse from '../utils/ApiResponse.js';

const registerUser = asyncHandler(async (req, res, next) => {

//    get user details from frontend
const { fullName, email, username, password } = req.body;
// validate
  if (
    [fullName,email,username,password].some((field)=>field?.trim()==="")
  ) {
    throw new ApiError(400,"All field Are Required")
  }
  // check if user already exists
 const userExist = User.findOne({
    $or:[{username},{email}]
  })
  if (userExist) {
    throw new ApiError(409,'The User With This Email Or Password Already exist')
  }
 // check for images and avatar
 const avatarLocalPath = req.files?.avatar[0]?.path;
 const coverImageLocalPath = req.files?.coverImage[0]?.path;
   if (!avatarLocalPath) {
    throw new ApiError(400,"Avatar is required")
   }
 // upload them to cloudinary
 const avatar = await uploadOnCloudinary(avatarLocalPath)
 const coverImage = await uploadOnCloudinary(coverImageLocalPath)
 if (!avatar) {
    throw new ApiError(400,"Avatar is required")
 }

 // create user object | entry in database
 const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage:coverImage?.url||'',
    email:email,
    password:password,
    username:username.toLowerCase()

  })
  // remove password and refresh token
  const userCreated = await User.findById(user._id).select(
    "-password -refreshToken"
  )
  // check for user creation
  if (!userCreated) {
    throw new ApiError(500,'Something went Wrong While registering a user')
  }
  // return res
   return res.status(201).json(
    new ApiResponse(200,userCreated,"User Register Succesfully")
   )
});

export { registerUser };
