import { Injectable, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

const APP_NAME = '2B Academy';

/**
 * Sets the browser title from each route's `title` (a translation key), suffixed
 * with the app name. Routes set `title: 'feature.catalogue.title'` in their data.
 */
@Injectable({ providedIn: 'root' })
export class PageTitleStrategy extends TitleStrategy {
  private readonly title = inject(Title);
  private readonly translate = inject(TranslateService);

  override updateTitle(snapshot: RouterStateSnapshot): void {
    const key = this.buildTitle(snapshot);
    if (!key) {
      this.title.setTitle(APP_NAME);
      return;
    }
    const translated = this.translate.instant(key);
    const label = translated === key ? key : translated;
    this.title.setTitle(`${label} · ${APP_NAME}`);
  }
}
