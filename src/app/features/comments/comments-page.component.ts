import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { Comment } from '../../core/models/comment.model';
import { CommentService } from '../../core/services/comment.service';
import { PostService } from '../../core/services/post.service';
import { ConfirmDialogComponent } from '../../shared/ui/confirm-dialog.component';
import { CommentFormDialogComponent, CommentFormResult } from './comment-form-dialog.component';

@Component({
  selector: 'app-comments-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,

    MatTableModule,
    MatProgressSpinnerModule,
    MatPaginatorModule,
    MatSortModule,
    MatIconModule,
    MatButtonModule,
    MatSnackBarModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  template: `
    <div class="page">
      <div class="header">
        <div class="title">
          <h1>Comments</h1>
          <p class="subtitle">
            Post ID: <b>{{ postId }}</b>
            <span *ngIf="postTitle">— {{ postTitle }}</span>
          </p>
        </div>

        <div class="header-actions">
          <mat-form-field appearance="outline" class="search">
            <mat-label>Search</mat-label>
            <input matInput (input)="applyFilter($any($event.target).value)" placeholder="Author / content" />
          </mat-form-field>

          <button mat-raised-button color="primary" (click)="openAdd()">
            <mat-icon>add</mat-icon>
            Add
          </button>
        </div>
      </div>

      <div class="state" *ngIf="status === 'loading'">
        <mat-spinner diameter="44"></mat-spinner>
        <p>Loading comments...</p>
      </div>

      <div class="state error" *ngIf="status === 'error'">
        <p>{{ error }}</p>
        <button mat-stroked-button (click)="reload()">Retry</button>
      </div>

      <div class="state" *ngIf="status === 'success' && dataSource.data.length === 0">
        <p>No comments found.</p>
        <button mat-raised-button color="primary" (click)="openAdd()">Create first comment</button>
      </div>

      <div class="table-wrap" *ngIf="status === 'success' && dataSource.data.length > 0">
        <table mat-table [dataSource]="dataSource" matSort class="mat-elevation-z2">

          <ng-container matColumnDef="author">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Author</th>
            <td mat-cell *matCellDef="let row">{{ row.author }}</td>
          </ng-container>

          <ng-container matColumnDef="content">
            <th mat-header-cell *matHeaderCellDef>Content</th>
            <td mat-cell *matCellDef="let row" class="content-cell">{{ row.content }}</td>
          </ng-container>

          <ng-container matColumnDef="updatedAt">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Updated</th>
            <td mat-cell *matCellDef="let row">{{ row.updatedAt | date:'medium' }}</td>
          </ng-container>

          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef class="actions-col">Actions</th>
            <td mat-cell *matCellDef="let row" class="actions-col">
              <button mat-icon-button (click)="openEdit(row)" aria-label="Edit">
                <mat-icon>edit</mat-icon>
              </button>
              <button mat-icon-button color="warn" (click)="confirmDelete(row)" aria-label="Delete">
                <mat-icon>delete</mat-icon>
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
        </table>

        <mat-paginator [pageSize]="10" [pageSizeOptions]="[5,10,20]" showFirstLastButtons></mat-paginator>
      </div>
    </div>
  `,
  styles: [`
    .page { padding: 16px; display: flex; flex-direction: column; gap: 16px; }
    .header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
    .title { display: flex; flex-direction: column; gap: 4px; }
    .subtitle { margin: 0; opacity: 0.8; }

    .header-actions { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
    .search { width: min(420px, 90vw); }

    .state { display: grid; place-items: center; gap: 8px; padding: 24px; }
    .state.error { gap: 12px; }

    .table-wrap { overflow: auto; border-radius: 12px; }
    table { width: 100%; min-width: 860px; }

    .content-cell { max-width: 520px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .actions-col { width: 140px; text-align: right; cursor: default; }
    .actions-col button { cursor: pointer; }
  `],
})
export class CommentsPageComponent implements OnInit, AfterViewInit, OnDestroy {
  status: 'idle' | 'loading' | 'success' | 'error' = 'idle';
  error: string | null = null;

  postId!: number;
  postTitle: string | null = null;

  displayedColumns: Array<'author' | 'content' | 'updatedAt' | 'actions'> = ['author', 'content', 'updatedAt', 'actions'];
  dataSource = new MatTableDataSource<Comment>([]);

  private readonly destroy$ = new Subject<void>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly posts: PostService,
    private readonly comments: CommentService,
    private readonly dialog: MatDialog,
    private readonly snack: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.dataSource.filterPredicate = (row, filter) => {
      const f = filter.trim().toLowerCase();
      const hay = `${row.author} ${row.content}`.toLowerCase();
      return hay.includes(f);
    };

    this.comments.state$
      .pipe(takeUntil(this.destroy$))
      .subscribe((s) => {
        this.status = s.status;
        this.error = s.error;
        this.dataSource.data = s.data;
      });

    this.route.paramMap
      .pipe(takeUntil(this.destroy$))
      .subscribe((pm) => {
        const id = Number(pm.get('id'));
        if (!Number.isFinite(id)) return;

        this.postId = id;

        const post = this.posts.getById(id);
        this.postTitle = post?.title ?? null;

        this.comments.loadComments(id);
      });
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;

    this.dataSource.sortingDataAccessor = (row: Comment, column: string) => {
      if (column === 'updatedAt') return new Date(row.updatedAt).getTime();
      return (row as any)[column];
    };
  }

  reload(): void {
    this.comments.loadComments(this.postId, true);
  }

  applyFilter(value: string): void {
    this.dataSource.filter = value ?? '';
    if (this.dataSource.paginator) this.dataSource.paginator.firstPage();
  }

  openAdd(): void {
    const ref = this.dialog.open(CommentFormDialogComponent, {
      width: '680px',
      maxWidth: '95vw',
      data: { mode: 'add' },
    });

    ref.afterClosed().subscribe((result: CommentFormResult | null) => {
      if (!result) return;

      this.comments.addComment(this.postId, result);
      this.snack.open('Comment created successfully.', 'OK', { duration: 2500 });
    });
  }

  openEdit(row: Comment): void {
    const ref = this.dialog.open(CommentFormDialogComponent, {
      width: '680px',
      maxWidth: '95vw',
      data: {
        mode: 'edit',
        initial: { author: row.author, content: row.content },
      },
    });

    ref.afterClosed().subscribe((result: CommentFormResult | null) => {
      if (!result) return;

      const ok = this.comments.updateComment(this.postId, row.id, result);
      this.snack.open(ok ? 'Comment updated successfully.' : 'Comment not found.', 'OK', { duration: 2500 });
    });
  }

  confirmDelete(row: Comment): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '440px',
      maxWidth: '95vw',
      data: {
        title: 'Delete comment?',
        message: 'This will permanently delete the selected comment.',
        confirmText: 'Delete',
        cancelText: 'Cancel',
      },
    });

    ref.afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) return;

      const ok = this.comments.deleteComment(this.postId, row.id);
      this.snack.open(ok ? 'Comment deleted.' : 'Comment not found.', 'OK', { duration: 2500 });
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
