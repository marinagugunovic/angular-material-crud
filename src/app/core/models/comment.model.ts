export interface Comment {
  id: number;
  postId: number;
  content: string;
  author: string;
  createdAt: string;
  updatedAt: string;
}

export type CommentUpsert = Pick<Comment, 'author' | 'content'>;
