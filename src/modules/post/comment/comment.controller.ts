import { Request, Response } from "express";
import commentService from "./comment.service";

const createComment = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const userId = user?.id;
    const { postId, content, parentId, status } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const newComment = await commentService.createComment({
      postId,
      content,
      authorId: userId,
      parentId,
      status,
    });
    res.status(201).json(newComment);
  } catch (error) {
    res.status(400).json({ error: "Failed to create comment" });
  }
};

export const commentController = {
  createComment,
};
