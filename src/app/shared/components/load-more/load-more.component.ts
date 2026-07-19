import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

/** "Load more" control with a loading state — the card-grid pagination pattern. */
@Component({
  selector: 'app-load-more',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    <div class="load-more">
      <button type="button" class="load-more__btn" [disabled]="loading" (click)="loadMore.emit()">
        @if (loading) {
          <i class="pi pi-spinner load-more__spin" aria-hidden="true"></i>
        }
        {{ 'common.load_more' | translate }}
      </button>
    </div>
  `,
  styleUrl: './load-more.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadMoreComponent {
  @Input() loading = false;
  @Output() loadMore = new EventEmitter<void>();
}
