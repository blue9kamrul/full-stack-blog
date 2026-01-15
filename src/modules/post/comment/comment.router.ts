import express, { Router } from "express";
import { commentController } from "./comment.controller";
import authMiddleware, { userRole } from "../../../middlewares/auth";

const router = express.Router();

router.post(
  "/",
  authMiddleware.auth(userRole.USER, userRole.ADMIN),
  commentController.createComment
);

export const commentRouter: Router = router;
