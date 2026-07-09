export enum AppLanguage {
  En = 'en',
  Ar = 'ar',
}

export const DEFAULT_LANGUAGE = AppLanguage.En;

/** Languages that render right-to-left. */
export const RTL_LANGUAGES: readonly AppLanguage[] = [AppLanguage.Ar];

export function isRtlLanguage(lang: AppLanguage): boolean {
  return RTL_LANGUAGES.includes(lang);
}
