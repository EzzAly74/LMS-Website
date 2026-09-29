import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { FileCardComponent } from '../../../../shared/components/file-card/file-card.component';
import { AssessmentResults } from '../../models/course-player.models';
import { ANSWER_FILE_EXTENSIONS, ANSWER_FILE_MAX_BYTES } from '../file-answer/file-answer.component';

/**
 * Score ring + per-question review, shared by Quiz and Assignment results
 * (only the title/type label differs) — matches Figma 1047-63046, 933-46695,
 * 1207-19636, 1049-19229.
 */
@Component({
  selector: 'app-assessment-results',
  standalone: true,
  imports: [TranslatePipe, FileCardComponent],
  templateUrl: './assessment-results.component.html',
  styleUrl: './assessment-results.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssessmentResultsComponent {
  @Input({ required: true }) results!: AssessmentResults;
  @Input() assessmentTypeLabel = '';
  /** Quiz or Assignment tag (both orange in the 2027:97785 frames, FG-48). */
  @Input() assessmentKind: 'quiz' | 'assignment' | null = null;
  /** Shown above the score on phones ("Review Results", 2005:80895). */
  @Input() courseTitle: string | null = null;
  /** The question whose file is being downloaded or replaced. */
  @Input() busyQuestionId: number | null = null;
  @Input() replaceError: { questionId: number; message: string } | null = null;
  @Output() downloadMyFile = new EventEmitter<number>();
  @Output() replaceFile = new EventEmitter<{ questionId: number; file: File }>();

  private readonly translate = inject(TranslateService);
  /** A file rejected before upload (type / size). */
  protected readonly clientError = signal<{ questionId: number; message: string } | null>(null);
  protected readonly accept = ANSWER_FILE_EXTENSIONS.map((e) => '.' + e).join(',');

  /** Any answer still awaiting a person's score: no final score yet. */
  protected pending(): boolean {
    return this.results.answers.some((a) => a.state === 'pending');
  }

  protected onReplace(questionId: number, event: Event): void {
    const el = event.target as HTMLInputElement;
    const file = el.files?.[0] ?? null;
    el.value = '';
    if (!file) {
      return;
    }
    const ext = (file.name.split('.').pop() ?? '').toLowerCase();
    const problem = !(ANSWER_FILE_EXTENSIONS as readonly string[]).includes(ext) ? 'type' : file.size > ANSWER_FILE_MAX_BYTES ? 'size' : null;
    if (problem) {
      this.clientError.set({ questionId, message: this.translate.instant('feature.course_player.file.error_' + problem) });
      return;
    }
    this.clientError.set(null);
    this.replaceFile.emit({ questionId, file });
  }

  protected answerLabel(answer: { value?: string; order?: string[] } | null): string | null {
    if (!answer) {
      return null;
    }
    return answer.value ?? null;
  }

  /** Zero-padded question number — Figma shows "Q01"/"Q02", not "Q1". */
  protected questionNumber(position: number): string {
    return `Q${String(position).padStart(2, '0')}`;
  }
}
