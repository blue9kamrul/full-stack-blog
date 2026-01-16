import { debug } from "node:console";
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
    include: {
      _count: {
        select: { comments: true },
      },
    },
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

const getMyPosts = async (authorId: string) => {
  const userInfo = await prisma.user.findUniqueOrThrow({
    where: { id: authorId },
    select: { id: true, status: true, role: true },
  });

  const comments = await prisma.comment.findMany({
    where: { authorId },
    orderBy: { createdAt: "desc" },
    include: {
      post: {
        select: {
          title: true,
          id: true,
          views: true,
          _count: { select: { comments: true } },
        },
      },
      comments: {
        where: { status: "APPROVED" },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  const totalPosts = await prisma.comment.aggregate({
    where: { authorId },
    _count: true,
  });

  return { data: comments, totalPosts };
};

const updatePost = async (
  postId: string,
  data: Partial<Post>,
  authorId: string,
  isAdmin: boolean
) => {
  const post = await prisma.post.findUnique({
    where: { id: postId },
  });

  if (!post) {
    throw new Error("Post not found");
  }

  if (!isAdmin && post.authorId !== authorId) {
    throw new Error("Unauthorized: You can only update your own posts");
  }

  if (!isAdmin) {
    delete data.isFeatured;
  }

  const updatedPost = await prisma.post.update({
    where: { id: postId },
    data,
  });
  return updatedPost;
};

const deletePost = async (
  postId: string,
  authorId: string,
  isAdmin: boolean
) => {
  const post = await prisma.post.findUnique({
    where: { id: postId },
  });

  if (!post) {
    throw new Error("Post not found");
  }
  if (!isAdmin && post.authorId !== authorId) {
    throw new Error("Unauthorized: You can only delete your own posts");
  }

  return await prisma.post.delete({
    where: { id: postId },
  });
};

const getStats = async () => {
  return await prisma.$transaction(async (tx) => {
    const [
      totalPosts,
      totalViews,
      featuredPosts,
      archivedPosts,
      totalComments,
      approvedComments,
      rejectedComments,
      totalUsers,
      totalAdmins,
    ] = await Promise.all([
      tx.post.count(),
      tx.post.count({
        where: { views: { gt: 0 } },
      }),
      tx.post.count({
        where: { isFeatured: true },
      }),
      tx.post.count({
        where: { status: "ARCHIVED" },
      }),
      tx.comment.count(),
      tx.comment.count({
        where: { status: "APPROVED" },
      }),
      tx.comment.count({
        where: { status: "REJECTED" },
      }),
      tx.user.count(),
      tx.user.count({
        where: { role: "ADMIN" },
      }),
    ]);

    return {
      totalPosts,
      totalViews,
      featuredPosts,
      archivedPosts,
      totalComments,
      approvedComments,
      rejectedComments,
      totalUsers,
      totalAdmins,
    };
  });
};

export const postService = {
  createPost,
  getAllPosts,
  getPostById,
  getMyPosts,
  updatePost,
  deletePost,
  getStats,
};
