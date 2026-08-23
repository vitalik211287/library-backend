import express from "express";
import cors from "cors";
import booksRouter from "./routes/booksRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({
    message: "Library API is working",
  });
});

app.use("/api/books", booksRouter);

export default app;
