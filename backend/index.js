import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import dotenv from "dotenv";

dotenv.config();

const app = express();
connectDB();

app.use(express.json());
app.use(cors());

import authRoutes from "./routes/authRoutes.js";
app.use("/api/auth", authRoutes);

app.listen(process.env.PORT, () =>
    console.log(`Server running on port ${process.env.PORT}`)
);
