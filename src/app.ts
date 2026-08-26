import express from "express";
import cors from "cors";

import booksRouter from "./routes/booksRoutes.js";
import authRouter from "./routes/authRoutes.js";
import userBooksRouter from "./routes/userBooksRoutes.js";

const app = express();

app.use(cors());

app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({
    message: "Library API is working",
  });
});

app.use("/api/books", booksRouter);

app.use("/api/auth", authRouter);

app.use("/api/user-books", userBooksRouter);

app.use("/uploads", express.static("uploads"));

export default app;