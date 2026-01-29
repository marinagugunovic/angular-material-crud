import {
  AfterViewInit,
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
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

import { Post } from '../../core/models/post.model';
import { PostService } from '../../core/services/post.service';
import {
  PostFormDialogComponent,
  PostFormResult,
} from './post-form-dialog.component';
import { ConfirmDialogComponent } from '../../shared/ui/confirm-dialog.component';

@Component({
  selector: 'app-posts-list',
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

      <!-- DEBUG MARKER (možeš kasnije obrisati) -->
      <p style="color:red; font-weight:700;">POSTS COMPONENT LOADED</p>

      <div class="header">
        <div class="title">
          <h1>Posts</h1>
          <p class="subtitle">Browse, create, edit and delete posts.</p>
        </div>

        <div class="header-actions">
          <mat-form-field appearance="outline" class="search">
            <mat-label>Search</mat-label>
            <input
              matInput
              placeholder="Title / author / body"
              (input)="applyFilter($any($event.target).value)"
            />
          </mat-form-field>

          <button mat-raised-button color="primary" (click)="openAdd()">
            <mat-icon>add</mat-icon>
            Add
          </button>
        </div>
      </div>

      <!-- LOADING -->
      <div class="state" *ngIf="status === 'loading'">
        <mat-spinner diameter="40"></mat-spinner>
        <p>Loading posts…</p>
      </div>

      <!-- ERROR -->
      <div class="state error" *ngIf="status === 'error'">
        <p>{{ error }}</p>
        <button mat-stroked-button (click)="reload()">Retry</button>
      </div>

      <!-- EMPTY -->
      <div class="state" *ngIf="status === 'success' && dataSource.data.length === 0">
        <p>No posts found.</p>
        <button mat-raised-button color="primary" (click)="openAdd()">
          Create first post
        </button>
      </div>

      <!-- TABLE -->
      <div
        class="table-wrap"
        *ngIf="status === 'success' && dataSource.data.length > 0"
      >
        <table
          mat-table
          [dataSource]="dataSource"
          matSort
          class="mat-elevation-z2"
        >
          <!-- TITLE -->
          <ng-container matColumnDef="title">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>
              Title
            </th>
            <td
              mat-cell
              *matCellDef="let row"
              class="title-cell"
              (click)="goToComments(row)"
            >
              {{ row.title }}
            </td>
          </ng-container>

          <!-- AUTHOR -->
          <ng-container matColumnDef="author">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>
              Author
            </th>
            <td mat-cell *matCellDef="let row" (click)="goToComments(row)">
              {{ row.author }}
            </td>
          </ng-container>

          <!-- UPDATED -->
          <ng-container matColumnDef="updatedAt">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>
              Updated
            </th>
            <td mat-cell *matCellDef="let row" (click)="goToComments(row)">
              {{ row.updatedAt | date: 'medium' }}
            </td>
          </ng-container>

          <!-- ACTIONS -->
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef class="actions-col">
              Actions
            </th>
            <td mat-cell *matCellDef="let row" class="actions-col">
              <button
                mat-icon-button
                (click)="openEdit(row)"
                aria-label="Edit"
              >
                <mat-icon>edit</mat-icon>
              </button>
              <button
                mat-icon-button
                color="warn"
                (click)="confirmDelete(row)"
                aria-label="Delete"
              >
                <mat-icon>delete</mat-icon>
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr
            mat-row
            *matRowDef="let row; columns: displayedColumns"
          ></tr>
        </table>

        <mat-paginator
          [pageSize]="10"
          [pageSizeOptions]="[5, 10, 20]"
          showFirstLastButtons
        ></mat-paginator>
      </div>
    </div>
  `,
  styles: [
    `
      .page {
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 16px;
        flex-wrap: wrap;
      }

      .title {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .subtitle {
        margin: 0;
        opacity: 0.75;
      }

      .header-actions {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
        align-items: center;
      }

      .search {
        width: min(420px, 90vw);
      }

      .state {
        display: grid;
        place-items: center;
        gap: 8px;
        padding: 24px;
      }

      .state.error {
        gap: 12px;
      }

      .table-wrap {
        overflow: auto;
        border-radius: 12px;
      }

      table {
        width: 100%;
        min-width: 860px;
      }

      .title-cell {
        font-weight: 600;
        cursor: pointer;
      }

      .actions-col {
        width: 140px;
        text-align: right;
      }
    `,
  ],
})
export class PostsListComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  status: 'idle' | 'loading' | 'success' | 'error' = 'idle';
  error: string | null = null;

  displayedColumns: Array<'title' | 'author' | 'updatedAt' | 'actions'> = [
    'title',
    'author',
    'updatedAt',
    'actions',
  ];

  dataSource = new MatTableDataSource<Post>([]);

  private readonly destroy$ = new Subject<void>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private readonly posts: PostService,
    private readonly dialog: MatDialog,
    private readonly snack: MatSnackBar,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.dataSource.filterPredicate = (row, filter) => {
      const f = filter.trim().toLowerCase();
      return `${row.title} ${row.author} ${row.body}`
        .toLowerCase()
        .includes(f);
    };

    this.posts.state$
      .pipe(takeUntil(this.destroy$))
      .subscribe((state) => {
        this.status = state.status;
        this.error = state.error;
        this.dataSource.data = state.data;
      });

    this.posts.loadPosts();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;

    this.dataSource.sortingDataAccessor = (row: Post, column: string) => {
      if (column === 'updatedAt') {
        return new Date(row.updatedAt).getTime();
      }
      return (row as any)[column];
    };
  }

  reload(): void {
    this.posts.loadPosts();
  }

  applyFilter(value: string): void {
    this.dataSource.filter = value ?? '';
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  goToComments(row: Post): void {
    this.router.navigate(['/posts', row.id, 'comments']);
  }

  openAdd(): void {
    const ref = this.dialog.open(PostFormDialogComponent, {
      width: '680px',
      maxWidth: '95vw',
      data: { mode: 'add' },
    });

    ref.afterClosed().subscribe((result: PostFormResult | null) => {
      if (!result) return;
      this.posts.addPost(result);
      this.snack.open('Post created successfully.', 'OK', {
        duration: 2500,
      });
    });
  }

  openEdit(row: Post): void {
    const ref = this.dialog.open(PostFormDialogComponent, {
      width: '680px',
      maxWidth: '95vw',
      data: {
        mode: 'edit',
        initial: {
          title: row.title,
          body: row.body,
          author: row.author,
        },
      },
    });

    ref.afterClosed().subscribe((result: PostFormResult | null) => {
      if (!result) return;

      const updated = this.posts.updatePost(row.id, result);
      this.snack.open(
        updated ? 'Post updated.' : 'Post not found.',
        'OK',
        { duration: 2500 }
      );
    });
  }

  confirmDelete(row: Post): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '440px',
      maxWidth: '95vw',
      data: {
        title: 'Delete post?',
        message: 'This will permanently delete the selected post.',
        confirmText: 'Delete',
        cancelText: 'Cancel',
      },
    });

    ref.afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) return;
      const ok = this.posts.deletePost(row.id);
      this.snack.open(ok ? 'Post deleted.' : 'Post not found.', 'OK', {
        duration: 2500,
      });
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
