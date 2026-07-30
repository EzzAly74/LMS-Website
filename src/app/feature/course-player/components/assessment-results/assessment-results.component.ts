import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

import { AssessmentResults } from '../../models/course-player.models';

/**
 * Score ring + per-question review, shared by Quiz and Assignment results
 * (only the title/type label differs) — matches Figma 1047-63046, 933-46695,
 * 1207-19636, 1049-19229.
 */
@Component({
  selector: 'app-assessment-results',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './assessment-results.component.html',
  styleUrl: './assessment-results.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssessmentResultsComponent {
  @Input({ required: true }) results!: AssessmentResults;
  @Input() assessmentTypeLabel = '';
  /** Figma colours the type tag orange for Quiz, purple for Assignment. */
  @Input() assessmentKind: 'quiz' | 'assignment' | null = null;

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
