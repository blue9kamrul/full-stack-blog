import express, { Router } from "express";
import { commentController } from "./comment.controller";
import authMiddleware, { userRole } from "../../../middlewares/auth";

const router = express.Router();

router.post(
  "/",
  authMiddleware.auth(userRole.USER, userRole.ADMIN),
  commentController.createComment
);

router.get("/:commentId", commentController.getCommentsById);

router.get("/author/:authorId", commentController.getCommentsByAuthorId);

router.delete(
  "/:commentId",
  authMiddleware.auth(userRole.USER, userRole.ADMIN),
  commentController.deleteComment
);

router.patch(
  "/:commentId",
  authMiddleware.auth(userRole.USER, userRole.ADMIN),
  commentController.updateComment
);

router.patch(
  "/moderate/:commentId",
  authMiddleware.auth(userRole.ADMIN),
  commentController.moderateComment
);

export const commentRouter: Router = router;
