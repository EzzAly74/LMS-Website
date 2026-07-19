import { Pipe, PipeTransform } from '@angular/core';

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 1000 * 60 * 60 * 24 * 365],
  ['month', 1000 * 60 * 60 * 24 * 30],
  ['week', 1000 * 60 * 60 * 24 * 7],
  ['day', 1000 * 60 * 60 * 24],
  ['hour', 1000 * 60 * 60],
  ['minute', 1000 * 60],
];

/** Formats notification/activity timestamps as "2 hours ago", locale-aware. */
@Pipe({
  name: 'relativeDate',
  standalone: true,
  pure: true,
})
export class RelativeDatePipe implements PipeTransform {
  transform(value: string | Date | null | undefined, locale = 'en'): string {
    if (!value) {
      return '';
    }
    const date = value instanceof Date ? value : new Date(value.replace(' ', 'T'));
    if (Number.isNaN(date.getTime())) {
      return '';
    }

    const diffMs = date.getTime() - Date.now();
    const formatter = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

    for (const [unit, ms] of UNITS) {
      const diff = Math.round(diffMs / ms);
      if (Math.abs(diff) >= 1) {
        return formatter.format(diff, unit);
      }
    }
    return formatter.format(0, 'minute');
  }
}
