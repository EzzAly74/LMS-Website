export type BlogLevel = 'beginner' | 'intermediate' | 'professional';

export interface BlogAuthor {
  name: string;
  image: string | null;
  is_anonymous: boolean;
}

export interface BlogTopic {
  id: number;
  name: string;
}

/** Job-title option used by the listing "Job Role" filter. */
export interface BlogJobTitle {
  id: number;
  name: string;
}

/** Card shape (from BlogListResource). */
export interface BlogListItem {
  id: number;
  title: string;
  subtitle: string | null;
  slug: string;
  image: string | null;
  level: BlogLevel | null;
  reading_time: number | null;
  qualification: BlogTopic | null;
  author: BlogAuthor;
  added_by: string | null;
  published_at: string | null;
  created_at: string | null;
}

/** One rendered content block (from BlogSectionResource). */
export interface BlogSection {
  id: number;
  title: string;
  image: string | null;
  body: string;
  quote: string | null;
  sort_order: number;
}

export interface BlogAuthorBio {
  name: string;
  image: string | null;
  title: string | null;
}

/** Full reading shape (from BlogResource). */
export interface BlogDetail extends BlogListItem {
  author_user_id: number | null;
  is_anonymous: boolean;
  qualification_skill_id: number | null;
  author_bio: BlogAuthorBio | null;
  sections: BlogSection[];
}

export interface BlogsQuery {
  search?: string | null;
  level?: BlogLevel[] | null;
  job_title_ids?: number[] | null;
  page?: number;
  per_page?: number;
}

/** Listing scope toggle — "Tailored for Me" vs "Explore All". */
export type BlogScope = 'tailored' | 'all';
