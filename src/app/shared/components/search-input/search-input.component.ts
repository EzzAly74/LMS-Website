import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

/** Debounced search box used in page headers. Emits the trimmed query. */
@Component({
  selector: 'app-search-input',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <label class="search-input">
      <i class="search-input__icon pi pi-search" aria-hidden="true"></i>
      <input
        type="search"
        class="search-input__field"
        [formControl]="control"
        [placeholder]="placeholder"
        [attr.aria-label]="placeholder"
      />
    </label>
  `,
  styleUrl: './search-input.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchInputComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);

  @Input() placeholder = '';
  @Input() debounce = 350;
  /** Initial value (e.g. seeded from a query param on page load). */
  @Input() value = '';
  @Output() search = new EventEmitter<string>();

  protected readonly control = new FormControl('', { nonNullable: true });

  ngOnInit(): void {
    if (this.value) {
      this.control.setValue(this.value, { emitEvent: false });
    }

    this.control.valueChanges
      .pipe(
        debounceTime(this.debounce),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((value) => this.search.emit(value.trim()));
  }
}
