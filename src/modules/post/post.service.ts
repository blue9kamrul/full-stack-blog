import { Post, PostStatus } from "../../../generated/prisma/client";
import { PostWhereInput } from "../../../generated/prisma/models";
import { prisma } from "../../lib/prisma";

const getAllPosts = async (payload: {
  search: string | undefined;
  tags: string[] | [];
  isFeatured?: boolean | undefined;
  status?: PostStatus | undefined;
  authorId?: string | undefined;
  page?: number;
  limit?: number;
  skip?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
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

  console.log("Pagination params:", {
    take: payload.limit,
    skip: payload.skip,
  });

  const posts = await prisma.post.findMany({
    take: payload.limit ?? 10,
    skip: payload.skip ?? 0,
    where: andConditions.length > 0 ? { AND: andConditions } : {},
    orderBy: payload.sortBy
      ? {
          [payload.sortBy]: payload.sortOrder ?? "desc",
        }
      : { createdAt: "desc" },
  });

  const totalCount = await prisma.post.count({
    where: andConditions.length > 0 ? { AND: andConditions } : {},
  });

  return {
    data: posts,
    pagination: {
      totalCount,
      page: payload.page,
      limit: payload.limit,
      totalPages: Math.ceil(totalCount / (payload.limit || 2)),
    },
  };
};

const getPostById = async (postId: string) => {
  return await prisma.$transaction(async (tx) => {
    await tx.post.update({
      where: { id: postId },
      data: {
        views: { increment: 1 },
      },
    });
    const postData = await tx.post.findUnique({
      where: { id: postId },
      include: {
        comments: {
          where: { parentId: null, status: "APPROVED" },
          orderBy: { createdAt: "desc" },
          include: {
            comments: {
              where: { status: "APPROVED" },
              orderBy: { createdAt: "asc" },
              include: {
                comments: {
                  where: { status: "APPROVED" },
                  orderBy: { createdAt: "asc" },
                },
              },
            },
          }, // this is replies although named comments, schema should be changed
        },
        _count: {
          select: { comments: true },
        },
      },
    });
    return postData;
  });
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
  getPostById,
};
