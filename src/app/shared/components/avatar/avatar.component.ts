import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

/** Initials-or-image avatar for instructors and the profile menu. */
@Component({
  selector: 'app-avatar',
  standalone: true,
  template: `
    @if (image) {
      <img class="avatar avatar--img" [src]="image" [alt]="name" [style.--avatar-size]="size + 'px'" />
    } @else {
      <span class="avatar avatar--initials" [style.--avatar-size]="size + 'px'" aria-hidden="true">
        {{ initials }}
      </span>
    }
  `,
  styleUrl: './avatar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AvatarComponent {
  @Input({ required: true }) name = '';
  @Input() image: string | null = null;
  @Input() size = 20;

  protected get initials(): string {
    const parts = this.name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) {
      return '';
    }
    const first = parts[0][0] ?? '';
    const last = parts.length > 1 ? (parts[parts.length - 1][0] ?? '') : '';
    return (first + last).toUpperCase();
  }
}
