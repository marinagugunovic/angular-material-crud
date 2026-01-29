import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

export type CommentFormMode = 'add' | 'edit';

export interface CommentFormResult {
  author: string;
  content: string;
}

export interface CommentFormData {
  mode: CommentFormMode;
  initial?: Partial<CommentFormResult>;
}

@Component({
  selector: 'app-comment-form-dialog',
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
    <h2 mat-dialog-title>{{ data.mode === 'add' ? 'Add comment' : 'Edit comment' }}</h2>

    <form [formGroup]="form" (ngSubmit)="submit()">
      <div mat-dialog-content class="content">
        <mat-form-field appearance="outline" class="full">
          <mat-label>Author</mat-label>
          <input matInput formControlName="author" />
          <mat-error *ngIf="form.get('author')?.hasError('required')">Author is required.</mat-error>
          <mat-error *ngIf="form.get('author')?.hasError('minlength')">Min 2 characters.</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full">
          <mat-label>Content</mat-label>
          <textarea matInput rows="5" formControlName="content"></textarea>
          <mat-error *ngIf="form.get('content')?.hasError('required')">Content is required.</mat-error>
          <mat-error *ngIf="form.get('content')?.hasError('minlength')">Min 5 characters.</mat-error>
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
export class CommentFormDialogComponent {
  readonly form;

  constructor(
    private readonly fb: FormBuilder,
    private readonly dialogRef: MatDialogRef<CommentFormDialogComponent, CommentFormResult | null>,
    @Inject(MAT_DIALOG_DATA) public readonly data: CommentFormData
  ) {
    this.form = this.fb.group({
      author: [data.initial?.author ?? '', [Validators.required, Validators.minLength(2)]],
      content: [data.initial?.content ?? '', [Validators.required, Validators.minLength(5)]],
    });
  }

  submit(): void {
    if (this.form.invalid) return;
    this.dialogRef.close(this.form.getRawValue() as CommentFormResult);
  }

  close(): void {
    this.dialogRef.close(null);
  }
}
