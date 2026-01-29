import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

import { CommentUpsert } from '../../core/models/comment.model';

export type CommentFormData = {
  mode: 'add';
  initial?: Partial<CommentUpsert>;
};

export type CommentFormResult = CommentUpsert;

@Component({
  selector: 'app-comment-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  template: `
    <h2 mat-dialog-title>Add comment</h2>

    <form [formGroup]="form" (ngSubmit)="submit()">
      <div mat-dialog-content class="content">
        <mat-form-field appearance="outline" class="full">
          <mat-label>Author</mat-label>
          <input matInput formControlName="author" />
          <mat-error *ngIf="form.get('author')?.hasError('required')">Author is required</mat-error>
          <mat-error *ngIf="form.get('author')?.hasError('minlength')">Min 2 characters</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full">
          <mat-label>Content</mat-label>
          <textarea matInput rows="6" formControlName="content"></textarea>
          <mat-error *ngIf="form.get('content')?.hasError('required')">Content is required</mat-error>
          <mat-error *ngIf="form.get('content')?.hasError('minlength')">Min 5 characters</mat-error>
        </mat-form-field>
      </div>

      <div mat-dialog-actions align="end">
        <button mat-button type="button" (click)="close()">Cancel</button>
        <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid">Add</button>
      </div>
    </form>
  `,
  styles: [`
    .content { display: grid; gap: 12px; }
    .full { width: 100%; }
  `],
})
export class CommentFormDialogComponent {
  readonly form;

  constructor(
    private readonly fb: FormBuilder,
    private readonly dialogRef: MatDialogRef<CommentFormDialogComponent, CommentFormResult | null>,
    @Inject(MAT_DIALOG_DATA) public readonly data: CommentFormData
  ) {
    this.form = this.fb.group({
      author: [this.data.initial?.author ?? '', [Validators.required, Validators.minLength(2)]],
      content: [this.data.initial?.content ?? '', [Validators.required, Validators.minLength(5)]],
    });
  }

  close(): void {
    this.dialogRef.close(null);
  }

  submit(): void {
    if (this.form.invalid) return;
    this.dialogRef.close(this.form.getRawValue() as CommentFormResult);
  }
}
