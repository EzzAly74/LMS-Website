/** Authenticated learner, mirroring the backend UserResource. */
export interface AuthUser {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  system_id: string | null;
  machine_code: string | null;
  department_name: string | null;
  learner_type: string | null;
  roles?: string[];
  created_at: string | null;
}
