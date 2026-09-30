import {
  AfterViewInit, ChangeDetectionStrategy, Component, Directive, ElementRef, OnDestroy, computed, inject, input,
} from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { PrimeTemplate } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { LanguageService } from '../../../core/services/language.service';

const reducedMotion = (): boolean =>
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * The countdown line under a toast. PrimeNG stops a toast's timer while the
 * pointer is on it and restarts the full life when it leaves, so the line
 * pauses on hover and starts again on leave. Hidden with reduced motion.
 */
@Directive({ selector: '[appToastProgress]', standalone: true })
export class ToastProgressDirective implements AfterViewInit, OnDestroy {
  readonly life = input.required<number>({ alias: 'appToastProgress' });

  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  private animation: Animation | null = null;
  private card: HTMLElement | null = null;

  private readonly pause = (): void => this.animation?.pause();
  private readonly restart = (): void => this.start();

  ngAfterViewInit(): void {
    if (reducedMotion() || typeof this.el.nativeElement.animate !== 'function') return;
    this.card = this.el.nativeElement.closest('.p-toast-message');
    this.card?.addEventListener('mouseenter', this.pause);
    this.card?.addEventListener('mouseleave', this.restart);
    this.start();
  }

  ngOnDestroy(): void {
    this.card?.removeEventListener('mouseenter', this.pause);
    this.card?.removeEventListener('mouseleave', this.restart);
    this.animation?.cancel();
  }

  private start(): void {
    this.animation?.cancel();
    this.animation = this.el.nativeElement.animate(
      [{ transform: 'scaleX(1)' }, { transform: 'scaleX(0)' }],
      { duration: this.life(), easing: 'linear', fill: 'forwards' },
    );
  }
}

/**
 * The app's only toast outlet (D-072), placed once in the root component and
 * fed by NotificationService: at the top on the reading end (right in
 * English, left in Arabic), full width on phones, with the severity's
 * colour, icon, title, message, a dismiss button and the countdown line.
 * A toast identical to one on screen is not repeated.
 */
@Component({
  selector: 'app-toaster',
  standalone: true,
  imports: [ToastModule, PrimeTemplate, TranslatePipe, ToastProgressDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-toast
      styleClass="app-toaster"
      [position]="position()"
      [preventOpenDuplicates]="true"
      [autoZIndex]="false"
      [breakpoints]="breakpoints"
      [showTransformOptions]="motion.showTransform"
      [hideTransformOptions]="motion.hideTransform"
      [showTransitionOptions]="motion.show"
      [hideTransitionOptions]="motion.hide">
      <ng-template pTemplate="headless" let-message let-closeFn="closeFn">
        <div class="tst tst--{{ message.severity }}">
          <span class="tst__icon" aria-hidden="true">
            <span class="tst__glyph tst__glyph--{{ message.severity }}"></span>
          </span>
          <div class="tst__text">
            @if (message.summary) { <p class="tst__title">{{ message.summary }}</p> }
            @if (message.detail) { <p class="tst__detail">{{ message.detail }}</p> }
          </div>
          @if (message.closable !== false) {
            <button type="button" class="tst__close" [attr.aria-label]="'core.toast.close' | translate" (click)="closeFn($event)">
              <span class="tst__glyph tst__glyph--close" aria-hidden="true"></span>
            </button>
          }
          @if (!message.sticky) {
            <span class="tst__progress" aria-hidden="true" [appToastProgress]="message.life ?? 3000"></span>
          }
        </div>
      </ng-template>
    </p-toast>
  `,
  styleUrl: './toaster.component.scss',
})
export class ToasterComponent {
  private readonly language = inject(LanguageService);

  /** Top, on the reading end. */
  readonly position = computed(() => (this.language.isRtl() ? 'top-left' : 'top-right'));

  /** Phones: the stack spans the screen inside the 16 px gutter. */
  readonly breakpoints = { '560px': { width: 'calc(100vw - 32px)', left: '16px', right: '16px' } };

  /** In from just above and slightly small, out by shrinking; a plain fade when motion is reduced. */
  readonly motion = reducedMotion()
    ? { showTransform: 'none', hideTransform: 'none', show: '120ms linear', hide: '120ms linear' }
    : {
        showTransform: 'translate3d(0, -12px, 0) scale(0.96)',
        hideTransform: 'scale(0.94)',
        show: '380ms cubic-bezier(0.16, 1, 0.3, 1)',
        hide: '220ms cubic-bezier(0.4, 0, 1, 1)',
      };
}
