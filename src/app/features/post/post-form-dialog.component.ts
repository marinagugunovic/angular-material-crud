import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

export type PostFormMode = 'add' | 'edit';

export interface PostFormResult {
  title: string;
  body: string;
  author: string;
}

export interface PostFormData {
  mode: PostFormMode;
  initial?: Partial<PostFormResult>;
}

@Component({
  selector: 'app-post-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,

    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data.mode === 'add' ? 'Add post' : 'Edit post' }}</h2>

    <form [formGroup]="form" (ngSubmit)="submit()">
      <div mat-dialog-content class="content">
        <mat-form-field appearance="outline" class="full">
          <mat-label>Title</mat-label>
          <input matInput formControlName="title" />
          <mat-error *ngIf="form.get('title')?.hasError('required')">Title is required.</mat-error>
          <mat-error *ngIf="form.get('title')?.hasError('minlength')">Min 3 characters.</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full">
          <mat-label>Author</mat-label>
          <input matInput formControlName="author" />
          <mat-error *ngIf="form.get('author')?.hasError('required')">Author is required.</mat-error>
          <mat-error *ngIf="form.get('author')?.hasError('minlength')">Min 2 characters.</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full">
          <mat-label>Body</mat-label>
          <textarea matInput rows="6" formControlName="body"></textarea>
          <mat-error *ngIf="form.get('body')?.hasError('required')">Body is required.</mat-error>
          <mat-error *ngIf="form.get('body')?.hasError('minlength')">Min 10 characters.</mat-error>
        </mat-form-field>
      </div>

      <div mat-dialog-actions align="end">
        <button mat-button type="button" (click)="close()">Cancel</button>
        <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid">
          {{ data.mode === 'add' ? 'Create' : 'Save' }}
        </button>
      </div>
    </form>
  `,
  styles: [
    `
      .content {
        display: grid;
        gap: 12px;
      }
      .full {
        width: 100%;
      }
    `,
  ],
})
export class PostFormDialogComponent {
  readonly form;

  constructor(
    private readonly fb: FormBuilder,
    private readonly dialogRef: MatDialogRef<PostFormDialogComponent, PostFormResult | null>,
    @Inject(MAT_DIALOG_DATA) public readonly data: PostFormData
  ) {
    this.form = this.fb.group({
      title: [data.initial?.title ?? '', [Validators.required, Validators.minLength(3)]],
      author: [data.initial?.author ?? '', [Validators.required, Validators.minLength(2)]],
      body: [data.initial?.body ?? '', [Validators.required, Validators.minLength(10)]],
    });
  }

  submit(): void {
    if (this.form.invalid) return;
    this.dialogRef.close(this.form.getRawValue() as PostFormResult);
  }

  close(): void {
    this.dialogRef.close(null);
  }
}
