import { Page, Route } from '@playwright/test';

/** The dev API base the Website calls (src/environments/environment.ts). */
export const API = 'http://127.0.0.1:8000/api/v1/';

export type Lang = 'en' | 'ar';

/** A handler returns the `result` for a path, or undefined to fall through. */
export type MockHandler = (path: string, route: Route) => unknown | undefined;

const learner = {
  id: 9001, name: 'E2E Learner', email: 'learner@example.test', phone: null, system_id: null,
  machine_code: null, department_name: null, learner_type: null, roles: ['User'], created_at: null,
};

/**
 * Mocks every API call. `handlers` answer the calls a spec cares about; the
 * signed-in learner comes from a fake token + auth/user/me; anything else gets
 * an empty success so the shell (notifications, messages) renders quietly.
 */
export async function mockApi(page: Page, lang: Lang, handlers: MockHandler[], signedIn = true): Promise<void> {
  await page.addInitScript(([l, s]) => {
    localStorage.setItem('nas.lang', l as string);
    if (s) {
      localStorage.setItem('nas.token', 'e2e-fake-token');
    } else {
      localStorage.removeItem('nas.token');
    }
  }, [lang, signedIn] as const);

  await page.route(`${API}**`, async (route) => {
    const path = route.request().url().slice(API.length).split('?')[0];
    for (const h of handlers) {
      const result = h(path, route);
      if (result !== undefined) {
        return route.fulfill({ json: { status: 'success', message: '', result } });
      }
    }
    if (path === 'auth/user/me' && signedIn) {
      return route.fulfill({ json: { status: 'success', message: '', result: learner } });
    }
    return route.fulfill({ json: { status: 'success', message: '', result: [], meta: { current_page: 1, last_page: 1, per_page: 15, total: 0 } } });
  });

  // Realtime (pusher) is not under test.
  await page.routeWebSocket(/.*/, () => undefined);
}

/** No horizontal page scroll at the viewport width. */
export async function pageOverflowX(page: Page): Promise<number> {
  return page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
}
