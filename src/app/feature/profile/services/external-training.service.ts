import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { ApiResponse } from '../../../core/models/api-response.model';
import { ApiService } from '../../../core/services/api.service';
import { ExternalTrainingFields, ExternalTrainingRequest } from '../models/profile.models';

/**
 * The learner's External Training requests (learner/external-training, D-057).
 * The API scopes every call to the signed-in learner.
 */
@Injectable({ providedIn: 'root' })
export class ExternalTrainingService {
  private readonly api = inject(ApiService);
  private readonly base = 'learner/external-training';

  list(): Observable<ExternalTrainingRequest[]> {
    return this.api.get<ExternalTrainingRequest[]>(this.base).pipe(map((r) => r.result ?? []));
  }

  get(id: number): Observable<ExternalTrainingRequest> {
    return this.api.get<ExternalTrainingRequest>(`${this.base}/${id}`).pipe(map(required));
  }

  /** Create, or with an id edit a pending request. The certificate is optional on edit. */
  save(fields: ExternalTrainingFields, certificate: File | null, id?: number): Observable<ExternalTrainingRequest> {
    const body = new FormData();
    body.append('title', fields.title);
    body.append('provider', fields.provider);
    body.append('start_date', fields.start_date);
    body.append('end_date', fields.end_date);
    body.append('hours', String(fields.hours));
    if (fields.cost !== null) body.append('cost', String(fields.cost));
    if (certificate) body.append('certificate', certificate, certificate.name);
    return this.api.post<ExternalTrainingRequest>(id ? `${this.base}/${id}` : this.base, body).pipe(map(required));
  }

  withdraw(id: number): Observable<void> {
    return this.api.delete<null>(`${this.base}/${id}`).pipe(map(() => undefined));
  }

  certificate(id: number): Observable<Blob> {
    return this.api.getBlob(`${this.base}/${id}/certificate`);
  }
}

/** A success response that carries no record is a broken contract, not an empty one. */
function required<T>(r: ApiResponse<T>): T {
  if (r.result === undefined || r.result === null) {
    throw new Error('The response carried no result.');
  }
  return r.result;
}
