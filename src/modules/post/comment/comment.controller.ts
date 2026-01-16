import { Request, Response } from "express";
import commentService from "./comment.service";
import { CommentStatus } from "../../../../generated/prisma/enums";

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

const getCommentsById = async (req: Request, res: Response) => {
  try {
    const { commentId } = req.params;
    if (!commentId) {
      return res.status(400).json({ error: "Post ID is required" });
    }

    const comments = await commentService.getCommentsById(commentId);
    res.status(200).json(comments);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch comments" });
  }
};

const getCommentsByAuthorId = async (req: Request, res: Response) => {
  try {
    const { authorId } = req.params;
    if (!authorId) {
      return res.status(400).json({ error: "Author ID is required" });
    }
    const comments = await commentService.getCommentsByAuthorId(authorId);
    res.status(200).json(comments);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch comments" });
  }
};

const deleteComment = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const userId = user?.id;
    const { commentId } = req.params;
    if (!commentId) {
      return res.status(400).json({ error: "Comment ID is required" });
    }
    await commentService.deleteComment(commentId, userId!);
    res.status(200).json({ message: "Comment deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete comment" });
  }
};

const updateComment = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const userId = user?.id;
    const { commentId } = req.params;
    const { content, status } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!commentId) {
      return res.status(400).json({ error: "Comment ID is required" });
    }

    if (!content && !status) {
      return res
        .status(400)
        .json({ error: "At least one field (content or status) is required" });
    }

    // Validate and convert status if provided
    let validatedStatus: CommentStatus | undefined;
    if (status) {
      const upperStatus = status.toUpperCase();
      if (upperStatus !== "APPROVED" && upperStatus !== "REJECTED") {
        return res
          .status(400)
          .json({ error: "Invalid status. Must be APPROVED or REJECTED" });
      }
      validatedStatus = upperStatus as CommentStatus;
    }

    const updatedComment = await commentService.updateComment(
      userId,
      commentId,
      { content, status: validatedStatus }
    );
    res.status(200).json(updatedComment);
  } catch (error) {
    console.error("Update comment error:", error);
    if (
      error instanceof Error &&
      error.message === "Comment not found or unauthorized"
    ) {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({
      error: "Failed to update comment",
      details: error instanceof Error ? error.message : String(error),
    });
  }
};

const moderateComment = async (req: Request, res: Response) => {
  try {
    const { commentId } = req.params;
    const { status } = req.body;
    if (!commentId) {
      return res.status(400).json({ error: "Comment ID is required" });
    }

    if (status !== "APPROVED" && status !== "REJECTED") {
      return res
        .status(400)
        .json({ error: "Invalid status. Must be APPROVED or REJECTED" });
    }
    const result = await commentService.moderateComment(
      commentId,
      status as CommentStatus
    );

    if (result.alreadySet) {
      return res.status(200).json({
        message: `Comment is already ${status.toLowerCase()}`,
        comment: result.comment,
      });
    }

    res.status(200).json({
      message: "Comment moderated successfully",
      comment: result.comment,
    });
  } catch (error) {
    console.error("Moderate comment error:", error);
    if (error instanceof Error && error.message === "Comment not found") {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: "Failed to moderate comment" });
  }
};

export const commentController = {
  createComment,
  getCommentsById,
  getCommentsByAuthorId,
  deleteComment,
  updateComment,
  moderateComment,
};
