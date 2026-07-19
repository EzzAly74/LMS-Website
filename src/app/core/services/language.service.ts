import { DOCUMENT } from '@angular/common';
import { Injectable, computed, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';

import { AppLanguage, DEFAULT_LANGUAGE, isRtlLanguage } from '../enums/language.enum';

const STORAGE_KEY = 'nas.lang';

/**
 * Owns the active UI language and keeps the document in sync (lang + dir).
 * RTL (Arabic) is first-class: switching to Arabic flips direction and the
 * Almarai font applies via the [dir="rtl"] rule in styles.scss.
 */
@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly translate = inject(TranslateService);
  private readonly document = inject(DOCUMENT);

  private readonly _current = signal<AppLanguage>(this.readInitial());
  readonly current = this._current.asReadonly();
  readonly isRtl = computed(() => isRtlLanguage(this._current()));

  /**
   * Called once at bootstrap to apply the persisted/initial language.
   * Returns the translation-load observable so startup can await it.
   */
  init(): Observable<unknown> {
    return this.apply(this._current());
  }

  use(lang: AppLanguage): void {
    if (lang === this._current()) {
      return;
    }
    this.apply(lang);
    this._current.set(lang);
    localStorage.setItem(STORAGE_KEY, lang);
  }

  toggle(): void {
    this.use(this._current() === AppLanguage.En ? AppLanguage.Ar : AppLanguage.En);
  }

  private apply(lang: AppLanguage): Observable<unknown> {
    const html = this.document.documentElement;
    html.lang = lang;
    html.dir = isRtlLanguage(lang) ? 'rtl' : 'ltr';
    return this.translate.use(lang);
  }

  private readInitial(): AppLanguage {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === AppLanguage.Ar || stored === AppLanguage.En ? stored : DEFAULT_LANGUAGE;
  }
}
