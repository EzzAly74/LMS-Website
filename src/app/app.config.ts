import { registerLocaleData } from '@angular/common';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import localeAr from '@angular/common/locales/ar';
import {
  APP_INITIALIZER,
  ApplicationConfig,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import {
  TitleStrategy,
  provideRouter,
  withComponentInputBinding,
} from '@angular/router';
import { provideTranslateLoader, provideTranslateService } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeng/themes/aura';

import { routes } from './app.routes';
import { BundledTranslateLoader } from './core/i18n/bundled-translate.loader';
import { appInitializerFactory } from './core/initializers/app.initializer';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { localeInterceptor } from './core/interceptors/locale.interceptor';
import { PageTitleStrategy } from './core/services/page-title.strategy';
import { AppLanguage, DEFAULT_LANGUAGE } from './core/enums/language.enum';

// DatePipe throws if a locale hasn't been registered — 'en' ships with the
// framework, but 'ar' (passed explicitly wherever the UI shows dates) needs
// this so weekday/month names actually render in Arabic instead of erroring.
registerLocaleData(localeAr, AppLanguage.Ar);

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(
      withInterceptors([authInterceptor, localeInterceptor, errorInterceptor]),
    ),
    provideAnimationsAsync(),
    provideTranslateService({
      // Translations ship as content-hashed build chunks, so a deploy can
      // never serve a stale cached file against new code. This replaces the
      // HTTP loader, which fetched a fixed /assets/i18n/<lang>.json URL that
      // the build never renamed. See BundledTranslateLoader.
      loader: provideTranslateLoader(BundledTranslateLoader),
      fallbackLang: AppLanguage.En,
      lang: DEFAULT_LANGUAGE,
    }),
    providePrimeNG({ theme: { preset: Aura } }),
    MessageService,
    { provide: TitleStrategy, useClass: PageTitleStrategy },
    {
      provide: APP_INITIALIZER,
      useFactory: appInitializerFactory,
      multi: true,
    },
  ],
};
