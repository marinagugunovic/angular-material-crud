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

import { Comment } from '../../core/models/comment.model';
import { CommentService } from '../../core/services/comment.service';
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
  ],
  template: `
    <div class="page">
      <div class="header">
        <div class="title">
          <h1>Comments</h1>
          <p class="subtitle">Post ID: {{ postId }}</p>
        </div>

        <div class="header-actions">
          <button mat-stroked-button routerLink="/posts">
            <mat-icon>arrow_back</mat-icon>
            Back
          </button>

          <button mat-raised-button color="primary" (click)="openAdd()" [disabled]="!postId">
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
        <p>No comments.</p>
        <button mat-raised-button color="primary" (click)="openAdd()">Add first comment</button>
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
              <button mat-icon-button color="warn" (click)="delete(row.id)" aria-label="Delete">
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

    .state { display: grid; place-items: center; gap: 8px; padding: 24px; }
    .state.error { gap: 12px; }

    .table-wrap { overflow: auto; border-radius: 12px; }
    table { width: 100%; min-width: 860px; }

    .content-cell { max-width: 520px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .actions-col { width: 120px; text-align: right; }
  `],
})
export class CommentsPageComponent implements OnInit, AfterViewInit, OnDestroy {
  postId: number | null = null;

  status: 'idle' | 'loading' | 'success' | 'error' = 'idle';
  error: string | null = null;

  displayedColumns: Array<'author' | 'content' | 'updatedAt' | 'actions'> =
    ['author', 'content', 'updatedAt', 'actions'];

  dataSource = new MatTableDataSource<Comment>([]);

  private readonly destroy$ = new Subject<void>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly comments: CommentService,
    private readonly dialog: MatDialog,
    private readonly snack: MatSnackBar
  ) {}

  ngOnInit(): void {
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
        this.postId = Number.isFinite(id) ? id : null;
        if (this.postId) this.comments.loadComments(this.postId);
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
    if (!this.postId) return;
    this.comments.loadComments(this.postId);
  }

  openAdd(): void {
    if (!this.postId) return;

    const ref = this.dialog.open(CommentFormDialogComponent, {
      width: '680px',
      maxWidth: '95vw',
      data: { mode: 'add' },
    });

    ref.afterClosed().subscribe((result: CommentFormResult | null) => {
      if (!result) return;
      this.comments.addComment(this.postId!, result);
      this.snack.open('Comment added.', 'OK', { duration: 2000 });
    });
  }

  delete(id: number): void {
   if (!this.postId) return;
const ok = this.comments.deleteComment(this.postId, id);

    this.snack.open(ok ? 'Comment deleted.' : 'Comment not found.', 'OK', { duration: 2000 });
  }

  ngOnDestroy(): void {
   
    this.destroy$.next();
    this.destroy$.complete();
  }
}
