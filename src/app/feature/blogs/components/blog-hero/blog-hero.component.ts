import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

import { AvatarComponent } from '../../../../shared/components/avatar/avatar.component';
import { BlogListItem } from '../../models/blog.models';

/**
 * Featured "Latest in your role" hero card at the top of the blog listing
 * (Figma "HeroCard"): large cover on one side, editorial content on the other.
 */
@Component({
  selector: 'app-blog-hero',
  standalone: true,
  imports: [DatePipe, RouterLink, TranslatePipe, AvatarComponent],
  templateUrl: './blog-hero.component.html',
  styleUrl: './blog-hero.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlogHeroComponent {
  @Input({ required: true }) blog!: BlogListItem;
}
