/** Course detail payload (GET learner/academy/courses/{id}) for the Website specs. */

export const session = (id: number, date: string, from: string, to: string, minutes: number, location: string | null, status: 'completed' | 'upcoming') => ({
  id, title: `S${id}`, session_date: date, time_from: from, time_to: to, location, duration_minutes: minutes, status,
});

export const sessions = [
  session(1, '2026-06-12', '09:00:00', '11:30:00', 150, 'Hybrid · HQ Auditorium', 'completed'),
  session(2, '2026-06-14', '13:00:00', '15:30:00', 150, 'Virtual', 'completed'),
  session(3, '2026-06-19', '10:00:00', '12:30:00', 150, 'Hybrid · Room 4B', 'upcoming'),
  session(4, '2026-06-26', '09:00:00', '11:30:00', 150, null, 'upcoming'),
  session(5, '2026-06-30', '11:00:00', '13:00:00', 120, 'Hybrid · HQ Auditorium', 'upcoming'),
];

export function course(withSessions = true) {
  return {
    id: 6, title: 'Leadership Fundamentals for NAS Teams', description: '<p>Build the core skills of modern leadership.</p>',
    course_type: 'online', level: 'beginner', duration_weeks: 4, image: null, hours: 12, has_certificate: true,
    allow_attendance: true, category: null,
    instructors: [{ id: 1, name: 'Sara Al-Mansouri', image: null, bio: null }],
    qualifications: [{ id: 1, name: 'Team Leadership' }],
    rating: { avg: 4.8, count: 243, sentiment: 'positive' }, enrolled_users_count: 856, units: [],
    cohorts: [],
    anchor_cohort: {
      id: 20, name: 'First Group', effective_status: 'open_for_enrollment', start_date: '2026-08-10', end_date: '2026-09-07',
      capacity: 40, enrolled_count: 32, seats_left: 8, is_full: false, enrolment_closes_at: null,
      days_until_deadline: null, deadline_severity: 'none', sessions: withSessions ? sessions : [],
    },
    cta: { state: 'enrol_now', label_key: 'enrol_now', enabled: true },
    what_students_will_learn: { en: [], ar: [] }, requirements: { en: [], ar: [] },
  };
}
