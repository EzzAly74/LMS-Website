import { Directive, ElementRef, EventEmitter, Output, inject } from '@angular/core';

/**
 * Emits when a click/touch lands outside the host element — closes the
 * profile menu, notification panel, and filter dropdowns.
 */
@Directive({
  selector: '[appClickOutside]',
  standalone: true,
  host: {
    '(document:click)': 'onDocumentClick($event)',
  },
})
export class ClickOutsideDirective {
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  @Output() appClickOutside = new EventEmitter<MouseEvent>();

  protected onDocumentClick(event: MouseEvent): void {
    const target = event.target as Node | null;
    if (target && !this.elementRef.nativeElement.contains(target)) {
      this.appClickOutside.emit(event);
    }
  }
}
