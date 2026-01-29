export interface Post {
  id: number;
  title: string;
  body: string;
  author: string;
  createdAt: string;
  updatedAt: string;
}

export interface PostUpsert {
  title: string;
  body: string;
  author: string;
}
