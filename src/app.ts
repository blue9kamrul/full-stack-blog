import express, { Application } from "express";
import cors from "cors";
import { postRouter } from "./modules/post/post.router";
import { auth } from "./lib/auth";
import { toNodeHandler } from "better-auth/node";
import { commentRouter } from "./modules/post/comment/comment.router";

const app: Application = express();

app.use(
  cors({
    origin: process.env.TRUSTED_ORIGIN || "http://localhost:4000",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
  })
);

app.use(express.json());

app.use("/api/auth", toNodeHandler(auth));

app.use("/posts", postRouter);

app.use("/comments", commentRouter);

app.get("/", (req, res) => {
  res.send("Welcome to the Blog API");
});

export default app;
