import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, catchError, finalize, map, of, tap } from 'rxjs';
import { Post } from '../models/post.model';
import { EntityState, initialEntityState } from '../state/entity-state.model';

type JsonPlaceholderPost = { userId: number; id: number; title: string; body: string };

@Injectable({ providedIn: 'root' })
export class PostService {
  private readonly apiUrl = 'https://jsonplaceholder.typicode.com/posts';
  private readonly storageKey = 'amc_posts_v1';

  private readonly stateSubject = new BehaviorSubject<EntityState<Post>>(initialEntityState<Post>());
  readonly state$ = this.stateSubject.asObservable();

  constructor(private readonly http: HttpClient) {}

  loadPosts(): void {
    // If local overrides exist, use them first.
    const local = this.readLocal();
    if (local.length > 0) {
      this.stateSubject.next({ status: 'success', data: local, error: null });
      return;
    }

    this.stateSubject.next({ ...this.stateSubject.value, status: 'loading', error: null });

    this.http.get<JsonPlaceholderPost[]>(this.apiUrl).pipe(
      map((items) => items.slice(0, 50)), // Keep UI smaller for the task
      map((items) => items.map((p) => this.mapApiPost(p))),
      tap((posts) => this.writeLocal(posts)),
      tap((posts) => this.stateSubject.next({ status: 'success', data: posts, error: null })),
      catchError((err) => {
        const msg = this.toErrorMessage(err);
        this.stateSubject.next({ status: 'error', data: [], error: msg });
        return of([]);
      }),
      finalize(() => {
        // No-op, state already updated above.
      })
    ).subscribe();
  }

  addPost(input: Pick<Post, 'title' | 'body' | 'author'>): Post {
    const now = new Date().toISOString();
    const current = this.getCurrentData();

    const newId = current.length > 0 ? Math.max(...current.map(p => p.id)) + 1 : 1;

    const created: Post = {
      id: newId,
      title: input.title.trim(),
      body: input.body.trim(),
      author: input.author.trim(),
      createdAt: now,
      updatedAt: now,
    };

    const next = [created, ...current];
    this.persistAndEmit(next);
    return created;
  }

  updatePost(id: number, patch: Pick<Post, 'title' | 'body' | 'author'>): Post | null {
    const now = new Date().toISOString();
    const current = this.getCurrentData();

    const idx = current.findIndex(p => p.id === id);
    if (idx === -1) return null;

    const updated: Post = {
      ...current[idx],
      title: patch.title.trim(),
      body: patch.body.trim(),
      author: patch.author.trim(),
      updatedAt: now,
    };

    const next = [...current];
    next[idx] = updated;

    this.persistAndEmit(next);
    return updated;
  }

  deletePost(id: number): boolean {
    const current = this.getCurrentData();
    const next = current.filter(p => p.id !== id);
    if (next.length === current.length) return false;

    this.persistAndEmit(next);
    return true;
  }

  getById(id: number): Post | undefined {
    return this.getCurrentData().find(p => p.id === id);
  }

  private persistAndEmit(next: Post[]): void {
    this.writeLocal(next);
    this.stateSubject.next({ status: 'success', data: next, error: null });
  }

  private getCurrentData(): Post[] {
    return this.stateSubject.value.data ?? [];
  }

  private mapApiPost(p: JsonPlaceholderPost): Post {
    const now = new Date().toISOString();
    return {
      id: p.id,
      title: p.title,
      body: p.body,
      author: `User ${p.userId}`,
      createdAt: now,
      updatedAt: now,
    };
  }

  private readLocal(): Post[] {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as Post[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private writeLocal(posts: Post[]): void {
    localStorage.setItem(this.storageKey, JSON.stringify(posts));
  }

  private toErrorMessage(err: unknown): string {
    if (typeof err === 'string') return err;
    return 'Failed to load posts. Please try again.';
  }
}
