export interface User {
  id: number;
  username: string;
  role: 'admin' | 'doctor' | 'staff';
  full_name: string;
}

export interface Permissions {
  role: string;
  can_add_patient: number;
  can_edit_patient: number;
  can_view_records: number;
  can_prescribe: number;
  can_manage_users: number;
  can_manage_appointments: number;
  can_manage_billing: number;
}

export interface Patient {
  id: number;
  name: string;
  age: number;
  gender: string;
  dob?: string;
  phone: string;
  email: string;
  nhs_no: string;
  address: string;
  city: string;
  country: string;
  medical_history?: string;
  medical_history_comment?: string;
  family_history?: string;
  family_history_comment?: string;
  social_history?: string;
  social_history_comment?: string;
  allergies?: string;
  allergy_comment?: string;
  current_medication: string;
  current_medication_comment: string;
  current_medication_relationship?: string;
  created_at: string;
}

export interface Medicine {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity?: string;
  comment?: string;
}

export interface Visit {
  id: number;
  patient_id: number;
  doctor_id: number;
  doctor_name?: string;
  presenting_condition: string;
  condition_status: string;
  medical_treatment: string;
  complaints: string;
  diagnosis: string;
  medicines: string; // JSON string
  tests: string; // JSON string
  comments: string;
  signature: string;
  attachments: string; // JSON string
  created_at: string;
  condition_type?: string;
  condition_significance?: string;
  examinations?: string;
  examinations_value?: string;
  examinations_comment?: string;
  diagnosis_value?: string;
  diagnosis_comment?: string;
  plan_value?: string;
  plan_comment?: string;
  services?: string;
  services_comment?: string;
  current_medication_relationship?: string;
  medical_history?: string;
  medical_history_comment?: string;
  family_history?: string;
  family_history_comment?: string;
  social_history?: string;
  social_history_comment?: string;
  allergies?: string;
  allergy_comment?: string;
}

export interface AuditLog {
  id: number;
  user_id: number | null;
  username: string | null;
  action: string;
  details: string;
  ip_address: string;
  created_at: string;
}

export interface Appointment {
  id: number;
  patient_id: number;
  doctor_id: number;
  patient_name?: string;
  doctor_name?: string;
  start_time: string;
  end_time: string;
  title: string;
  description: string;
  status: 'scheduled' | 'completed' | 'cancelled';
}

export interface Invoice {
  id: number;
  patient_id: number;
  visit_id?: number;
  patient_name?: string;
  amount: number;
  status: 'unpaid' | 'paid' | 'partially_paid';
  items: string; // JSON string
  created_at: string;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  price: number;
}
