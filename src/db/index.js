import mongoose from 'mongoose'
import {DB_NAME} from '../constants.js'

 async function connectDB() {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log(`\n The DB IS CONNECTED TO !! DB HOST ${connectionInstance.connection.host} `);
    } catch (error) {
        console.log("Mongo Db Connection Failed",error);
        process.exit(1)   
    }
}

export default connectDB