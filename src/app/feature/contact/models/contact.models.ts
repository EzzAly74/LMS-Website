/** Public "for quick contact" details (from GET /contact/info, .env-driven). */
export interface ContactInfo {
  email: string | null;
  phone: string | null;
}

/** Book-a-Demo submission payload (POST /contact). */
export interface ContactPayload {
  name: string;
  email: string;
  phone?: string | null;
  job_title: string;
  company_name: string;
  guests?: string[];
}
