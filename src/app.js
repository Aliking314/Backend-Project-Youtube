import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import userRouter from './routes/user.router.js';

const app = express();

// Middleware setup
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
}));
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ limit: '16kb', extended: true }));
app.use(express.static("public"));
app.use(cookieParser());

// Route setup
app.use('/api/v1/users', userRouter);

// Start the server
const PORT = process.env.PORT || 3000; // Default to 3000 if PORT is not defined
app.listen(PORT, () => {
    console.log(`⚙️ Server is running on port ${PORT}`);
});

export { app };
