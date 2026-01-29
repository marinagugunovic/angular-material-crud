import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

export interface PostFormData {
  mode: 'add' | 'edit';
  initial?: { title: string; body: string; author: string };
}

export interface PostFormResult {
  title: string;
  body: string;
  author: string;
}

@Component({
  selector: 'app-post-form-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data.mode === 'add' ? 'Add Post' : 'Edit Post' }}</h2>

    <form [formGroup]="form" (ngSubmit)="submit()" mat-dialog-content>
      <mat-form-field appearance="outline" class="full">
        <mat-label>Title</mat-label>
        <input matInput formControlName="title" maxlength="80" />
        <mat-hint align="end">{{ form.get('title')?.value?.length ?? 0 }}/80</mat-hint>
        <mat-error *ngIf="form.get('title')?.hasError('required')">Title is required.</mat-error>
        <mat-error *ngIf="form.get('title')?.hasError('minlength')">Title is too short.</mat-error>
      </mat-form-field>

      <mat-form-field appearance="outline" class="full">
        <mat-label>Author</mat-label>
        <input matInput formControlName="author" maxlength="40" />
        <mat-hint align="end">{{ form.get('author')?.value?.length ?? 0 }}/40</mat-hint>
        <mat-error *ngIf="form.get('author')?.hasError('required')">Author is required.</mat-error>
        <mat-error *ngIf="form.get('author')?.hasError('minlength')">Author is too short.</mat-error>
      </mat-form-field>

      <mat-form-field appearance="outline" class="full">
        <mat-label>Body</mat-label>
        <textarea matInput rows="6" formControlName="body" maxlength="500"></textarea>
        <mat-hint align="end">{{ form.get('body')?.value?.length ?? 0 }}/500</mat-hint>
        <mat-error *ngIf="form.get('body')?.hasError('required')">Body is required.</mat-error>
        <mat-error *ngIf="form.get('body')?.hasError('minlength')">Body is too short.</mat-error>
      </mat-form-field>

      <div mat-dialog-actions align="end">
        <button mat-button type="button" (click)="close()">Cancel</button>
        <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid">
          {{ data.mode === 'add' ? 'Create' : 'Save' }}
        </button>
      </div>
    </form>
  `,
  styles: [`.full { width: 100%; }`],
})
export class PostFormDialogComponent {
  form: FormGroup;

  constructor(
    private readonly fb: FormBuilder,
    private readonly dialogRef: MatDialogRef<PostFormDialogComponent, PostFormResult | null>,
    @Inject(MAT_DIALOG_DATA) public readonly data: PostFormData
  ) {
    // Build the form in the constructor so DI properties are available.
    this.form = this.fb.group({
      title: [data.initial?.title ?? '', [Validators.required, Validators.minLength(3)]],
      author: [data.initial?.author ?? '', [Validators.required, Validators.minLength(2)]],
      body: [data.initial?.body ?? '', [Validators.required, Validators.minLength(10)]],
    });
  }

  submit(): void {
    if (this.form.invalid) return;

    const value = this.form.getRawValue() as PostFormResult;
    this.dialogRef.close(value);
  }

  close(): void {
    this.dialogRef.close(null);
  }
}
