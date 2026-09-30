import { ChangeDetectionStrategy, Component, Input, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { NotificationService } from '../../../../core/services/notification.service';
import { EmptyStateComponent, EmptyStateConfig } from '../../../../shared/components/empty-state/empty-state.component';
import { ShimmerComponent } from '../../../../shared/components/shimmer/shimmer.component';
import { QualificationProgress } from '../../models/profile.models';
import { ProfileService } from '../../services/profile.service';

/**
 * Qualifications tab — one expandable card per required qualification, each
 * split into earned (with certificate download) and uncovered (no-cohort /
 * notify-me) course rows. Pixel-perfect from Figma 832-41307 / 841-42290.
 */
@Component({
  selector: 'app-qualifications-tab',
  standalone: true,
  imports: [DatePipe, TranslatePipe, ShimmerComponent, EmptyStateComponent],
  templateUrl: './qualifications-tab.component.html',
  styleUrl: './qualifications-tab.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QualificationsTabComponent {
  @Input({ required: true }) set qualifications(value: QualificationProgress[]) {
    this._qualifications.set(value ?? []);
  }
  @Input() loading = false;
  @Input() set search(value: string) {
    this._search.set(value ?? '');
  }

  private readonly translate = inject(TranslateService);
  private readonly profile = inject(ProfileService);
  private readonly notify = inject(NotificationService);

  private readonly _qualifications = signal<QualificationProgress[]>([]);
  private readonly _search = signal('');
  private readonly expanded = signal<Set<number>>(new Set());
  protected readonly downloadingId = signal<number | null>(null);

  protected readonly skeletons = Array.from({ length: 4 });

  protected readonly filtered = computed(() => {
    const term = this._search();
    const list = this._qualifications();
    if (!term) {
      return list;
    }
    return list.filter(
      (q) =>
        q.name.toLowerCase().includes(term) ||
        q.earned_courses.some((c) => c.title.toLowerCase().includes(term)) ||
        q.uncovered_courses.some((c) => c.title.toLowerCase().includes(term)),
    );
  });

  protected get emptyState(): EmptyStateConfig {
    return {
      icon: 'pi-verified',
      title: this.translate.instant('feature.profile.qualifications.empty.title'),
      message: this.translate.instant('feature.profile.qualifications.empty.message'),
    };
  }

  protected isExpanded(id: number): boolean {
    return this.expanded().has(id);
  }

  protected toggle(id: number): void {
    const next = new Set(this.expanded());
    next.has(id) ? next.delete(id) : next.add(id);
    this.expanded.set(next);
  }

  /**
   * Download a certificate through HttpClient (so the auth interceptor
   * attaches the bearer token) and save the returned blob. A plain
   * `<a href>` was used before, which sent no token and pointed at a JSON
   * endpoint — so it never produced a file.
   */
  protected downloadCertificate(certificateId: number): void {
    if (this.downloadingId() !== null) {
      return;
    }
    this.downloadingId.set(certificateId);
    this.profile.downloadCertificate(certificateId).subscribe({
      next: (blob) => {
        this.saveBlob(blob, `certificate-${certificateId}.jpg`);
        this.downloadingId.set(null);
      },
      error: () => {
        this.downloadingId.set(null);
        this.notify.error('feature.profile.qualifications.download_failed');
      },
    });
  }

  private saveBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }
}
