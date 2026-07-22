/**
 * Central route path constants. Use these instead of magic route strings in
 * links, guards, and navigation calls.
 */
export const LmsRoutes = {
  Login: 'login',
  Catalogue: 'catalogue',
  CourseDetail: 'catalogue/:id',
  MyLearnings: 'my-learnings',
  WhoWeAre: 'who-we-are',
  RequestDemo: 'request-demo',
  Blogs: 'blogs',
  Profile: 'profile',
} as const;

export type LmsRoute = (typeof LmsRoutes)[keyof typeof LmsRoutes];
