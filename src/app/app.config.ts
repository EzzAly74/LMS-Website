import { provideHttpClient, withInterceptors } from '@angular/common/http';
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
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { MessageService } from 'primeng/api';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeng/themes/aura';

import { routes } from './app.routes';
import { appInitializerFactory } from './core/initializers/app.initializer';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { localeInterceptor } from './core/interceptors/locale.interceptor';
import { PageTitleStrategy } from './core/services/page-title.strategy';
import { AppLanguage, DEFAULT_LANGUAGE } from './core/enums/language.enum';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(
      withInterceptors([authInterceptor, localeInterceptor, errorInterceptor]),
    ),
    provideAnimationsAsync(),
    provideTranslateService({
      fallbackLang: AppLanguage.En,
      lang: DEFAULT_LANGUAGE,
    }),
    // useHttpBackend bypasses the HTTP interceptors for translation files: the
    // i18n fetch must NOT run localeInterceptor (which injects LanguageService ->
    // TranslateService), otherwise the loader creates a circular DI (NG0200).
    provideTranslateHttpLoader({
      prefix: '/assets/i18n/',
      suffix: '.json',
      useHttpBackend: true,
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
