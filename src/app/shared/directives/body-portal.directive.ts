import { DOCUMENT } from '@angular/common';
import { Directive, ElementRef, OnDestroy, OnInit, inject } from '@angular/core';

/**
 * Relocates the host element to the end of `<body>` for the lifetime of the
 * view, then removes it on destroy.
 *
 * Overlays (modals, bottom sheets) are declared deep inside a feature's
 * template for authoring convenience, but any ancestor that establishes a
 * stacking context (a transform, a filter, or an injected `z-index`) traps a
 * `position: fixed` overlay beneath sibling content no matter how high its own
 * `z-index` is. Hoisting the node to the body lifts it into the root stacking
 * context — and, being the last element in the document, it wins z-index ties
 * against page content. Angular's renderer removes nodes via `node.remove()`
 * (ignoring the original parent), so this relocation is safe across view
 * destruction; component data-binding and event listeners keep working because
 * Angular tracks the logical view, not the node's DOM position.
 */
@Directive({
  selector: '[appBodyPortal]',
  standalone: true,
})
export class BodyPortalDirective implements OnInit, OnDestroy {
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly document = inject(DOCUMENT);

  ngOnInit(): void {
    this.document.body.appendChild(this.el.nativeElement);
  }

  ngOnDestroy(): void {
    this.el.nativeElement.remove();
  }
}
