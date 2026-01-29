import { Routes } from '@angular/router';
import { PostsListComponent } from './features/post/posts-list.component';
import { CommentsPageComponent } from './features/comments/comments-page.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'posts' },
  { path: 'posts', component: PostsListComponent },
  { path: 'posts/:id/comments', component: CommentsPageComponent },
  { path: '**', redirectTo: 'posts' },
];
