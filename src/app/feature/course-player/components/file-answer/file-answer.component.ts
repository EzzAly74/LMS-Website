import { ChangeDetectionStrategy, Component, ElementRef, effect, input, output, signal, viewChild } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

import { FileCardComponent } from '../../../../shared/components/file-card/file-card.component';
import { AssessmentQuestion } from '../../models/course-player.models';

/** Mirrors App\Rules\AssignmentFileRules (D-064); the server re-checks by content. */
export const ANSWER_FILE_EXTENSIONS = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'png', 'jpg', 'jpeg'] as const;
export const ANSWER_FILE_MAX_BYTES = 10 * 1024 * 1024;

export type FileAnswerError = 'type' | 'size' | null;

/**
 * A file question (Figma 2003:79350 empty, 1993:78733 chosen, 2005:80838
 * phone): the instructor's template with Download, an upload card (drop zone
 * + "Select file"), the chosen file with a remove button, and "Submit
 * Assignment". The file is sent only on Submit; the parent owns the request.
 */
@Component({
  selector: 'app-file-answer',
  standalone: true,
  imports: [TranslatePipe, FileCardComponent],
  templateUrl: './file-answer.component.html',
  styleUrl: './file-answer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FileAnswerComponent {
  readonly question = input.required<AssessmentQuestion>();
  readonly busy = input(false);
  /** Server-side rejection text (422), shown under the drop zone. */
  readonly serverError = input<string | null>(null);
  readonly downloadAttachment = output<void>();
  readonly downloadMyFile = output<void>();
  readonly submitFile = output<File>();

  protected readonly accept = ANSWER_FILE_EXTENSIONS.map((e) => '.' + e).join(',');
  /** Product and extension names stay Latin and left-to-right in both languages. */
  protected readonly typesShort = 'PDF, Word, Excel, PowerPoint, PNG, JPG';
  protected readonly extensions = ANSWER_FILE_EXTENSIONS.filter((e) => e !== 'jpeg').map((e) => '.' + e).join(', ');
  protected readonly chosen = signal<File | null>(null);
  protected readonly error = signal<FileAnswerError>(null);
  protected readonly dragging = signal(false);

  private readonly input = viewChild<ElementRef<HTMLInputElement>>('fileInput');

  constructor() {
    // A new question clears the draft.
    effect(() => {
      this.question();
      this.chosen.set(null);
      this.error.set(null);
    }, { allowSignalWrites: true });
  }

  protected pick(): void {
    this.input()?.nativeElement.click();
  }

  protected onInput(event: Event): void {
    const el = event.target as HTMLInputElement;
    this.take(el.files?.[0] ?? null);
    el.value = ''; // choosing the same file again still fires change
  }

  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(true);
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);
    if (this.canChoose()) {
      this.take(event.dataTransfer?.files?.[0] ?? null);
    }
  }

  protected fileDate(file: File): Date | null {
    return file.lastModified ? new Date(file.lastModified) : null;
  }

  protected remove(): void {
    this.chosen.set(null);
    this.error.set(null);
  }

  protected canChoose(): boolean {
    return !this.busy() && this.question().can_replace !== false;
  }

  protected submit(): void {
    const file = this.chosen();
    if (file && !this.busy()) {
      this.submitFile.emit(file);
    }
  }

  private take(file: File | null): void {
    if (!file) {
      return;
    }
    const ext = (file.name.split('.').pop() ?? '').toLowerCase();
    if (!(ANSWER_FILE_EXTENSIONS as readonly string[]).includes(ext)) {
      this.error.set('type');
      return;
    }
    if (file.size > ANSWER_FILE_MAX_BYTES) {
      this.error.set('size');
      return;
    }
    this.error.set(null);
    this.chosen.set(file);
  }
}
