import { NextFunction, Request, Response } from "express";
import { postService } from "./post.service";
import { PostStatus } from "../../../generated/prisma/enums";
import paginationSortingHelper from "../../helpers/paginationSortingHelper";

const getAllPosts = async (req: Request, res: Response) => {
  try {
    const { search } = req.query;
    const searchStr = typeof search === "string" ? search : undefined;

    const tags = req.query.tags ? (req.query.tags as string).split(",") : [];

    let isFeatured: boolean | undefined = undefined;
    if (
      req.query.isFeatured &&
      (req.query.isFeatured === "true" || req.query.isFeatured === "false")
    ) {
      isFeatured = req.query.isFeatured === "true" ? true : false;
    }

    const status = req.query.status as PostStatus | undefined;

    const authorId = req.query.authorId as string | undefined;

    const { page, limit, skip, sortBy, sortOrder } = paginationSortingHelper(
      req.query
    );

    const results = await postService.getAllPosts({
      search: searchStr,
      tags,
      isFeatured,
      status,
      authorId,
      page,
      skip,
      limit,
      sortBy,
      sortOrder,
    });
    res.status(200).json(results);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch posts" });
  }
};

const getPostById = async (req: Request, res: Response) => {
  try {
    const postId = req.params.id;

    if (!postId) {
      return res.status(400).json({ error: "Post ID is required" });
    }
    const post = await postService.getPostById(postId);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }
    res.status(200).json(post);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch post" });
  }
};

const createPost = async (req: Request, res: Response, next: NextFunction) => {
  // Logic to create a new post
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const result = await postService.createPost(
      req.body,
      req.user.id as string
    );
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

const getMyPosts = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const userId = user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const myPosts = await postService.getMyPosts(userId);
    res.status(200).json(myPosts);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch posts" });
  }
};

const updatePost = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const userId = user?.id;
    const postId = req.params.postId;
    const updateData = req.body;

    const isAdmin = user?.role === "ADMIN";

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!postId) {
      return res.status(400).json({ error: "Post ID is required" });
    }

    const updatedPost = await postService.updatePost(
      postId,
      updateData,
      userId,
      isAdmin
    );
    res.status(200).json(updatedPost);
  } catch (error) {
    console.error("Update post error:", error);
    if (error instanceof Error) {
      if (error.message.includes("Unauthorized")) {
        return res.status(403).json({ error: error.message });
      }
      if (error.message === "Post not found") {
        return res.status(404).json({ error: error.message });
      }
    }
    res.status(500).json({
      error: "Failed to update post",
      details: error instanceof Error ? error.message : String(error),
    });
  }
};

const deletePost = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const userId = user?.id;
    const postId = req.params.postId;
    const isAdmin = user?.role === "ADMIN";

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    if (!postId) {
      return res.status(400).json({ error: "Post ID is required" });
    }
    await postService.deletePost(postId, userId, isAdmin);
    res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error("Delete post error:", error);

    if (error instanceof Error) {
      if (error.message.includes("Unauthorized")) {
        return res.status(403).json({ error: error.message });
      }
      if (error.message === "Post not found") {
        return res.status(404).json({ error: error.message });
      }
    }
    res.status(500).json({
      error: "Failed to delete post",
      details: error instanceof Error ? error.message : String(error),
    });
  }
};

const getStats = async (req: Request, res: Response) => {
  try {
    const stats = await postService.getStats();
    res.status(200).json(stats);
  } catch (error) {
    console.error("Get stats error:", error);
    res.status(500).json({
      error: "Failed to fetch post statistics",
      details: error instanceof Error ? error.message : String(error),
    });
  }
};

export const postController = {
  createPost,
  getAllPosts,
  getPostById,
  getMyPosts,
  updatePost,
  deletePost,
  getStats,
};
