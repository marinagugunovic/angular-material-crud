import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, catchError, delay, map, of, tap } from 'rxjs';

import { Comment, CommentUpsert } from '../models/comment.model';
import { EntityState } from './post.service';

@Injectable({ providedIn: 'root' })
export class CommentService {
  private readonly apiUrl = 'https://jsonplaceholder.typicode.com/comments';

  private storageKey(postId: number): string {
    return `comments_cache_post_${postId}`;
  }

  private readonly stateSubject = new BehaviorSubject<EntityState<Comment>>({
    status: 'idle',
    data: [],
    error: null,
  });

  readonly state$ = this.stateSubject.asObservable();

  constructor(private readonly http: HttpClient) {}

  loadComments(postId: number, forceReload = false): void {
    const cached = this.readCache(postId);

    if (!forceReload && cached.length > 0) {
      this.stateSubject.next({ status: 'success', data: cached, error: null });
      return;
    }

    this.stateSubject.next({ status: 'loading', data: [], error: null });

    this.http
      .get<Array<{ id: number; postId: number; name: string; email: string; body: string }>>(
        `${this.apiUrl}?postId=${postId}`
      )
      .pipe(
        delay(400),
        map((rows) => rows.map((r) => this.toComment(r))),
        tap((comments) => this.writeCache(postId, comments)),
        tap((comments) => this.stateSubject.next({ status: 'success', data: comments, error: null })),
        catchError(() => {
          this.stateSubject.next({ status: 'error', data: [], error: 'Failed to load comments.' });
          return of([]);
        })
      )
      .subscribe();
  }

  addComment(postId: number, payload: CommentUpsert): void {
    const now = new Date().toISOString();
    const current = this.readCache(postId);
    const nextId = current.length ? Math.max(...current.map((c) => c.id)) + 1 : 1;

    const comment: Comment = {
      id: nextId,
      postId,
      author: payload.author,
      content: payload.content,
      createdAt: now,
      updatedAt: now,
    };

    const next = [comment, ...current];
    this.writeCache(postId, next);
    this.stateSubject.next({ status: 'success', data: next, error: null });
  }

  updateComment(postId: number, id: number, payload: CommentUpsert): boolean {
    const current = this.readCache(postId);
    const idx = current.findIndex((c) => c.id === id);
    if (idx === -1) return false;

    const updated: Comment = {
      ...current[idx],
      author: payload.author,
      content: payload.content,
      updatedAt: new Date().toISOString(),
    };

    const next = [...current];
    next[idx] = updated;

    this.writeCache(postId, next);
    this.stateSubject.next({ status: 'success', data: next, error: null });
    return true;
  }

  deleteComment(postId: number, id: number): boolean {
    const current = this.readCache(postId);
    const next = current.filter((c) => c.id !== id);
    if (next.length === current.length) return false;

    this.writeCache(postId, next);
    this.stateSubject.next({ status: 'success', data: next, error: null });
    return true;
  }

  private toComment(row: { id: number; postId: number; name: string; email: string; body: string }): Comment {
    const now = new Date().toISOString();
    return {
      id: row.id,
      postId: row.postId,
      author: row.email,
      content: row.body,
      createdAt: now,
      updatedAt: now,
    };
  }

  private readCache(postId: number): Comment[] {
    const raw = localStorage.getItem(this.storageKey(postId));
    if (!raw) return [];
    try {
      return JSON.parse(raw) as Comment[];
    } catch {
      return [];
    }
  }

  private writeCache(postId: number, comments: Comment[]): void {
    localStorage.setItem(this.storageKey(postId), JSON.stringify(comments));
  }
}
