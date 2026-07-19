import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';

import { AnswerFeedback, AssessmentQuestion, SubmittedAnswer } from '../../models/course-player.models';

const DEFAULT_CHAR_LIMIT = 500;
const YES_NO_FALLBACK_OPTIONS = ['True', 'False'];

/**
 * Renders the current question (MCQ / Yes-No / Short answer / Reorder) with
 * its default/answered/correct/incorrect states. mcq and yes_no are both
 * "choice" questions server-side (a string `value` matched case-insensitively
 * against the configured correct answer) — this component treats them
 * identically, falling back to True/False only if a yes_no question has no
 * authored `options` array.
 *
 * One question per view — the parent owns question navigation, running
 * score, and API calls; this component only owns the current question's
 * input draft and emits the submitted answer.
 */
@Component({
  selector: 'app-quiz-runner',
  standalone: true,
  imports: [FormsModule, TranslatePipe],
  templateUrl: './quiz-runner.component.html',
  styleUrl: './quiz-runner.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuizRunnerComponent implements OnChanges {
  @Input({ required: true }) question!: AssessmentQuestion;
  @Input() feedback: AnswerFeedback | null = null;
  @Input() isLastQuestion = false;
  @Input() assessmentTypeLabel = '';
  @Output() submit = new EventEmitter<SubmittedAnswer>();
  @Output() next = new EventEmitter<void>();
  @Output() finish = new EventEmitter<void>();

  protected readonly selectedValue = signal<string | null>(null);
  protected readonly openText = signal('');
  protected readonly reorderItems = signal<string[]>([]);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['question']) {
      const q = this.question;
      this.selectedValue.set(q?.my_answer?.value ?? null);
      this.openText.set(q?.my_answer?.value ?? '');
      this.reorderItems.set(q?.my_answer?.order ?? q?.options ?? []);
    }
  }

  protected get charLimit(): number {
    return DEFAULT_CHAR_LIMIT;
  }

  protected get answered(): boolean {
    return (this.question?.is_answered ?? false) || this.feedback !== null;
  }

  protected get choiceOptions(): string[] {
    if (this.question.options?.length) {
      return this.question.options;
    }
    return this.question.type === 'yes_no' ? YES_NO_FALLBACK_OPTIONS : [];
  }

  protected get canSubmit(): boolean {
    switch (this.question.type) {
      case 'mcq':
      case 'yes_no':
        return this.selectedValue() !== null;
      case 'open':
        return this.openText().trim().length > 0;
      case 'reorder':
        return true;
    }
  }

  protected optionState(option: string): 'correct' | 'incorrect' | 'neutral' {
    if (!this.feedback) {
      return 'neutral';
    }
    const correct = this.feedback.correct_answer;
    const isCorrectOption = typeof correct === 'string' && correct.toLowerCase() === option.toLowerCase();
    if (isCorrectOption) {
      return 'correct';
    }
    if (this.selectedValue()?.toLowerCase() === option.toLowerCase() && !this.feedback.is_correct) {
      return 'incorrect';
    }
    return 'neutral';
  }

  protected selectOption(value: string): void {
    if (!this.answered) {
      this.selectedValue.set(value);
    }
  }

  protected moveUp(index: number): void {
    if (this.answered || index <= 0) {
      return;
    }
    const items = [...this.reorderItems()];
    [items[index - 1], items[index]] = [items[index], items[index - 1]];
    this.reorderItems.set(items);
  }

  protected moveDown(index: number): void {
    const items = this.reorderItems();
    if (this.answered || index >= items.length - 1) {
      return;
    }
    const next = [...items];
    [next[index], next[index + 1]] = [next[index + 1], next[index]];
    this.reorderItems.set(next);
  }

  protected onSubmit(): void {
    if (!this.canSubmit || this.answered) {
      return;
    }
    switch (this.question.type) {
      case 'mcq':
      case 'yes_no':
        this.submit.emit({ value: this.selectedValue()! });
        break;
      case 'open':
        this.submit.emit({ value: this.openText().trim() });
        break;
      case 'reorder':
        this.submit.emit({ order: this.reorderItems() });
        break;
    }
  }

  protected onContinue(): void {
    if (this.isLastQuestion) {
      this.finish.emit();
    } else {
      this.next.emit();
    }
  }
}
