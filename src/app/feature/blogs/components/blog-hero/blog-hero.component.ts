import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

import { AvatarComponent } from '../../../../shared/components/avatar/avatar.component';
import { PluralKeyPipe } from '../../../../shared/pipes/plural-key.pipe';
import { BlogListItem } from '../../models/blog.models';

/**
 * Featured hero card at the top of the blog listing (Figma 1589:45950):
 * 640 px cover, editorial column; up to two chips then "+N" like the cards.
 */
@Component({
  selector: 'app-blog-hero',
  standalone: true,
  imports: [DatePipe, RouterLink, TranslatePipe, AvatarComponent, PluralKeyPipe],
  templateUrl: './blog-hero.component.html',
  styleUrl: './blog-hero.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlogHeroComponent {
  @Input({ required: true }) blog!: BlogListItem;
  /** i18n key for the flag badge — defaults to the qualification-tailored copy. */
  @Input() flagKey = 'feature.blogs.latest_in_role';

  protected get shownTopics() {
    return this.blog.qualifications.slice(0, 2);
  }

  protected get hiddenTopics(): number {
    return Math.max(0, this.blog.qualifications.length - 2);
  }
}
