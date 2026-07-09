import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Loading placeholder matching the course-card shape. */
@Component({
  selector: 'app-card-skeleton',
  standalone: true,
  template: `
    <div class="card-skeleton" aria-hidden="true">
      <div class="card-skeleton__media"></div>
      <div class="card-skeleton__body">
        <span class="card-skeleton__line card-skeleton__line--title"></span>
        <span class="card-skeleton__line card-skeleton__line--sm"></span>
        <span class="card-skeleton__line card-skeleton__line--sm"></span>
        <div class="card-skeleton__footer">
          <span class="card-skeleton__line card-skeleton__line--date"></span>
          <span class="card-skeleton__line card-skeleton__line--cta"></span>
        </div>
      </div>
    </div>
  `,
  styles: `
    .card-skeleton {
      display: flex;
      flex-direction: column;
      overflow: hidden;
      border: var(--stroke-width-default) solid var(--color-neutral-400);
      border-radius: var(--radius-container-md);
      background: var(--color-essential-primary);
    }
    .card-skeleton__media {
      height: 150px;
      background: var(--color-neutral-300);
    }
    .card-skeleton__body {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-15xs);
      padding: var(--spacing-13xs);
    }
    .card-skeleton__line {
      height: var(--spacing-13xs);
      border-radius: var(--radius-control-xs);
      background: var(--color-neutral-300);
    }
    .card-skeleton__line--title { width: 80%; height: var(--spacing-11xs); }
    .card-skeleton__line--sm { width: 60%; }
    .card-skeleton__footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: var(--spacing-16xs);
    }
    .card-skeleton__line--date { width: 35%; }
    .card-skeleton__line--cta { width: 30%; height: var(--size-32); }
    .card-skeleton__media,
    .card-skeleton__line {
      animation: card-skeleton-pulse 1.4s ease-in-out infinite;
    }
    @keyframes card-skeleton-pulse {
      50% { opacity: var(--opacity-40); }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardSkeletonComponent {}
