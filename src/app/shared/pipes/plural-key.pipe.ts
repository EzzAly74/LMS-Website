import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import { LanguageService } from '../../core/services/language.service';

const rulesByLang = new Map<string, Intl.PluralRules>();

/**
 * The translation key for a count in the current language: `<key>_<category>`
 * when that form exists (Intl.PluralRules: English one / other; Arabic zero,
 * one, two, few, many, other), otherwise `<key>` itself. ngx-translate has no
 * plural support, so "1 weeks" / "3 أسبوع" came from one string per count.
 *
 *   {{ 'feature.x.weeks' | pluralKey: n | translate: { count: n } }}
 *
 * Impure so it follows a language switch; the work is one cached lookup.
 */
@Pipe({ name: 'pluralKey', standalone: true, pure: false })
export class PluralKeyPipe implements PipeTransform {
  private readonly translate = inject(TranslateService);
  private readonly language = inject(LanguageService);

  transform(key: string, count: number | null | undefined): string {
    const lang = this.language.current();
    let rules = rulesByLang.get(lang);
    if (!rules) {
      rules = new Intl.PluralRules(lang);
      rulesByLang.set(lang, rules);
    }
    const form = `${key}_${rules.select(count ?? 0)}`;
    return this.translate.instant(form) !== form ? form : key;
  }
}
