import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

import { AvatarComponent } from '../../../../shared/components/avatar/avatar.component';
import { BadgeComponent } from '../../../../shared/components/badge/badge.component';
import { PluralKeyPipe } from '../../../../shared/pipes/plural-key.pipe';
import { BlogListItem } from '../../models/blog.models';

/**
 * Blog card (Figma 1589:46006 / 1589:46827): cover with a level badge, title
 * (2 lines), up to two qualification chips + "+N" (one line), excerpt (2 lines),
 * and a footer with the author and the read time (NEW2B-5873 / 5881 / 5887 / 5896).
 */
@Component({
  selector: 'app-blog-card',
  standalone: true,
  imports: [RouterLink, TranslatePipe, AvatarComponent, BadgeComponent, PluralKeyPipe],
  templateUrl: './blog-card.component.html',
  styleUrl: './blog-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlogCardComponent {
  @Input({ required: true }) blog!: BlogListItem;

  /** Chips shown before "+N" (Figma 1589:46827 shows two, then "+2"). */
  protected static readonly TOPICS_SHOWN = 2;

  protected get shownTopics() {
    return this.blog.qualifications.slice(0, BlogCardComponent.TOPICS_SHOWN);
  }

  protected get hiddenTopics(): number {
    return Math.max(0, this.blog.qualifications.length - BlogCardComponent.TOPICS_SHOWN);
  }

  /** The names behind "+N", for its tooltip and accessible name. */
  protected get hiddenTopicNames(): string {
    return this.blog.qualifications.slice(BlogCardComponent.TOPICS_SHOWN).map((t) => t.name).join(', ');
  }

  protected get levelKey(): string | null {
    return this.blog.level ? `feature.blogs.level.${this.blog.level}` : null;
  }
}
