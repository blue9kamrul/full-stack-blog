import express, { Router } from "express";
import { postController } from "./post.controller";
import auth, { userRole } from "../../middlewares/auth";

const router = express.Router();

router.get("/", postController.getAllPosts);

router.get(
  "/my-posts",
  auth.auth(userRole.USER, userRole.ADMIN),
  postController.getMyPosts
);

router.get("/stats", auth.auth(userRole.ADMIN), postController.getStats);

router.get("/:id", postController.getPostById);

router.post(
  "/",
  auth.auth(userRole.USER, userRole.ADMIN),
  postController.createPost
);

router.patch(
  "/update/:postId",
  auth.auth(userRole.USER, userRole.ADMIN),
  postController.updatePost
);

router.delete(
  "/delete/:postId",
  auth.auth(userRole.USER, userRole.ADMIN),
  postController.deletePost
);

export const postRouter: Router = router;
