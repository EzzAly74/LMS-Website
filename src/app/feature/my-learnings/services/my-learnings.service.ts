import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiResponse } from '../../../core/models/api-response.model';
import { ApiService } from '../../../core/services/api.service';
import { ActiveCourse } from '../models/my-learnings.models';

/** My Learnings dashboard API access — GET my/learnings (learner-facing composite). */
@Injectable({ providedIn: 'root' })
export class MyLearningsService {
  private readonly api = inject(ApiService);

  getActiveCourses(): Observable<ApiResponse<ActiveCourse[]>> {
    return this.api.get<ActiveCourse[]>('my/learnings');
  }
}
