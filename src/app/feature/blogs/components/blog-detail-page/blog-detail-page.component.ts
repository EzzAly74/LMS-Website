import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { NotificationService } from '../../../../core/services/notification.service';
import { reloadOnLanguageChange } from '../../../../core/utils/reload-on-language-change';
import { AvatarComponent } from '../../../../shared/components/avatar/avatar.component';
import { ShimmerComponent } from '../../../../shared/components/shimmer/shimmer.component';
import { BlogCardComponent } from '../blog-card/blog-card.component';
import { BlogDetail, BlogListItem } from '../../models/blog.models';
import { BlogsService } from '../../services/blogs.service';

@Component({
  selector: 'app-blog-detail-page',
  standalone: true,
  imports: [DatePipe, RouterLink, TranslatePipe, AvatarComponent, ShimmerComponent, BlogCardComponent],
  templateUrl: './blog-detail-page.component.html',
  styleUrl: './blog-detail-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlogDetailPageComponent implements OnInit {
  private readonly blogsApi = inject(BlogsService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly notify = inject(NotificationService);
  private readonly translate = inject(TranslateService);

  protected readonly blog = signal<BlogDetail | null>(null);
  protected readonly related = signal<BlogListItem[]>([]);
  protected readonly loading = signal(true);

  private slug = '';

  constructor() {
    reloadOnLanguageChange(() => this.load());
  }

  ngOnInit(): void {
    this.slug = this.route.snapshot.paramMap.get('slug') ?? '';
    this.load();
  }

  private load(): void {
    if (!this.slug) return;
    this.loading.set(true);

    this.blogsApi.getBlog(this.slug).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.status === 'success' && res.result) {
          this.blog.set(res.result);
        } else {
          this.router.navigate(['/blogs']);
        }
      },
      error: () => {
        this.loading.set(false);
        this.router.navigate(['/blogs']);
      },
    });

    this.blogsApi.getRelated(this.slug).subscribe({
      next: (res) => {
        if (res.status === 'success' && res.result) this.related.set(res.result);
      },
    });
  }

  protected copyLink(): void {
    const url = window.location.href;
    navigator.clipboard?.writeText(url).then(
      () => this.notify.success(this.translate.instant('feature.blogs.link_copied')),
      () => undefined,
    );
  }

  protected shareUrl(network: 'x' | 'linkedin' | 'facebook'): string {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(this.blog()?.title ?? '');
    switch (network) {
      case 'x':
        return `https://twitter.com/intent/tweet?url=${url}&text=${title}`;
      case 'linkedin':
        return `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
      case 'facebook':
        return `https://www.facebook.com/sharer/sharer.php?u=${url}`;
    }
  }
}
