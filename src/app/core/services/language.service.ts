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

  /** The language a switch is in flight to, or null when settled. */
  private requested: AppLanguage | null = null;

  /**
   * Called once at bootstrap to apply the persisted/initial language.
   * Returns the translation-load observable so startup can await it.
   */
  init(): Observable<unknown> {
    return this.apply(this._current());
  }

  /**
   * Switch language, committing only once the new translations are loaded.
   *
   * This used to flip `<html dir>` and the `current` signal immediately and
   * discard the load. Switching to a language not yet loaded therefore
   * rendered one direction with the other language's text, and anything
   * derived from `current` via `translate.instant()` re-evaluated against the
   * OLD translations and kept the wrong string. That was the Website's half of
   * "translation corrupts and needs a refresh".
   *
   * Now the direction, the signal and the persisted choice change together, in
   * the same tick the translations become available - so the UI flips in one
   * frame with text and layout consistent.
   *
   * Rapid toggling is safe: only the most recent request commits. That mirrors
   * ngx-translate's own `lastUseLanguage` guard, which already discards
   * late-arriving loads from superseded calls.
   */
  use(lang: AppLanguage): void {
    if (lang === this._current() && this.requested === null) {
      return;
    }

    this.requested = lang;

    this.translate.use(lang).subscribe({
      next: () => {
        if (this.requested !== lang) {
          return; // superseded by a later switch
        }
        this.requested = null;
        this.applyDocument(lang);
        this._current.set(lang);
        localStorage.setItem(STORAGE_KEY, lang);
      },
      error: () => {
        // Leave the UI in the language it was already correctly showing,
        // rather than half-switched into one whose strings never arrived.
        if (this.requested === lang) {
          this.requested = null;
        }
      },
    });
  }

  toggle(): void {
    this.use(this._current() === AppLanguage.En ? AppLanguage.Ar : AppLanguage.En);
  }

  private apply(lang: AppLanguage): Observable<unknown> {
    this.applyDocument(lang);
    return this.translate.use(lang);
  }

  private applyDocument(lang: AppLanguage): void {
    const html = this.document.documentElement;
    html.lang = lang;
    html.dir = isRtlLanguage(lang) ? 'rtl' : 'ltr';
  }

  private readInitial(): AppLanguage {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === AppLanguage.Ar || stored === AppLanguage.En ? stored : DEFAULT_LANGUAGE;
  }
}
