import { prisma } from "../../../lib/prisma";

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

const commentService = {
  createComment,
};

export default commentService;
