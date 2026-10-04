import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

import { AuthService } from '../../../../core/auth/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { copyText } from '../../../../core/utils/copy-text';
import { reloadOnLanguageChange } from '../../../../core/utils/reload-on-language-change';
import { AvatarComponent } from '../../../../shared/components/avatar/avatar.component';
import { ShimmerComponent } from '../../../../shared/components/shimmer/shimmer.component';
import { BlogCardComponent } from '../blog-card/blog-card.component';
import { BlogDetail, BlogListItem } from '../../models/blog.models';
import { BlogsService } from '../../services/blogs.service';

@Component({
  selector: 'app-blog-detail-page',
  standalone: true,
  imports: [
    DatePipe,
    RouterLink,
    TranslatePipe,
    AvatarComponent,
    ShimmerComponent,
    BlogCardComponent,
  ],
  templateUrl: './blog-detail-page.component.html',
  styleUrl: './blog-detail-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlogDetailPageComponent implements OnInit {
  private readonly blogsApi = inject(BlogsService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly notify = inject(NotificationService);
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly blog = signal<BlogDetail | null>(null);
  protected readonly related = signal<BlogListItem[]>([]);
  protected readonly loading = signal(true);
  /** Momentary "Link Copied" state for the copy action tooltip. */
  protected readonly copied = signal(false);
  private readonly loving = signal(false);

  private slug = '';

  constructor() {
    reloadOnLanguageChange(() => this.load());
  }

  ngOnInit(): void {
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        this.slug = params.get('slug') ?? '';
        this.blog.set(null);
        this.related.set([]);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        this.load();
      });
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
        if (res.status === 'success' && res.result)
          this.related.set(res.result);
      },
    });
  }

  /** Copy the current page URL and flash the "Link Copied" state (Figma 1589-46544). */
  protected copyLink(): void {
    void copyText(window.location.href).then((ok) => {
      if (!ok) {
        this.notify.error('feature.blogs.copy_failed');
        return;
      }
      this.copied.set(true);
      this.notify.success('feature.blogs.link_copied');
      setTimeout(() => this.copied.set(false), 2000);
    });
  }

  /**
   * Toggle the "love" reaction (Figma 1589-46108). Optimistic; reverts on
   * error. Requires sign-in — a guest is prompted instead of firing a 401.
   */
  protected toggleLove(): void {
    const post = this.blog();
    if (!post || this.loving()) {
      return;
    }
    if (!this.auth.isAuthenticated()) {
      this.notify.info('feature.blogs.login_to_love');
      return;
    }

    const prevLoved = post.loved;
    const prevCount = post.love_count;
    this.loving.set(true);
    this.blog.set({ ...post, loved: !prevLoved, love_count: prevCount + (prevLoved ? -1 : 1) });

    this.blogsApi.toggleLove(post.slug).subscribe({
      next: (res) => {
        this.loving.set(false);
        const cur = this.blog();
        if (cur && res.status === 'success' && res.result) {
          this.blog.set({ ...cur, loved: res.result.loved, love_count: res.result.love_count });
        }
      },
      error: () => {
        this.loving.set(false);
        const cur = this.blog();
        if (cur) {
          this.blog.set({ ...cur, loved: prevLoved, love_count: prevCount });
        }
      },
    });
  }
}
