import express from "express";
import cors from "cors";
import readingRouter from "./modules/reading/readingRoutes.js";
import booksRouter from "./modules/books/booksRoutes.js";
import authRouter from "./modules/auth/authRoutes.js";
import userBooksRouter from "./modules/user-books/routes/userBooksRoutes.js";
import usersRouter from "./modules/users/usersRoutes.js";
import librariesRouter from "./modules/libraries/librariesRoutes.js";

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

app.use("/api/reading", readingRouter);

app.use("/api/users", usersRouter);

app.use("/api/libraries", librariesRouter);

export default app;

