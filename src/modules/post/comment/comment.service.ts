import { prisma } from "../../../lib/prisma";
import { CommentStatus } from "../../../../generated/prisma/enums";

const createComment = async (payload: {
  postId: string;
  content: string;
  authorId: string;
  parentId?: string;
  status?: string;
}) => {
  const { postId, content, authorId } = payload;

  const newComment = await prisma.comment.create({
    data: {
      postId,
      content,
      authorId,
      parentId: payload.parentId || null,
    },
  });

  return newComment;
};

const getCommentsById = async (commentID: string) => {
  const comments = await prisma.comment.findMany({
    where: { id: commentID, status: "APPROVED" },
    orderBy: { createdAt: "desc" },
    include: {
      comments: {
        where: { status: "APPROVED" },
        orderBy: { createdAt: "asc" },
        include: {
          post: {
            select: { title: true, id: true, views: true },
          },

          comments: {
            where: { status: "APPROVED" },
            orderBy: { createdAt: "asc" },
          },
        },
      },
    },
  });
  return comments;
};

const getCommentsByAuthorId = async (authorID: string) => {
  const comments = await prisma.comment.findMany({
    where: { authorId: authorID },
    orderBy: { createdAt: "desc" },
    include: {
      post: {
        select: { title: true, id: true, views: true },
      },
      comments: {
        where: { status: "APPROVED" },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  return comments;
};

const deleteComment = async (commentID: string, userID: string) => {
  const comment = await prisma.comment.findFirst({
    where: { id: commentID, authorId: userID },
  });
  if (!comment) {
    throw new Error("Comment not found or unauthorized");
  }
  return await prisma.comment.delete({
    where: { id: commentID },
  });
};

const updateComment = async (
  authoredId: string,
  commentId: string,
  data: { content?: string | undefined; status?: CommentStatus | undefined }
) => {
  const comment = await prisma.comment.findFirst({
    where: { id: commentId, authorId: authoredId },
  });
  if (!comment) {
    throw new Error("Comment not found or unauthorized");
  }

  const updateData: { content?: string; status?: CommentStatus } = {};
  if (data.content !== undefined) updateData.content = data.content;
  if (data.status !== undefined) updateData.status = data.status;

  return await prisma.comment.update({
    where: { id: commentId },
    data: updateData,
  });
};

const moderateComment = async (commentId: string, status: CommentStatus) => {
  const commentData = await prisma.comment.findUnique({
    where: { id: commentId },
  });
  if (!commentData) {
    throw new Error("Comment not found");
  }
  if (commentData.status === status) {
    return { comment: commentData, alreadySet: true };
  }
  const updated = await prisma.comment.update({
    where: { id: commentId },
    data: { status },
  });
  return { comment: updated, alreadySet: false };
};

const commentService = {
  createComment,
  getCommentsById,
  getCommentsByAuthorId,
  deleteComment,
  updateComment,
  moderateComment,
};

export default commentService;
