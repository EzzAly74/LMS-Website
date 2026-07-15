import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

import { AvatarComponent } from '../../../../shared/components/avatar/avatar.component';
import { BadgeComponent } from '../../../../shared/components/badge/badge.component';
import { BlogListItem } from '../../models/blog.models';

/**
 * Blog card for the listing grid (Figma "BlogCard"): cover with a level badge,
 * title, topic chip, excerpt, and a footer with the author + read time.
 */
@Component({
  selector: 'app-blog-card',
  standalone: true,
  imports: [RouterLink, TranslatePipe, AvatarComponent, BadgeComponent],
  templateUrl: './blog-card.component.html',
  styleUrl: './blog-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlogCardComponent {
  @Input({ required: true }) blog!: BlogListItem;

  protected get levelKey(): string | null {
    return this.blog.level ? `feature.blogs.level.${this.blog.level}` : null;
  }
}
