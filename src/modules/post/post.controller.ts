import { Request, Response } from "express";
import { postService } from "./post.service";
import { PostStatus } from "../../../generated/prisma/enums";

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

    const results = await postService.getAllPosts({
      search: searchStr,
      tags,
      isFeatured,
      status,
      authorId,
    });
    res.status(200).json(results);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch posts" });
  }
};

const createPost = async (req: Request, res: Response) => {
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
    res.status(400).json({ error: "Failed to create post" });
  }
};

export const postController = {
  createPost,
  getAllPosts,
};
