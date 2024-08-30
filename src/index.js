import mongoose from "mongoose";
import { DB_NAME } from "./constants.js";
import dotenv from 'dotenv'
import connectDB from "./db/index.js";

dotenv.config({
    path:'./env'
})







connectDB()



























// import mongoose from "mongoose";
// import {DB_NAME} from './constants.js'
// import express from 'express'

// const app = express();

// (async ()=>{
//     try {
//        await mongoose.connect(`mongodb://${process.env.MONGODB_URI}/${DB_NAME}`)
//        console.log("Connected");
       
//         app.on("ERROR", (error)=>{
//           console.log("ERROR",error);
//           throw error
//         })
//         app.listen(process.env.PORT,()=>{
//             console.log(`App is listening on port ${process.env.PORT}`);            
//         })
//     } catch (error) {
//         console.error("Error",error);
//         throw error
//     }
// })()