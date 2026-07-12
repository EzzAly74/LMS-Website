import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

import { CourseLecture } from '../../models/course-player.models';

/**
 * Renders the active lecture's content (video/document/article/external-link)
 * plus its completion prompt. One component, content_type-driven — matches
 * Figma nodes 900-45179/45363/45585 and 907-45837.
 */
@Component({
  selector: 'app-lesson-viewer',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './lesson-viewer.component.html',
  styleUrl: './lesson-viewer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LessonViewerComponent {
  @Input({ required: true }) lecture!: CourseLecture;
  @Output() confirmCompletion = new EventEmitter<boolean>();
  @Output() markComplete = new EventEmitter<void>();

  protected get contentTypeKey(): string {
    return `feature.course_player.content_type.${this.lecture.content_type}`;
  }

  protected get completionQuestionKey(): string {
    switch (this.lecture.content_type) {
      case 'video':
        return 'feature.course_player.completion.video_question';
      case 'document':
        return 'feature.course_player.completion.document_question';
      case 'article':
        return 'feature.course_player.completion.article_question';
      default:
        return 'feature.course_player.completion.link_question';
    }
  }

  protected onYes(): void {
    this.confirmCompletion.emit(true);
  }

  protected onNo(): void {
    this.confirmCompletion.emit(false);
  }

  protected onMarkComplete(): void {
    this.markComplete.emit();
  }

  protected onVisitLink(): void {
    if (this.lecture.content_url) {
      window.open(this.lecture.content_url, '_blank', 'noopener');
    }
  }
}
