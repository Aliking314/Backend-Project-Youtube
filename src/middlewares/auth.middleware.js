import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";

export const verifyJWT = asyncHandler(async (req, res, next) => {
  try {
    // Get token from cookies or Authorization header
    const token = req.cookies?.AccessToken || req.header("Authorization")?.replace('Bearer ', '');
   
    if (!token) {
      throw new ApiError(401, "Unauthorized Request: No token provided");
    }

    // Verify the token
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    // Find the user associated with the token
    const user = await User.findById(decodedToken?._id).select("-refreshToken -password");

    if (!user) {
      throw new ApiError(401, "Invalid Access Token: User not found");
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid Access Token");
  }
});
