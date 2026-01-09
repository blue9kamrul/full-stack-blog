import { Post, PostStatus } from "../../../generated/prisma/client";
import { PostWhereInput } from "../../../generated/prisma/models";
import { prisma } from "../../lib/prisma";

const getAllPosts = async (payload: {
  search: string | undefined;
  tags: string[] | [];
  isFeatured?: boolean | undefined;
  status?: PostStatus | undefined;
  authorId?: string | undefined;
}) => {
  const andConditions: PostWhereInput[] = [];

  if (payload.search) {
    andConditions.push({
      OR: [
        {
          title: {
            contains: payload.search as string,
            mode: "insensitive",
          },
        },
        {
          content: {
            contains: payload.search as string,
            mode: "insensitive",
          },
        },
        {
          tags: {
            has: payload.search as string,
          },
        },
      ],
    });
  }

  if (payload.tags.length > 0) {
    andConditions.push({
      tags: { hasEvery: payload.tags },
    });
  }

  if (payload.isFeatured !== undefined) {
    andConditions.push({
      isFeatured: payload.isFeatured,
    });
  }

  if (payload.status) {
    andConditions.push({
      status: payload.status,
    });
  }

  if (payload.authorId) {
    andConditions.push({
      authorId: payload.authorId,
    });
  }

  const posts = await prisma.post.findMany({
    where: andConditions.length > 0 ? { AND: andConditions } : {},
  });

  return posts;
};

const createPost = async (
  data: Omit<Post, "id" | "createdAt" | "updatedAt" | " authorId">,
  userId: string
) => {
  // Logic to create a new post in the database
  const result = await prisma.post.create({
    data: {
      ...data,
      authorId: userId,
    },
  });
  return result;
};

export const postService = {
  createPost,
  getAllPosts,
};
