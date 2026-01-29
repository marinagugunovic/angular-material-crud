import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, catchError, delay, map, of, tap } from 'rxjs';

import { Post, PostUpsert } from '../models/post.model';

export type EntityStatus = 'idle' | 'loading' | 'success' | 'error';

export interface EntityState<T> {
  status: EntityStatus;
  data: T[];
  error: string | null;
}

@Injectable({ providedIn: 'root' })
export class PostService {
  private readonly apiUrl = 'https://jsonplaceholder.typicode.com/posts';
  private readonly storageKey = 'posts_cache_v1';

  private readonly stateSubject = new BehaviorSubject<EntityState<Post>>({
    status: 'idle',
    data: [],
    error: null,
  });

  readonly state$ = this.stateSubject.asObservable();

  constructor(private readonly http: HttpClient) {}

  loadPosts(forceReload = false): void {
    const cached = this.readCache();

    if (!forceReload && cached.length > 0) {
      this.stateSubject.next({ status: 'success', data: cached, error: null });
      return;
    }

    this.stateSubject.next({ status: 'loading', data: [], error: null });

    this.http
      .get<Array<{ id: number; title: string; body: string; userId: number }>>(this.apiUrl)
      .pipe(
        delay(400),
        map((rows) => rows.slice(0, 50)),
        map((rows) => rows.map((r) => this.toPost(r))),
        tap((posts) => this.writeCache(posts)),
        tap((posts) => this.stateSubject.next({ status: 'success', data: posts, error: null })),
        catchError(() => {
          this.stateSubject.next({ status: 'error', data: [], error: 'Failed to load posts.' });
          return of([]);
        })
      )
      .subscribe();
  }

  getById(id: number): Post | null {
    const current = this.stateSubject.value.data;
    const fromState = current.find((p) => p.id === id);
    if (fromState) return fromState;

    const cached = this.readCache();
    return cached.find((p) => p.id === id) ?? null;
  }

  addPost(payload: PostUpsert): void {
    const now = new Date().toISOString();
    const current = this.readCache();
    const nextId = current.length ? Math.max(...current.map((p) => p.id)) + 1 : 1;

    const post: Post = {
      id: nextId,
      title: payload.title,
      body: payload.body,
      author: payload.author,
      createdAt: now,
      updatedAt: now,
    };

    const next = [post, ...current];
    this.writeCache(next);
    this.stateSubject.next({ status: 'success', data: next, error: null });
  }

  updatePost(id: number, payload: PostUpsert): boolean {
    const current = this.readCache();
    const idx = current.findIndex((p) => p.id === id);
    if (idx === -1) return false;

    const updated: Post = {
      ...current[idx],
      title: payload.title,
      body: payload.body,
      author: payload.author,
      updatedAt: new Date().toISOString(),
    };

    const next = [...current];
    next[idx] = updated;

    this.writeCache(next);
    this.stateSubject.next({ status: 'success', data: next, error: null });
    return true;
  }

  deletePost(id: number): boolean {
    const current = this.readCache();
    const next = current.filter((p) => p.id !== id);
    if (next.length === current.length) return false;

    this.writeCache(next);
    this.stateSubject.next({ status: 'success', data: next, error: null });
    return true;
  }

  private toPost(row: { id: number; title: string; body: string; userId: number }): Post {
    const now = new Date().toISOString();
    return {
      id: row.id,
      title: row.title,
      body: row.body,
      author: `User ${row.userId}`,
      createdAt: now,
      updatedAt: now,
    };
  }

  private readCache(): Post[] {
    const raw = localStorage.getItem(this.storageKey);
    if (!raw) return [];
    try {
      return JSON.parse(raw) as Post[];
    } catch {
      return [];
    }
  }

  private writeCache(posts: Post[]): void {
    localStorage.setItem(this.storageKey, JSON.stringify(posts));
  }
}
