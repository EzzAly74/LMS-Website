import { Injectable } from '@angular/core';
import { TranslateLoader, TranslationObject } from '@ngx-translate/core';
import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { AppLanguage } from '../enums/language.enum';

/**
 * Translations loaded as content-hashed build chunks, not fetched by URL.
 *
 * ── Why this replaces TranslateHttpLoader ───────────────────────────────────
 * The HTTP loader fetched `/assets/i18n/<lang>.json`. `outputHashing: "all"`
 * renames JS and CSS on every build, but files under `assets/` are copied
 * verbatim, so that URL never changed. After any deploy that added or renamed
 * a key, a browser still holding the old cached file rendered the new keys as
 * raw strings against the new code - and only a hard refresh cleared it. That
 * was one of the three causes of "translation corrupts and needs a refresh".
 *
 * A dynamic `import()` makes each language its own build chunk with a content
 * hash in its filename. Change a single string and the filename changes, so a
 * stale copy can never be served against new code, and an unchanged file can
 * be cached indefinitely. No server cache headers or version query strings to
 * keep in sync - the build does it.
 *
 * Each language is still loaded lazily and only when used; neither file joins
 * the initial bundle.
 *
 * It also removes the reason the HTTP loader needed `useHttpBackend`: there is
 * no HttpClient here, so no interceptor chain and no circular DI (NG0200).
 *
 * ── Why an explicit map rather than a template-literal import ───────────────
 * `import(`./${lang}.json`)` relies on the bundler expanding a glob. Two
 * languages do not justify that indirection, and the explicit form is
 * type-checked: adding a language to AppLanguage without adding it here is a
 * compile error, not a runtime 404.
 */
const LOADERS: Record<AppLanguage, () => Promise<{ default: TranslationObject }>> = {
  [AppLanguage.En]: () => import('../../../assets/i18n/en.json'),
  [AppLanguage.Ar]: () => import('../../../assets/i18n/ar.json'),
};

@Injectable()
export class BundledTranslateLoader implements TranslateLoader {
  getTranslation(lang: string): Observable<TranslationObject> {
    const load = LOADERS[lang as AppLanguage];

    if (load === undefined) {
      // An unsupported code must fail loudly. Silently returning {} would
      // render every key raw - the exact symptom this loader exists to end.
      throw new Error(`No bundled translations for language "${lang}".`);
    }

    return from(load()).pipe(map((module) => module.default));
  }
}
