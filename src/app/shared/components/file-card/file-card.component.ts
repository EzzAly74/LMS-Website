import { DatePipe, NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

import { LanguageService } from '../../../core/services/language.service';

/**
 * A stored or chosen file as a row: format badge, name, "size • date"
 * (Figma "Attachment Cards", 2003:79370; badges from "Attachments format",
 * the same set the Dashboard's nas-file-card draws). Actions (Download,
 * remove) are projected with `fcAction`. With `downloadable`, the row itself
 * is a button that asks the host to download - the host owns the request,
 * because files are served through authorized API routes.
 */
@Component({
  selector: 'app-file-card',
  standalone: true,
  imports: [DatePipe, NgTemplateOutlet, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="fc" [class.fc--tall]="tall()">
      @if (downloadable()) {
        <button type="button" class="fc__main fc__main--button" (click)="open.emit()" [disabled]="busy()" [attr.aria-busy]="busy()"
          [attr.aria-label]="'common.download_file' | translate: { name: name() }">
          <ng-container *ngTemplateOutlet="main" />
        </button>
      } @else {
        <div class="fc__main"><ng-container *ngTemplateOutlet="main" /></div>
      }
      <ng-content select="[fcAction]" />
    </div>

    <ng-template #main>
      <span class="fc__icon" aria-hidden="true">
        <img src="assets/icons/assignment/file-page-28.svg" width="23" height="28" alt="" />
        <span class="fc__badge fc__badge--{{ format().tone }}">{{ format().label }}</span>
      </span>
      <span class="fc__text">
        <span class="fc__name"><bdi>{{ name() }}</bdi></span>
        <span class="fc__meta">
          <bdi dir="ltr">{{ sizeLabel() }}</bdi>
          @if (date(); as d) {
            <span class="fc__sep" aria-hidden="true">•</span><bdi>{{ d | date: 'd MMM, y' : undefined : lang() }}</bdi>
          }
        </span>
      </span>
    </ng-template>
  `,
  styleUrl: './file-card.component.scss',
})
export class FileCardComponent {
  protected readonly lang = inject(LanguageService).current;

  readonly name = input.required<string>();
  /** Bytes. */
  readonly size = input<number>(0);
  /** ISO date-time or Date; omitted when unknown. */
  readonly date = input<string | Date | null>(null);
  readonly downloadable = input(false);
  readonly busy = input(false);
  /** The 80 px instructor-template row (2003:79370) rather than the 52 px file row. */
  readonly tall = input(false);
  readonly open = output<void>();

  protected readonly format = computed(() => {
    const ext = (this.name().split('.').pop() ?? '').toLowerCase();
    const tone = ({ xls: 'xls', xlsx: 'xls', pdf: 'pdf', png: 'png', jpg: 'jpg', jpeg: 'jpg', doc: 'doc', docx: 'doc', ppt: 'ppt', pptx: 'ppt' } as Record<string, string>)[ext] ?? 'other';
    const label = tone === 'other' ? ext.slice(0, 4).toUpperCase() || '—' : tone.toUpperCase();
    return { tone, label };
  });

  protected readonly sizeLabel = computed(() => {
    const bytes = this.size();
    const mb = bytes / (1024 * 1024);
    return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
  });
}
