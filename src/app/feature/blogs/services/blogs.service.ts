import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiResponse } from '../../../core/models/api-response.model';
import { ApiService } from '../../../core/services/api.service';
import { removeNullFilterProperties } from '../../../shared/utils/remove-null-filter-properties';
import { BlogDetail, BlogJobTitle, BlogListItem, BlogScope, BlogsQuery } from '../models/blog.models';

/**
 * Public blog API. Reads the SEO-facing endpoints (`/api/v1/blogs`); the
 * "Tailored for Me" scope hits the authenticated `/api/v1/learner/blogs`,
 * which filters by the signed-in learner's job-title qualifications.
 */
@Injectable({ providedIn: 'root' })
export class BlogsService {
  private readonly api = inject(ApiService);

  getBlogs(query: BlogsQuery, scope: BlogScope = 'all'): Observable<ApiResponse<BlogListItem[]>> {
    const path = scope === 'tailored' ? 'learner/blogs' : 'blogs';
    return this.api.get<BlogListItem[]>(path, {
      params: removeNullFilterProperties({ ...query }),
    });
  }

  getBlog(slug: string): Observable<ApiResponse<BlogDetail>> {
    return this.api.get<BlogDetail>(`blogs/${slug}`);
  }

  getRelated(slug: string): Observable<ApiResponse<BlogListItem[]>> {
    return this.api.get<BlogListItem[]>(`blogs/${slug}/related`);
  }

  /**
   * Job titles for the "Job Role" filter (public lookup). Each qualification a
   * blog links to is mapped to one or more job titles, so learners filter by
   * the roles they recognise rather than raw qualifications.
   */
  getJobTitles(): Observable<ApiResponse<BlogJobTitle[]>> {
    return this.api.get<BlogJobTitle[]>('blogs/job-titles');
  }
}
