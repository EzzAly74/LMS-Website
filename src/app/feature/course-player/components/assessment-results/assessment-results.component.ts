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
  @Input() courseTitle = '';

  protected stateIcon(state: 'correct' | 'incorrect' | 'pending'): string {
    switch (state) {
      case 'correct':
        return 'pi-check-circle';
      case 'incorrect':
        return 'pi-times-circle';
      default:
        return 'pi-circle';
    }
  }

  protected answerLabel(answer: { value?: string; order?: string[] } | null): string | null {
    if (!answer) {
      return null;
    }
    return answer.value ?? null;
  }
}
