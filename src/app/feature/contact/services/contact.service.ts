import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiResponse } from '../../../core/models/api-response.model';
import { ApiService } from '../../../core/services/api.service';
import { ContactInfo, ContactPayload } from '../models/contact.models';

/**
 * Book-a-Demo / Contact Us API. The company contact details are sourced from
 * the backend (.env-driven) — never hardcoded on the client.
 */
@Injectable({ providedIn: 'root' })
export class ContactService {
  private readonly api = inject(ApiService);

  getInfo(): Observable<ApiResponse<ContactInfo>> {
    return this.api.get<ContactInfo>('contact/info');
  }

  submit(payload: ContactPayload): Observable<ApiResponse<{ id: number }>> {
    return this.api.post<{ id: number }>('contact', payload);
  }
}
