import express, { Router } from "express";
import { postController } from "./post.controller";
import auth, { userRole } from "../../middlewares/auth";

const router = express.Router();

router.get("/", postController.getAllPosts);

router.get("/:id", postController.getPostById);

router.post(
  "/",
  auth.auth(userRole.USER, userRole.ADMIN),
  postController.createPost
);

export const postRouter: Router = router;
