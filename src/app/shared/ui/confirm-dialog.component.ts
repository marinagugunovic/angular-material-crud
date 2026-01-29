import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>

    <div mat-dialog-content>
      <p>{{ data.message }}</p>
    </div>

    <div mat-dialog-actions align="end">
      <button mat-button mat-dialog-close="false">
        {{ data.cancelText ?? 'Cancel' }}
      </button>
      <button mat-raised-button color="warn" [mat-dialog-close]="true">
        {{ data.confirmText ?? 'Delete' }}
      </button>
    </div>
  `,
})
export class ConfirmDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public readonly data: ConfirmDialogData) {}
}
