/*
  # Add performance indexes

  1. New Indexes
    - Clients: created_at, referrer_id, created_by_user_id
    - Client tags assignments: client_id, tag_id
    - Appointments: client_id, appointment_date

  2. Performance Impact
    - Improves query performance for filtered lists
*/

CREATE INDEX IF NOT EXISTS idx_clients_created_at ON clients(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_clients_referrer_id ON clients(referrer_id);
CREATE INDEX IF NOT EXISTS idx_clients_created_by_user_id ON clients(created_by_user_id);

CREATE INDEX IF NOT EXISTS idx_client_tags_assignments_client_id ON client_tags_assignments(client_id);
CREATE INDEX IF NOT EXISTS idx_client_tags_assignments_tag_id ON client_tags_assignments(tag_id);

CREATE INDEX IF NOT EXISTS idx_appointments_client_id ON appointments(client_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date DESC);
