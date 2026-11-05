import React, { useState, useEffect, useRef } from 'react';
import { 
  User as UserIcon, 
  Lock, 
  Plus, 
  Search, 
  FileText, 
  Settings, 
  LogOut, 
  ChevronRight, 
  Printer, 
  Save, 
  X,
  Stethoscope,
  Users,
  ClipboardList,
  ChevronLeft,
  ChevronDown,
  Phone,
  MapPin,
  Mail,
  Hash,
  Trash2,
  Edit,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Activity,
  Shield,
  ShieldAlert,
  Pill,
  Globe,
  Calendar,
  CreditCard,
  Clock,
  DollarSign,
  Eye,
  History
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Permissions, Patient, Visit, Medicine, AuditLog, Appointment, Invoice, InvoiceItem } from './types';

// @ts-ignore
import { jsPDF } from "jspdf/dist/jspdf.umd.min.js";
import html2canvas from 'html2canvas';

// --- Components ---

const SignaturePad = ({ onSave }: { onSave: (data: string) => void }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
  }, []);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      onSave(canvas.toDataURL());
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = ('touches' in e ? e.touches[0].clientY : e.clientY) - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.beginPath();
      onSave('');
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-2 bg-white">
      <canvas
        ref={canvasRef}
        width={400}
        height={150}
        className="w-full h-32 cursor-crosshair touch-none"
        onMouseDown={startDrawing}
        onMouseUp={stopDrawing}
        onMouseMove={draw}
        onTouchStart={startDrawing}
        onTouchEnd={stopDrawing}
        onTouchMove={draw}
      />
      <button 
        onClick={clear}
        className="text-xs text-red-500 mt-1 hover:underline"
      >
        Clear Signature
      </button>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<Permissions | null>(null);
  const [view, setView] = useState<'dashboard' | 'patients' | 'records' | 'settings' | 'reports' | 'users' | 'audit' | 'calendar' | 'billing'>('dashboard');
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');

  // Patient State
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isAddingPatient, setIsAddingPatient] = useState(false);
  const [isEditingPatient, setIsEditingPatient] = useState(false);
  const [patientForm, setPatientForm] = useState({ 
    id: undefined as number | undefined,
    name: '', 
    age: '', 
    gender: 'Male', 
    dob: '',
    phone: '', 
    email: '',
    nhs_no: '',
    address: '',
    city: '',
    country: '',
    allergies: '',
    allergy_comment: ''
  });
  const [patientSort, setPatientSort] = useState<'name' | 'date' | 'age'>('date');
  const [patientFilter, setPatientFilter] = useState<'All' | 'Male' | 'Female'>('All');

  // Reports State
  const [stats, setStats] = useState<any>(null);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [tests, setTests] = useState<string[]>([]);
  const [currentVisits, setCurrentVisits] = useState<Visit[]>([]);
  const [printingVisit, setPrintingVisit] = useState<Visit | null>(null);

  // Admin State
  const [allPermissions, setAllPermissions] = useState<Permissions[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [isPatientsDropdownOpen, setIsPatientsDropdownOpen] = useState(false);
  const [isAddingComplaint, setIsAddingComplaint] = useState(false);
  const [complaintStep, setComplaintStep] = useState(1);
  const [complaintForm, setComplaintForm] = useState({
    id: undefined as number | undefined,
    presenting_complaints: '',
    condition_type: 'Acute' as 'Acute' | 'Chronic',
    condition_significance: 'Minor' as 'Minor' | 'Significance',
    condition_status: 'Stable' as 'Stable' | 'Critical' | 'Improving' | 'Deteriorating',
    medical_history: '',
    medical_history_comment: '',
    family_history: '',
    family_history_comment: '',
    social_history: '',
    social_history_comment: '',
    medical_treatment: '',
    current_medication: '',
    current_medication_comment: '',
    current_medication_relationship: '',
    allergy_name: '',
    allergy_severity: 'Mild' as 'Mild' | 'High',
    allergy_comment: '',
    examinations: 'all clear' as 'all clear' | 'none',
    examinations_value: '',
    examinations_comment: '',
    diagnosis_value: 'clear' as 'clear' | 'non clear',
    diagnosis_comment: '',
    plan_value: 'all clear' as 'all clear' | 'none',
    plan_comment: '',
    services: '',
    services_comment: '',
    comments: '',
    signature: '',
    attachments: [] as { name: string, data: string, type: string }[]
  });
  const [isAddingAppointment, setIsAddingAppointment] = useState(false);
  const [isAddingInvoice, setIsAddingInvoice] = useState(false);

  // Safe JSON parse utility
  const safeJSONParse = (str: any, fallback: any = []) => {
    if (!str) return fallback;
    let parsed = str;
    if (typeof str === 'string') {
      try {
        parsed = JSON.parse(str);
      } catch (e) {
        console.error("JSON Parse Error:", e, str);
        return fallback;
      }
    }
    // If fallback is an array, ensure the parsed result is also an array
    if (Array.isArray(fallback) && !Array.isArray(parsed)) {
      return fallback;
    }
    return parsed;
  };

  const [appointmentForm, setAppointmentForm] = useState({
    patient_id: 0,
    doctor_id: 0,
    start_time: '',
    end_time: '',
    title: '',
    description: '',
    status: 'scheduled' as 'scheduled' | 'completed' | 'cancelled'
  });
  const [invoiceForm, setInvoiceForm] = useState({
    patient_id: 0,
    visit_id: undefined as number | undefined,
    amount: 0,
    status: 'unpaid' as 'unpaid' | 'paid' | 'partially_paid',
    items: [] as InvoiceItem[]
  });
  const [userForm, setUserForm] = useState({ id: undefined as number | undefined, username: '', password: '', role: 'staff' as 'admin' | 'doctor' | 'staff', full_name: '' });

  // Template Settings
  const [templateSettings, setTemplateSettings] = useState({
    clinicName: 'Medical Clinic',
    clinicSubtitle: 'Advanced Healthcare Solutions',
    address: '123 Medical Plaza, Health City, HC 45678',
    phone: '+1 (555) 000-1111',
    primaryColor: '#047857',
    footerText: 'This is a computer generated prescription. No signature is required unless specified.'
  });

  const [settingsTab, setSettingsTab] = useState<'permissions' | 'template'>('permissions');

  useEffect(() => {
    if (user) {
      fetchPatients();
      fetchTemplateSettings();
      if (user.role === 'admin') {
        fetchPermissions();
        fetchStats();
        fetchUsers();
        fetchAuditLogs();
        fetchAppointments();
        fetchInvoices();
      } else {
        fetchAppointments();
      }
    }
  }, [user]);

  const fetchTemplateSettings = async () => {
    const res = await fetch('/api/settings/prescription_template');
    if (res.ok) {
      const data = await res.json();
      if (data) setTemplateSettings(data);
    }
  };

  const saveTemplateSettings = async () => {
    const res = await fetch('/api/settings/prescription_template', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(templateSettings)
    });
    if (res.ok) {
      alert('Template settings saved successfully!');
    }
  };

  const [isSubmittingVisit, setIsSubmittingVisit] = useState(false);

  const fetchStats = async () => {
    const res = await fetch('/api/reports/stats');
    const data = await res.json();
    setStats(data);
  };

  const fetchPatients = async (query = '') => {
    const res = await fetch(`/api/patients?search=${query}`);
    const data = await res.json();
    setPatients(data);
  };

  const fetchPermissions = async () => {
    const res = await fetch('/api/permissions');
    const data = await res.json();
    setAllPermissions(data);
  };

  const fetchUsers = async () => {
    const res = await fetch('/api/users');
    const data = await res.json();
    setAllUsers(data);
  };

  const fetchAuditLogs = async () => {
    const res = await fetch('/api/audit-logs');
    const data = await res.json();
    setAuditLogs(data);
  };

  const fetchAppointments = async () => {
    const res = await fetch('/api/appointments');
    const data = await res.json();
    setAppointments(data);
  };

  const fetchInvoices = async () => {
    const res = await fetch('/api/invoices');
    const data = await res.json();
    setInvoices(data);
  };

  const handleAddAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...appointmentForm, userId: user?.id, username: user?.username })
    });
    if (res.ok) {
      setIsAddingAppointment(false);
      fetchAppointments();
      setAppointmentForm({
        patient_id: 0,
        doctor_id: 0,
        start_time: '',
        end_time: '',
        title: '',
        description: '',
        status: 'scheduled'
      });
    }
  };

  const handleAddInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...invoiceForm, userId: user?.id, username: user?.username })
    });
    if (res.ok) {
      setIsAddingInvoice(false);
      fetchInvoices();
      setInvoiceForm({
        patient_id: 0,
        visit_id: undefined,
        amount: 0,
        status: 'unpaid',
        items: []
      });
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = userForm.id ? 'PUT' : 'POST';
    const url = userForm.id ? `/api/users/${userForm.id}` : '/api/users';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...userForm, adminId: user?.id, adminUsername: user?.username })
    });
    if (res.ok) {
      setIsAddingUser(false);
      fetchUsers();
      setUserForm({ id: undefined, username: '', password: '', role: 'staff', full_name: '' });
    }
  };

  const deleteUser = async (id: number) => {
    if (confirm('Are you sure you want to delete this user?')) {
      const res = await fetch(`/api/users/${id}?adminId=${user?.id}&adminUsername=${user?.username}`, { method: 'DELETE' });
      if (res.ok) fetchUsers();
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData)
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setPermissions(data.permissions);
      } else {
        setError('Invalid username or password');
      }
    } catch (err) {
      setError('Connection error');
    }
  };

  const handleAddPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = patientForm.id ? 'PUT' : 'POST';
    const url = patientForm.id ? `/api/patients/${patientForm.id}` : '/api/patients';
    
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...patientForm, userId: user?.id, username: user?.username })
    });
    if (res.ok) {
      setIsAddingPatient(false);
      setIsEditingPatient(false);
      resetPatientForm();
      fetchPatients();
    }
  };

  const resetPatientForm = () => {
    setPatientForm({ 
      id: undefined,
      name: '', 
      age: '', 
      gender: 'Male', 
      dob: '',
      phone: '', 
      email: '',
      nhs_no: '',
      address: '',
      city: '',
      country: '',
      allergies: '',
      allergy_comment: ''
    });
  };

  const handleEditPatient = (p: Patient) => {
    setPatientForm({
      id: p.id,
      name: p.name,
      age: p.age.toString(),
      gender: p.gender,
      dob: p.dob || '',
      phone: p.phone,
      email: p.email || '',
      nhs_no: p.nhs_no || '',
      address: p.address,
      city: p.city,
      country: p.country,
      allergies: p.allergies || '',
      allergy_comment: p.allergy_comment || ''
    });
    setIsEditingPatient(true);
    setIsAddingPatient(true);
  };

  const handleSelectPatient = async (patient: Patient) => {
    setSelectedPatient(patient);
    const res = await fetch(`/api/patients/${patient.id}/visits`);
    const data = await res.json();
    setCurrentVisits(data);
    setView('records');
  };

  const generatePDF = async () => {
    const element = document.getElementById('prescription-print');
    if (!element) return;
    
    try {
      const canvas = await html2canvas(element, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Prescription_${selectedPatient?.name}_${new Date().getTime()}.pdf`);
    } catch (err) {
      console.error("PDF Generation failed:", err);
      alert("PDF generation failed. Falling back to print.");
      window.print();
    }
  };

  const printPatientHistory = async () => {
    const element = document.getElementById('patient-history-section');
    if (!element || !selectedPatient) return;
    
    try {
      const canvas = await html2canvas(element, { 
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`History_${selectedPatient.name}_${new Date().getTime()}.pdf`);
    } catch (err) {
      console.error("PDF Generation failed:", err);
      // Fallback to window print
      window.print();
    }
  };

  const handleEditVisit = (visit: Visit) => {
    setComplaintForm({
      id: visit.id,
      presenting_complaints: visit.complaints,
      condition_type: (visit.condition_type as any) || 'Acute',
      condition_significance: (visit.condition_significance as any) || 'Minor',
      condition_status: (visit.condition_status as any) || 'Stable',
      medical_treatment: visit.medical_treatment || '',
      medical_history: selectedPatient?.medical_history || '',
      medical_history_comment: selectedPatient?.medical_history_comment || '',
      family_history: selectedPatient?.family_history || '',
      family_history_comment: selectedPatient?.family_history_comment || '',
      social_history: selectedPatient?.social_history || '',
      social_history_comment: selectedPatient?.social_history_comment || '',
      current_medication: selectedPatient?.current_medication || '',
      current_medication_comment: selectedPatient?.current_medication_comment || '',
      current_medication_relationship: visit.current_medication_relationship || selectedPatient?.current_medication_relationship || '',
      allergy_name: selectedPatient?.allergies ? safeJSONParse(selectedPatient.allergies, {}).allergy : '',
      allergy_severity: selectedPatient?.allergies ? safeJSONParse(selectedPatient.allergies, {}).severity : 'Mild',
      allergy_comment: selectedPatient?.allergy_comment || '',
      examinations: (visit.examinations as any) || 'all clear',
      examinations_value: visit.examinations_value || '',
      examinations_comment: visit.examinations_comment || '',
      diagnosis_value: (visit.diagnosis_value as any) || 'clear',
      diagnosis_comment: visit.diagnosis_comment || '',
      plan_value: (visit.plan_value as any) || 'all clear',
      plan_comment: visit.plan_comment || '',
      services: visit.services || '',
      services_comment: visit.services_comment || '',
      comments: visit.comments || '',
      signature: visit.signature || '',
      attachments: visit.attachments ? safeJSONParse(visit.attachments, []) : []
    });
    setMedicines(safeJSONParse(visit.medicines, []));
    setTests(safeJSONParse(visit.tests, []));
    setIsAddingComplaint(true);
    setComplaintStep(1);
  };

  const handleDeleteVisit = async (id: number) => {
    if (!confirm('Are you sure you want to delete this visit record?')) return false;
    try {
      const res = await fetch(`/api/visits/${id}?userId=${user?.id}&username=${user?.username}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        if (selectedPatient) {
          const visitsRes = await fetch(`/api/patients/${selectedPatient.id}/visits`);
          const visitsData = await visitsRes.json();
          setCurrentVisits(visitsData);
        }
        return true;
      } else {
        alert('Failed to delete visit');
        return false;
      }
    } catch (err) {
      console.error("Failed to delete visit:", err);
      alert('An error occurred while deleting the visit');
      return false;
    }
  };

  const updatePermission = async (role: string, field: keyof Permissions, value: number) => {
    const perm = allPermissions.find(p => p.role === role);
    if (!perm) return;

    const updated = { ...perm, [field]: value };
    const res = await fetch(`/api/permissions/${role}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated)
    });
    if (res.ok) fetchPermissions();
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 border border-black/5"
        >
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-emerald-200">
              <Stethoscope className="text-white w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Medical Login</h1>
            <p className="text-gray-500 text-sm">Clinic Management System</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Username</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="text" 
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
                  placeholder="Enter username"
                  value={loginData.username}
                  onChange={e => setLoginData({ ...loginData, username: e.target.value })}
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="password" 
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
                  placeholder="••••••••"
                  value={loginData.password}
                  onChange={e => setLoginData({ ...loginData, password: e.target.value })}
                  required
                />
              </div>
            </div>
            {error && <p className="text-red-500 text-xs text-center">{error}</p>}
            <button 
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-emerald-100 mt-4"
            >
              Sign In
            </button>
          </form>
          
          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400">Demo: admin/admin123, doctor1/doc123, staff1/staff123</p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-bottom border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
              <Stethoscope className="text-white w-6 h-6" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 leading-tight">Medical</h2>
              <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">Clinic Pro</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <button 
            onClick={() => setView('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${view === 'dashboard' ? 'bg-emerald-50 text-emerald-700' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <ClipboardList className="w-5 h-5" /> Dashboard
          </button>
          <div className="relative">
            <button 
              onClick={() => setIsPatientsDropdownOpen(!isPatientsDropdownOpen)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${view === 'patients' || view === 'records' ? 'bg-emerald-50 text-emerald-700' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5" /> Patients
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform ${isPatientsDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            
            <AnimatePresence>
              {isPatientsDropdownOpen && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden bg-gray-50/50 rounded-xl mt-1 ml-4"
                >
                  <button 
                    onClick={() => { setView('patients'); setIsPatientsDropdownOpen(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-2 text-xs font-medium transition-all ${view === 'patients' ? 'text-emerald-700' : 'text-gray-500 hover:text-emerald-600'}`}
                  >
                    <Users className="w-4 h-4" /> View All Patients
                  </button>
                  <button 
                    onClick={() => { 
                      if (selectedPatient) {
                        setIsAddingComplaint(true);
                        setComplaintStep(1);
                        setComplaintForm({
                          presenting_complaints: '',
                          condition_type: 'Acute',
                          condition_significance: 'Minor',
                          condition_status: 'Stable',
                          medical_history: selectedPatient.medical_history || '',
                          medical_history_comment: selectedPatient.medical_history_comment || '',
                          family_history: selectedPatient.family_history || '',
                          family_history_comment: selectedPatient.family_history_comment || '',
                          social_history: selectedPatient.social_history || '',
                          social_history_comment: selectedPatient.social_history_comment || '',
                          current_medication: selectedPatient.current_medication || '',
                          current_medication_comment: selectedPatient.current_medication_comment || '',
                          current_medication_relationship: selectedPatient.current_medication_relationship || '',
                          allergy_name: selectedPatient.allergies ? safeJSONParse(selectedPatient.allergies, {}).allergy : '',
                          allergy_severity: selectedPatient.allergies ? safeJSONParse(selectedPatient.allergies, {}).severity : 'Mild',
                          allergy_comment: selectedPatient.allergy_comment || '',
                          examinations: 'all clear',
                          examinations_value: '',
                          examinations_comment: '',
                          diagnosis_value: 'clear',
                          diagnosis_comment: '',
                          plan_value: 'all clear',
                          plan_comment: '',
                          services: '',
                          services_comment: '',
                          comments: '',
                          signature: '',
                          attachments: []
                        });
                        setIsPatientsDropdownOpen(false);
                      } else {
                        alert('Please select a patient first from the Patients list.');
                        setView('patients');
                        setIsPatientsDropdownOpen(false);
                      }
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-xs font-medium text-gray-500 hover:text-emerald-600 transition-all"
                  >
                    <AlertCircle className="w-4 h-4" /> Add Complaint
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {(user.role === 'admin' || permissions?.can_manage_appointments === 1) && (
            <button 
              onClick={() => { setView('calendar'); fetchAppointments(); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${view === 'calendar' ? 'bg-emerald-50 text-emerald-700' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              <Calendar className="w-5 h-5" /> Calendar
            </button>
          )}
          {(user.role === 'admin' || permissions?.can_manage_billing === 1) && (
            <button 
              onClick={() => { setView('billing'); fetchInvoices(); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${view === 'billing' ? 'bg-emerald-50 text-emerald-700' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              <CreditCard className="w-5 h-5" /> Billing
            </button>
          )}
          <button 
            onClick={() => { setView('reports'); fetchStats(); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${view === 'reports' ? 'bg-emerald-50 text-emerald-700' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <FileText className="w-5 h-5" /> Reports
          </button>
          {user.role === 'admin' && (
            <button 
              onClick={() => setView('users')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${view === 'users' ? 'bg-emerald-50 text-emerald-700' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              <Users className="w-5 h-5" /> User Management
            </button>
          )}
          {user.role === 'admin' && (
            <button 
              onClick={() => { setView('audit'); fetchAuditLogs(); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${view === 'audit' ? 'bg-emerald-50 text-emerald-700' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              <Shield className="w-5 h-5" /> Audit Logs
            </button>
          )}
          {user.role === 'admin' && (
            <button 
              onClick={() => setView('settings')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${view === 'settings' ? 'bg-emerald-50 text-emerald-700' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              <Settings className="w-5 h-5" /> Settings
            </button>
          )}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="bg-gray-50 rounded-2xl p-4 mb-4">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Logged in as</p>
            <p className="text-sm font-bold text-gray-900">{user.full_name}</p>
            <p className="text-xs text-emerald-600 capitalize">{user.role}</p>
          </div>
          <button 
            onClick={() => setUser(null)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-all"
          >
            <LogOut className="w-5 h-5" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8">
        <AnimatePresence mode="wait">
          {view === 'dashboard' && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <header className="flex justify-between items-end">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user.full_name.split(' ')[0]}</h1>
                  <p className="text-gray-500">Here's what's happening at your clinic today.</p>
                </div>
                <div className="text-right hidden md:block">
                  <p className="text-sm font-bold text-emerald-600">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                  <p className="text-xs text-gray-400">System Status: Operational</p>
                </div>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm">
                  <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mb-4">
                    <Users className="text-emerald-600 w-6 h-6" />
                  </div>
                  <p className="text-sm text-gray-500 font-medium">Total Patients</p>
                  <h3 className="text-2xl font-bold text-gray-900">{patients.length}</h3>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm">
                  <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
                    <ClipboardList className="text-blue-600 w-6 h-6" />
                  </div>
                  <p className="text-sm text-gray-500 font-medium">Today's Visits</p>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {patients.filter(p => new Date(p.created_at).toDateString() === new Date().toDateString()).length}
                  </h3>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm">
                  <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center mb-4">
                    <Calendar className="text-purple-600 w-6 h-6" />
                  </div>
                  <p className="text-sm text-gray-500 font-medium">Today's Appointments</p>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {appointments.filter(a => new Date(a.start_time).toDateString() === new Date().toDateString()).length}
                  </h3>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-bold text-gray-900">Recent Patients</h3>
                    <button onClick={() => setView('patients')} className="text-emerald-600 text-sm font-bold hover:underline">View All</button>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {patients.slice(0, 5).map(p => (
                      <div key={p.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-all cursor-pointer" onClick={() => handleSelectPatient(p)}>
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 font-bold">
                            {p.name[0]}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{p.name}</p>
                            <p className="text-xs text-gray-500">{p.phone}</p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-300" />
                      </div>
                    ))}
                    {patients.length === 0 && (
                      <div className="p-12 text-center">
                        <Users className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                        <p className="text-gray-400 font-medium">No patients registered yet.</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-white p-8 rounded-3xl border border-black/5 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-900">Recent Invoices</h3>
                    <button onClick={() => setView('billing')} className="text-emerald-600 text-sm font-bold hover:underline">View All</button>
                  </div>
                  <div className="space-y-4">
                    {invoices.slice(0, 4).map(inv => (
                      <div key={inv.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                            <CreditCard className="w-5 h-5 text-gray-400" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900">{inv.patient_name}</p>
                            <p className="text-[10px] text-gray-500 uppercase font-bold">{new Date(inv.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-emerald-600">${inv.amount.toFixed(2)}</p>
                          <p className={`text-[10px] font-bold uppercase ${inv.status === 'paid' ? 'text-emerald-500' : 'text-red-500'}`}>{inv.status}</p>
                        </div>
                      </div>
                    ))}
                    {invoices.length === 0 && (
                      <div className="h-48 flex flex-col items-center justify-center border-2 border-dashed border-gray-100 rounded-3xl">
                        <DollarSign className="w-10 h-10 text-gray-200 mb-2" />
                        <p className="text-gray-400 text-sm font-medium">No recent billing activity.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {view === 'patients' && (
            <motion.div 
              key="patients"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Patients</h1>
                  <p className="text-gray-500">Manage and search patient records by Name or ID.</p>
                </div>
                {permissions?.can_add_patient === 1 && (
                  <button 
                    onClick={() => { resetPatientForm(); setIsAddingPatient(true); setIsEditingPatient(false); }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-emerald-100 transition-all"
                  >
                    <Plus className="w-5 h-5" /> Add Patient
                  </button>
                )}
              </div>

              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="Search by Name, Phone, or ID (e.g. #12)..." 
                    className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    value={searchQuery}
                    onChange={e => {
                      setSearchQuery(e.target.value);
                      fetchPatients(e.target.value);
                    }}
                  />
                </div>
                <div className="flex gap-2">
                  <select 
                    className="px-4 py-4 bg-white border border-gray-200 rounded-2xl shadow-sm outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
                    value={patientSort}
                    onChange={e => setPatientSort(e.target.value as any)}
                  >
                    <option value="date">Sort by Date</option>
                    <option value="name">Sort by Name</option>
                    <option value="age">Sort by Age</option>
                  </select>
                  <select 
                    className="px-4 py-4 bg-white border border-gray-200 rounded-2xl shadow-sm outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
                    value={patientFilter}
                    onChange={e => setPatientFilter(e.target.value as any)}
                  >
                    <option value="All">All Genders</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Name</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Age/Gender</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Phone</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Last Visit</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {patients
                      .filter(p => patientFilter === 'All' || p.gender === patientFilter)
                      .sort((a, b) => {
                        if (patientSort === 'name') return a.name.localeCompare(b.name);
                        if (patientSort === 'age') return b.age - a.age;
                        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                      })
                      .map(p => (
                        <tr key={p.id} className="hover:bg-gray-50/50 transition-all">
                          <td className="px-6 py-4">
                            <p className="font-bold text-gray-900">{p.name}</p>
                            <p className="text-xs text-gray-400">ID: #{p.id}</p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-gray-600">{p.age} yrs / {p.gender}</p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-gray-600">{p.phone}</p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-gray-600">{new Date(p.created_at).toLocaleDateString()}</p>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-3">
                              <button 
                                onClick={() => {
                                  setSelectedPatient(p);
                                  setIsAddingComplaint(true);
                                  setComplaintStep(1);
                                  setComplaintForm({
                                    presenting_complaints: '',
                                    condition_type: 'Acute',
                                    condition_significance: 'Minor',
                                    condition_status: 'Stable',
                                    medical_history: p.medical_history || '',
                                    medical_history_comment: p.medical_history_comment || '',
                                    family_history: p.family_history || '',
                                    family_history_comment: p.family_history_comment || '',
                                    social_history: p.social_history || '',
                                    social_history_comment: p.social_history_comment || '',
                                    current_medication: p.current_medication || '',
                                    current_medication_comment: p.current_medication_comment || '',
                                    current_medication_relationship: p.current_medication_relationship || '',
                                    allergy_name: p.allergies ? safeJSONParse(p.allergies, {}).allergy : '',
                                    allergy_severity: p.allergies ? safeJSONParse(p.allergies, {}).severity : 'Mild',
                                    allergy_comment: p.allergy_comment || '',
                                    examinations: 'all clear',
                                    examinations_value: '',
                                    examinations_comment: '',
                                    diagnosis_value: 'clear',
                                    diagnosis_comment: '',
                                    plan_value: 'all clear',
                                    plan_comment: '',
                                    services: '',
                                    services_comment: '',
                                    comments: '',
                                    signature: '',
                                    attachments: []
                                  });
                                }}
                                className="text-orange-600 hover:text-orange-700 font-bold text-sm"
                              >
                                Complaint
                              </button>
                              <button 
                                onClick={() => handleSelectPatient(p)}
                                className="text-emerald-600 hover:text-emerald-700 font-bold text-sm"
                              >
                                Records
                              </button>
                              {permissions?.can_edit_patient === 1 && (
                                <button 
                                  onClick={() => handleEditPatient(p)}
                                  className="text-blue-600 hover:text-blue-700 font-bold text-sm"
                                >
                                  Edit
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
                {patients.length === 0 && (
                  <div className="p-12 text-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Search className="w-8 h-8 text-gray-300" />
                    </div>
                    <p className="text-gray-500 font-medium">No patients found matching your search.</p>
                    <p className="text-xs text-gray-400 mt-1">Try searching by Name, Phone, or ID (e.g. #1)</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {view === 'records' && selectedPatient && (
            <motion.div 
              key="records"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <header className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button onClick={() => setView('patients')} className="p-2 hover:bg-white rounded-xl transition-all border border-transparent hover:border-gray-100 shadow-sm">
                    <ChevronLeft className="w-6 h-6 text-gray-400" />
                  </button>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">{selectedPatient.name}</h1>
                    <p className="text-gray-500">Patient ID: #{selectedPatient.id} • {selectedPatient.age} years • {selectedPatient.gender}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={() => {
                      setIsAddingComplaint(true);
                      setComplaintStep(1);
                      setComplaintForm({
                        id: undefined,
                        presenting_complaints: '',
                        condition_type: 'Acute',
                        condition_significance: 'Minor',
                        condition_status: 'Stable',
                        medical_treatment: '',
                        medical_history: selectedPatient.medical_history || '',
                        medical_history_comment: selectedPatient.medical_history_comment || '',
                        family_history: selectedPatient.family_history || '',
                        family_history_comment: selectedPatient.family_history_comment || '',
                        social_history: selectedPatient.social_history || '',
                        social_history_comment: selectedPatient.social_history_comment || '',
                        current_medication: selectedPatient.current_medication || '',
                        current_medication_comment: selectedPatient.current_medication_comment || '',
                        current_medication_relationship: selectedPatient.current_medication_relationship || '',
                        allergy_name: selectedPatient.allergies ? safeJSONParse(selectedPatient.allergies, {}).allergy : '',
                        allergy_severity: selectedPatient.allergies ? safeJSONParse(selectedPatient.allergies, {}).severity : 'Mild',
                        allergy_comment: selectedPatient.allergy_comment || '',
                        examinations: 'all clear',
                        examinations_value: '',
                        examinations_comment: '',
                        diagnosis_value: 'clear',
                        diagnosis_comment: '',
                        plan_value: 'all clear',
                        plan_comment: '',
                        services: '',
                        services_comment: '',
                        comments: '',
                        signature: '',
                        attachments: []
                      });
                      setMedicines([]);
                      setTests([]);
                    }}
                    className="bg-emerald-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
                  >
                    <Plus className="w-5 h-5" /> New Visit / Complaint
                  </button>
                  {permissions?.can_edit_patient === 1 && (
                    <button 
                      onClick={() => handleEditPatient(selectedPatient)}
                      className="bg-white border border-gray-200 text-gray-700 px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-gray-50 transition-all shadow-sm"
                    >
                      Edit Profile
                    </button>
                  )}
                </div>
              </header>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 space-y-6">
                  <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Contact & Location</h3>
                    <div className="space-y-5">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0">
                            <UserIcon className="w-4 h-4 text-indigo-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Age / Gender</p>
                            <p className="text-sm text-gray-900 font-medium">{selectedPatient.age}y / {selectedPatient.gender}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-pink-50 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Calendar className="w-4 h-4 text-pink-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">DOB</p>
                            <p className="text-sm text-gray-900 font-medium">{selectedPatient.dob || 'Not provided'}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Phone className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Phone Number</p>
                          <p className="text-sm text-gray-900 font-medium">{selectedPatient.phone || 'Not provided'}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Mail className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Email Address</p>
                          <p className="text-sm text-gray-900 font-medium">{selectedPatient.email || 'Not provided'}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Hash className="w-4 h-4 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">NHS Number</p>
                          <p className="text-sm text-gray-900 font-medium">{selectedPatient.nhs_no || 'Not provided'}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0">
                          <MapPin className="w-4 h-4 text-orange-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Address</p>
                          <p className="text-sm text-gray-900 font-medium leading-relaxed">
                            {selectedPatient.address ? (
                              <>
                                {selectedPatient.address}
                                {(selectedPatient.city || selectedPatient.country) && (
                                  <span className="block text-xs text-gray-500 mt-0.5">
                                    {[selectedPatient.city, selectedPatient.country].filter(Boolean).join(', ')}
                                  </span>
                                )}
                              </>
                            ) : (
                              'No address recorded'
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-bold text-gray-900">Patient History</h3>
                      <button 
                        onClick={printPatientHistory}
                        className="p-2 hover:bg-gray-50 rounded-xl text-gray-400 hover:text-emerald-600 transition-all"
                        title="Print History"
                      >
                        <Printer className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="space-y-6">
                      <div className="flex items-start gap-4">
                        <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Pill className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Current Medication</p>
                          <p className="text-sm text-gray-700 leading-relaxed">{selectedPatient.current_medication || 'No medications recorded'}</p>
                          {selectedPatient.current_medication_comment && (
                            <p className="mt-1 text-xs italic text-emerald-600">Dr. Comment: {selectedPatient.current_medication_comment}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Activity className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Medical History</p>
                          <p className="text-sm text-gray-700 leading-relaxed">{selectedPatient.medical_history || 'None recorded'}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Users className="w-4 h-4 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Family History</p>
                          <p className="text-sm text-gray-700 leading-relaxed">{selectedPatient.family_history || 'None recorded'}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Globe className="w-4 h-4 text-gray-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Social History</p>
                          <p className="text-sm text-gray-700 leading-relaxed">{selectedPatient.social_history || 'None recorded'}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0">
                          <ShieldAlert className="w-4 h-4 text-red-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Allergies</p>
                          {(() => {
                            const allergies = selectedPatient.allergies ? safeJSONParse(selectedPatient.allergies, null) : null;
                            if (allergies && allergies.allergy) {
                              return (
                                <p className="text-sm text-gray-900 font-medium">{allergies.allergy} <span className="text-xs text-red-500 font-bold">({allergies.severity})</span></p>
                              );
                            }
                            return <p className="text-sm text-gray-600">No allergies recorded</p>;
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-white p-8 rounded-3xl border border-black/5 shadow-sm" id="patient-history-section">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-2xl font-bold text-gray-900">Patient History</h3>
                      <div className="flex items-center gap-2">
                        {currentVisits.length > 0 && permissions?.can_prescribe === 1 && (
                          <button 
                            onClick={() => handleEditVisit(currentVisits[0])}
                            className="p-2 hover:bg-gray-50 rounded-xl text-gray-400 hover:text-blue-600 transition-all"
                            title="Edit Latest Complaint"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-8">
                      {currentVisits.length > 0 && (
                        <div className="bg-orange-50/50 p-6 rounded-2xl border border-orange-100/50">
                          <p className="text-[10px] font-bold text-orange-600 uppercase tracking-widest mb-4 flex items-center justify-between">
                            <span className="flex items-center gap-2"><AlertCircle className="w-4 h-4" /> Latest Complaint Summary</span>
                            <span className="text-gray-400">Dr. {currentVisits[0].doctor_name}</span>
                          </p>
                          <div className="space-y-5">
                            <div>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Presenting Complaints</p>
                              <p className="text-base text-gray-900 font-medium">{currentVisits[0].complaints}</p>
                              <div className="flex flex-wrap gap-2 mt-2">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                                  currentVisits[0].condition_status === 'Critical' ? 'bg-red-100 text-red-700' : 
                                  currentVisits[0].condition_status === 'Stable' ? 'bg-emerald-100 text-emerald-700' : 
                                  'bg-blue-100 text-blue-700'
                                }`}>
                                  {currentVisits[0].condition_status}
                                </span>
                                {currentVisits[0].condition_type && (
                                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-gray-100 text-gray-700">
                                    {currentVisits[0].condition_type}
                                  </span>
                                )}
                                {currentVisits[0].condition_significance && (
                                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-indigo-50 text-indigo-700">
                                    {currentVisits[0].condition_significance}
                                  </span>
                                )}
                              </div>
                              {currentVisits[0].medical_treatment && (
                                <div className="mt-3 p-3 bg-white/50 rounded-xl border border-orange-100/30">
                                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Medical Treatment</p>
                                  <p className="text-sm text-gray-700 leading-relaxed">{currentVisits[0].medical_treatment}</p>
                                </div>
                              )}
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                              <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Examinations</p>
                                <p className="text-sm text-gray-900 uppercase font-bold">{currentVisits[0].examinations}</p>
                                {currentVisits[0].examinations_value && <p className="text-[10px] text-emerald-600 font-bold uppercase mt-1">Value: {currentVisits[0].examinations_value}</p>}
                                {currentVisits[0].examinations_comment && <p className="text-[10px] italic text-gray-500 mt-1">{currentVisits[0].examinations_comment}</p>}
                              </div>
                              <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Diagnosis</p>
                                <p className="text-sm text-gray-900">{currentVisits[0].diagnosis}</p>
                                {currentVisits[0].diagnosis_comment && <p className="text-[10px] italic text-gray-500 mt-1">{currentVisits[0].diagnosis_comment}</p>}
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                              <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Plan</p>
                                <p className="text-sm text-gray-900">{currentVisits[0].plan_value}</p>
                                {currentVisits[0].plan_comment && <p className="text-[10px] italic text-gray-500 mt-1">{currentVisits[0].plan_comment}</p>}
                              </div>
                              <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Services</p>
                                <p className="text-sm text-gray-900">{currentVisits[0].services || 'None'}</p>
                                {currentVisits[0].services_comment && <p className="text-[10px] italic text-gray-500 mt-1">{currentVisits[0].services_comment}</p>}
                              </div>
                            </div>
                            {(() => {
                              const parsedMedicines = safeJSONParse(currentVisits[0].medicines, []);
                              return parsedMedicines.length > 0 && (
                                <div>
                                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Prescribed Medicines</p>
                                  <div className="flex flex-wrap gap-2">
                                    {parsedMedicines.map((m: Medicine, idx: number) => (
                                      <div key={idx} className="px-3 py-1.5 bg-white border border-orange-100 rounded-xl text-xs text-orange-700">
                                        <span className="font-bold">{m.name}</span> • {m.dosage} • {m.frequency}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      )}

                      <div className="space-y-4">
                        <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                          <History className="w-5 h-5 text-emerald-600" />
                          Visit History
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {currentVisits.map(v => (
                            <div key={v.id} className="bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden hover:shadow-md transition-all">
                              <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                                <div>
                                  <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Visit Record</p>
                                  <p className="font-bold text-gray-900 text-sm">{new Date(v.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  {permissions?.can_prescribe === 1 && (
                                    <button 
                                      onClick={() => handleEditVisit(v)}
                                      className="p-1.5 hover:bg-white rounded-xl text-gray-500 hover:text-blue-600 transition-all border border-transparent hover:border-blue-100"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </button>
                                  )}
                                  <button 
                                    onClick={() => setPrintingVisit(v)}
                                    className="p-1.5 hover:bg-white rounded-xl text-gray-500 hover:text-emerald-600 transition-all border border-transparent hover:border-emerald-100"
                                  >
                                    <Printer className="w-4 h-4" />
                                  </button>
                                  {permissions?.can_prescribe === 1 && (
                                    <button 
                                      onClick={() => handleDeleteVisit(v.id)}
                                      className="p-1.5 hover:bg-white rounded-xl text-gray-500 hover:text-red-600 transition-all border border-transparent hover:border-red-100"
                                      title="Delete Visit"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              </div>
                              <div className="p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Doctor</p>
                                    <p className="text-xs font-bold text-gray-900">Dr. {v.doctor_name}</p>
                                  </div>
                                  <div className="flex flex-col items-end gap-1">
                                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase ${
                                      v.condition_status === 'Critical' ? 'bg-red-100 text-red-700' : 
                                      v.condition_status === 'Stable' ? 'bg-emerald-100 text-emerald-700' : 
                                      'bg-blue-100 text-blue-700'
                                    }`}>
                                      {v.condition_status}
                                    </span>
                                    {v.condition_type && (
                                      <span className="text-[8px] font-bold text-gray-500 uppercase bg-gray-100 px-1.5 py-0.5 rounded-full">
                                        {v.condition_type}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div>
                                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Complaints</p>
                                  <p className="text-xs text-gray-900 font-medium line-clamp-2">{v.complaints}</p>
                                </div>
                                <div>
                                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Diagnosis</p>
                                  <p className="text-xs text-gray-900 font-medium">{v.diagnosis}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {view === 'calendar' && (
            <motion.div 
              key="calendar"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Calendar</h1>
                  <p className="text-gray-500">Schedule and manage patient appointments.</p>
                </div>
                <button 
                  onClick={() => setIsAddingAppointment(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-emerald-100 transition-all"
                >
                  <Plus className="w-5 h-5" /> Schedule Appointment
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-4">
                  <div className="bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                      <h3 className="font-bold text-gray-900">Upcoming Appointments</h3>
                      <button onClick={() => fetchAppointments()} className="p-2 hover:bg-gray-50 rounded-lg transition-all">
                        <RefreshCw className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {appointments.length === 0 ? (
                        <div className="p-12 text-center">
                          <Calendar className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                          <p className="text-gray-400 font-medium">No appointments scheduled.</p>
                        </div>
                      ) : (
                        appointments.map(app => (
                          <div key={app.id} className="p-6 hover:bg-gray-50 transition-all">
                            <div className="flex items-start justify-between">
                              <div className="flex gap-4">
                                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex flex-col items-center justify-center text-emerald-600">
                                  <span className="text-[10px] font-bold uppercase">{new Date(app.start_time).toLocaleString('default', { month: 'short' })}</span>
                                  <span className="text-lg font-bold leading-none">{new Date(app.start_time).getDate()}</span>
                                </div>
                                <div>
                                  <h4 className="font-bold text-gray-900">{app.title}</h4>
                                  <p className="text-sm text-gray-500 flex items-center gap-1">
                                    <UserIcon className="w-3 h-3" /> {app.patient_name}
                                  </p>
                                  <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                                    <Clock className="w-3 h-3" /> {new Date(app.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(app.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </p>
                                </div>
                              </div>
                              <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                app.status === 'scheduled' ? 'bg-blue-50 text-blue-600' :
                                app.status === 'completed' ? 'bg-emerald-50 text-emerald-600' :
                                'bg-red-50 text-red-600'
                              }`}>
                                {app.status}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm">
                    <h3 className="font-bold text-gray-900 mb-4">Quick Stats</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-blue-50 rounded-2xl">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                            <Calendar className="w-5 h-5 text-blue-600" />
                          </div>
                          <span className="text-sm font-bold text-blue-900">Today</span>
                        </div>
                        <span className="text-xl font-bold text-blue-900">
                          {appointments.filter(a => new Date(a.start_time).toDateString() === new Date().toDateString()).length}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-2xl">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                          </div>
                          <span className="text-sm font-bold text-emerald-900">Completed</span>
                        </div>
                        <span className="text-xl font-bold text-emerald-900">
                          {appointments.filter(a => a.status === 'completed').length}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Add Appointment Modal */}
              <AnimatePresence>
                {isAddingAppointment && (
                  <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden"
                    >
                      <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                        <h3 className="text-xl font-bold text-gray-900">Schedule Appointment</h3>
                        <button onClick={() => setIsAddingAppointment(false)} className="p-2 hover:bg-gray-200 rounded-full transition-all">
                          <X className="w-5 h-5 text-gray-500" />
                        </button>
                      </div>
                      <form onSubmit={handleAddAppointment} className="p-6 space-y-4">
                        <div className="grid grid-cols-1 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Patient</label>
                            <select 
                              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                              value={appointmentForm.patient_id}
                              onChange={e => setAppointmentForm({ ...appointmentForm, patient_id: parseInt(e.target.value) })}
                              required
                            >
                              <option value="">Select Patient</option>
                              {patients.map(p => (
                                <option key={p.id} value={p.id}>{p.name} (#{p.id})</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Doctor</label>
                            <select 
                              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                              value={appointmentForm.doctor_id}
                              onChange={e => setAppointmentForm({ ...appointmentForm, doctor_id: parseInt(e.target.value) })}
                              required
                            >
                              <option value="">Select Doctor</option>
                              {allUsers.filter(u => u.role === 'doctor').map(u => (
                                <option key={u.id} value={u.id}>{u.full_name}</option>
                              ))}
                            </select>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Start Time</label>
                              <input 
                                type="datetime-local" 
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                value={appointmentForm.start_time}
                                onChange={e => setAppointmentForm({ ...appointmentForm, start_time: e.target.value })}
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">End Time</label>
                              <input 
                                type="datetime-local" 
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                value={appointmentForm.end_time}
                                onChange={e => setAppointmentForm({ ...appointmentForm, end_time: e.target.value })}
                                required
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Title</label>
                            <input 
                              type="text" 
                              placeholder="e.g. Regular Checkup"
                              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                              value={appointmentForm.title}
                              onChange={e => setAppointmentForm({ ...appointmentForm, title: e.target.value })}
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Description</label>
                            <textarea 
                              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all h-24"
                              value={appointmentForm.description}
                              onChange={e => setAppointmentForm({ ...appointmentForm, description: e.target.value })}
                            />
                          </div>
                        </div>
                        <div className="flex gap-3 pt-4">
                          <button 
                            type="button" 
                            onClick={() => setIsAddingAppointment(false)}
                            className="flex-1 px-6 py-3 border border-gray-200 text-gray-600 rounded-2xl font-bold hover:bg-gray-50 transition-all"
                          >
                            Cancel
                          </button>
                          <button 
                            type="submit"
                            className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all"
                          >
                            Save Appointment
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {view === 'billing' && (
            <motion.div 
              key="billing"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Billing & Invoices</h1>
                  <p className="text-gray-500">Manage patient payments and generate invoices.</p>
                </div>
                <button 
                  onClick={() => setIsAddingInvoice(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-emerald-100 transition-all"
                >
                  <Plus className="w-5 h-5" /> Create Invoice
                </button>
              </div>

              <div className="bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50">
                      <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Invoice ID</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Patient</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {invoices.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                          No invoices found.
                        </td>
                      </tr>
                    ) : (
                      invoices.map(inv => (
                        <tr key={inv.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4 font-mono text-xs text-gray-500">#INV-{inv.id}</td>
                          <td className="px-6 py-4 font-bold text-gray-900">{inv.patient_name}</td>
                          <td className="px-6 py-4 font-bold text-emerald-600">${inv.amount.toFixed(2)}</td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              inv.status === 'paid' ? 'bg-emerald-50 text-emerald-600' :
                              inv.status === 'unpaid' ? 'bg-red-50 text-red-600' :
                              'bg-orange-50 text-orange-600'
                            }`}>
                              {inv.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">{new Date(inv.created_at).toLocaleDateString()}</td>
                          <td className="px-6 py-4 text-right">
                            <button 
                              onClick={async () => {
                                const newStatus = inv.status === 'paid' ? 'unpaid' : 'paid';
                                await fetch(`/api/invoices/${inv.id}`, {
                                  method: 'PUT',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ status: newStatus, userId: user?.id, username: user?.username })
                                });
                                fetchInvoices();
                              }}
                              className="text-xs font-bold text-emerald-600 hover:underline"
                            >
                              Mark as {inv.status === 'paid' ? 'Unpaid' : 'Paid'}
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Add Invoice Modal */}
              <AnimatePresence>
                {isAddingInvoice && (
                  <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden"
                    >
                      <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                        <h3 className="text-xl font-bold text-gray-900">Create Invoice</h3>
                        <button onClick={() => setIsAddingInvoice(false)} className="p-2 hover:bg-gray-200 rounded-full transition-all">
                          <X className="w-5 h-5 text-gray-500" />
                        </button>
                      </div>
                      <form onSubmit={handleAddInvoice} className="p-6 space-y-4">
                        <div className="grid grid-cols-1 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Patient</label>
                            <select 
                              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                              value={invoiceForm.patient_id}
                              onChange={e => setInvoiceForm({ ...invoiceForm, patient_id: parseInt(e.target.value) })}
                              required
                            >
                              <option value="">Select Patient</option>
                              {patients.map(p => (
                                <option key={p.id} value={p.id}>{p.name} (#{p.id})</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Total Amount ($)</label>
                            <div className="relative">
                              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <input 
                                type="number" 
                                step="0.01"
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                value={invoiceForm.amount}
                                onChange={e => setInvoiceForm({ ...invoiceForm, amount: parseFloat(e.target.value) })}
                                required
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Status</label>
                            <select 
                              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                              value={invoiceForm.status}
                              onChange={e => setInvoiceForm({ ...invoiceForm, status: e.target.value as any })}
                            >
                              <option value="unpaid">Unpaid</option>
                              <option value="paid">Paid</option>
                              <option value="partially_paid">Partially Paid</option>
                            </select>
                          </div>
                        </div>
                        <div className="flex gap-3 pt-4">
                          <button 
                            type="button" 
                            onClick={() => setIsAddingInvoice(false)}
                            className="flex-1 px-6 py-3 border border-gray-200 text-gray-600 rounded-2xl font-bold hover:bg-gray-50 transition-all"
                          >
                            Cancel
                          </button>
                          <button 
                            type="submit"
                            className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all"
                          >
                            Generate Invoice
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {view === 'reports' && (
            <motion.div 
              key="reports"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <header className="flex justify-between items-center">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Clinic Reports</h1>
                  <p className="text-gray-500">Overview of clinic performance and patient statistics.</p>
                </div>
                <button 
                  onClick={() => fetchStats()}
                  className="p-3 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50 transition-all shadow-sm"
                >
                  <RefreshCw className="w-5 h-5 text-gray-500" />
                </button>
              </header>

              {stats && (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total Patients</p>
                      <h3 className="text-3xl font-bold text-emerald-600">{stats.totalPatients}</h3>
                    </div>
                    <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total Visits</p>
                      <h3 className="text-3xl font-bold text-blue-600">{stats.totalVisits}</h3>
                    </div>
                    <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Avg Age</p>
                      <h3 className="text-3xl font-bold text-purple-600">
                        {Math.round(patients.reduce((acc, p) => acc + p.age, 0) / (patients.length || 1))}
                      </h3>
                    </div>
                    <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Male/Female %</p>
                      <h3 className="text-3xl font-bold text-orange-600">
                        {Math.round((patients.filter(p => p.gender === 'Male').length / (patients.length || 1)) * 100)}% / {Math.round((patients.filter(p => p.gender === 'Female').length / (patients.length || 1)) * 100)}%
                      </h3>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-white p-8 rounded-3xl border border-black/5 shadow-sm">
                      <h3 className="text-lg font-bold text-gray-900 mb-6">Visit Trends (Last 7 Days)</h3>
                      <div className="space-y-4">
                        {stats.visitsByDay.map((day: any) => (
                          <div key={day.date} className="space-y-1">
                            <div className="flex justify-between text-xs font-bold">
                              <span className="text-gray-500">{day.date}</span>
                              <span className="text-gray-900">{day.count} visits</span>
                            </div>
                            <div className="h-3 bg-gray-50 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${(day.count / Math.max(...stats.visitsByDay.map((d: any) => d.count), 1)) * 100}%` }}
                                className="h-full bg-emerald-500 rounded-full"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white p-8 rounded-3xl border border-black/5 shadow-sm">
                      <h3 className="text-lg font-bold text-gray-900 mb-6">Patient Demographics</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-gray-50 rounded-2xl text-center">
                          <p className="text-xs font-bold text-gray-400 uppercase mb-1">Pediatric (0-18)</p>
                          <p className="text-2xl font-bold text-gray-900">{patients.filter(p => p.age <= 18).length}</p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-2xl text-center">
                          <p className="text-xs font-bold text-gray-400 uppercase mb-1">Adult (19-60)</p>
                          <p className="text-2xl font-bold text-gray-900">{patients.filter(p => p.age > 18 && p.age <= 60).length}</p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-2xl text-center">
                          <p className="text-xs font-bold text-gray-400 uppercase mb-1">Senior (60+)</p>
                          <p className="text-2xl font-bold text-gray-900">{patients.filter(p => p.age > 60).length}</p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-2xl text-center">
                          <p className="text-xs font-bold text-gray-400 uppercase mb-1">New this Month</p>
                          <p className="text-2xl font-bold text-emerald-600">
                            {patients.filter(p => new Date(p.created_at).getMonth() === new Date().getMonth()).length}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {view === 'users' && user.role === 'admin' && (
            <motion.div 
              key="users"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <header className="flex justify-between items-center">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
                  <p className="text-gray-500">Manage doctors, staff, and administrators.</p>
                </div>
                <button 
                  onClick={() => { setIsAddingUser(true); setUserForm({ id: undefined, username: '', password: '', role: 'staff', full_name: '' }); }}
                  className="bg-emerald-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" /> Add New User
                </button>
              </header>

              <div className="bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Full Name</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Username</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Role</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {allUsers.map(u => (
                      <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${u.role === 'admin' ? 'bg-purple-100 text-purple-600' : u.role === 'doctor' ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'}`}>
                              {u.full_name.charAt(0)}
                            </div>
                            <span className="font-bold text-gray-900">{u.full_name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">{u.username}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${u.role === 'admin' ? 'bg-purple-50 text-purple-600' : u.role === 'doctor' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => { setIsAddingUser(true); setUserForm({ ...u, password: '' }); }}
                              className="p-2 hover:bg-blue-50 text-blue-600 rounded-xl transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => deleteUser(u.id)}
                              className="p-2 hover:bg-red-50 text-red-600 rounded-xl transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {view === 'audit' && user.role === 'admin' && (
            <motion.div 
              key="audit"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <header className="flex justify-between items-center">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
                  <p className="text-gray-500">Track system activities and user actions with IP addresses.</p>
                </div>
                <button 
                  onClick={() => fetchAuditLogs()}
                  className="p-3 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50 transition-all shadow-sm"
                >
                  <RefreshCw className="w-5 h-5 text-gray-500" />
                </button>
              </header>

              <div className="bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50">
                      <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Timestamp</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">User</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Action</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">IP Address</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {auditLogs.map(log => (
                      <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 text-xs text-gray-500 font-medium">
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-xs font-bold text-gray-600">
                              {log.username ? log.username.charAt(0).toUpperCase() : '?'}
                            </div>
                            <span className="text-sm font-bold text-gray-900">{log.username || 'System'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            log.action.includes('FAILED') ? 'bg-red-50 text-red-600' : 
                            log.action.includes('ADD') ? 'bg-emerald-50 text-emerald-600' : 
                            log.action.includes('EDIT') ? 'bg-blue-50 text-blue-600' : 
                            'bg-gray-50 text-gray-600'
                          }`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs font-mono text-gray-500">
                          {log.ip_address}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {log.details}
                        </td>
                      </tr>
                    ))}
                    {auditLogs.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                          No audit logs found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {view === 'settings' && user.role === 'admin' && (
            <motion.div 
              key="settings"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <header className="flex justify-between items-end">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
                  <p className="text-gray-500">Configure clinic rules and prescription design.</p>
                </div>
                <div className="flex bg-white p-1 rounded-2xl border border-gray-100 shadow-sm">
                  <button 
                    onClick={() => setSettingsTab('permissions')}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${settingsTab === 'permissions' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-100' : 'text-gray-500 hover:bg-gray-50'}`}
                  >
                    Permissions
                  </button>
                  <button 
                    onClick={() => setSettingsTab('template')}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${settingsTab === 'template' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-100' : 'text-gray-500 hover:bg-gray-50'}`}
                  >
                    Prescription Template
                  </button>
                </div>
              </header>

              {settingsTab === 'permissions' ? (
                <div className="grid grid-cols-1 gap-6">
                  {allPermissions.map(p => (
                    <div key={p.role} className="bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden">
                      <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                        <h3 className="font-bold text-gray-900 capitalize">{p.role} Permissions</h3>
                      </div>
                      <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                          { label: 'Add Patients', field: 'can_add_patient' },
                          { label: 'Edit Patients', field: 'can_edit_patient' },
                          { label: 'View Records', field: 'can_view_records' },
                          { label: 'Prescribe Medicine', field: 'can_prescribe' },
                          { label: 'Manage Users', field: 'can_manage_users' },
                          { label: 'Manage Appointments', field: 'can_manage_appointments' },
                          { label: 'Manage Billing', field: 'can_manage_billing' },
                        ].map(item => (
                          <div key={item.field} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                            <span className="text-sm font-medium text-gray-700">{item.label}</span>
                            <button 
                              onClick={() => updatePermission(p.role, item.field as keyof Permissions, p[item.field as keyof Permissions] === 1 ? 0 : 1)}
                              className={`w-12 h-6 rounded-full transition-all relative ${p[item.field as keyof Permissions] === 1 ? 'bg-emerald-500' : 'bg-gray-300'}`}
                            >
                              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${p[item.field as keyof Permissions] === 1 ? 'left-7' : 'left-1'}`} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white p-8 rounded-3xl border border-black/5 shadow-sm space-y-6">
                    <h3 className="text-xl font-bold text-gray-900">Design Template</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Clinic Name</label>
                        <input 
                          type="text" 
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                          value={templateSettings.clinicName}
                          onChange={e => setTemplateSettings({ ...templateSettings, clinicName: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Clinic Subtitle</label>
                        <input 
                          type="text" 
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                          value={templateSettings.clinicSubtitle}
                          onChange={e => setTemplateSettings({ ...templateSettings, clinicSubtitle: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Address</label>
                        <textarea 
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 h-20"
                          value={templateSettings.address}
                          onChange={e => setTemplateSettings({ ...templateSettings, address: e.target.value })}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Phone</label>
                          <input 
                            type="text" 
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                            value={templateSettings.phone}
                            onChange={e => setTemplateSettings({ ...templateSettings, phone: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Primary Color</label>
                          <div className="flex gap-2">
                            <input 
                              type="color" 
                              className="w-12 h-12 p-1 bg-white border border-gray-200 rounded-xl cursor-pointer"
                              value={templateSettings.primaryColor}
                              onChange={e => setTemplateSettings({ ...templateSettings, primaryColor: e.target.value })}
                            />
                            <input 
                              type="text" 
                              className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-sm"
                              value={templateSettings.primaryColor}
                              onChange={e => setTemplateSettings({ ...templateSettings, primaryColor: e.target.value })}
                            />
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Footer Text</label>
                        <textarea 
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 h-20"
                          value={templateSettings.footerText}
                          onChange={e => setTemplateSettings({ ...templateSettings, footerText: e.target.value })}
                        />
                      </div>
                      <button 
                        onClick={saveTemplateSettings}
                        className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all"
                      >
                        Save Template Settings
                      </button>
                    </div>
                  </div>

                  <div className="bg-white p-8 rounded-3xl border border-black/5 shadow-sm">
                    <h3 className="text-xl font-bold text-gray-900 mb-6">Live Preview</h3>
                    <div className="border border-gray-200 rounded-2xl p-8 scale-75 origin-top bg-white shadow-inner">
                      <div className="border-b-2 pb-4 mb-6 flex justify-between items-start" style={{ borderColor: templateSettings.primaryColor }}>
                        <div>
                          <h1 className="text-2xl font-bold mb-1" style={{ color: templateSettings.primaryColor }}>{templateSettings.clinicName}</h1>
                          <p className="text-xs text-gray-500 italic">{templateSettings.clinicSubtitle}</p>
                          <p className="text-[10px] text-gray-400 mt-2">{templateSettings.address}</p>
                          <p className="text-[10px] text-gray-400">Phone: {templateSettings.phone}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-sm">Dr. Sarah Smith</p>
                          <p className="text-[10px] text-emerald-600">Specialist Physician</p>
                        </div>
                      </div>
                      <div className="h-40 bg-gray-50 rounded-lg flex items-center justify-center border border-dashed border-gray-200">
                        <p className="text-gray-400 text-xs">Patient details & prescription content</p>
                      </div>
                      <div className="mt-8 pt-4 border-t border-gray-100">
                        <p className="text-[10px] text-gray-400 text-center italic">{templateSettings.footerText}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Add/Edit Patient Modal */}
      {isAddingPatient && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">{isEditingPatient ? 'Edit Patient' : 'Add New Patient'}</h3>
              <button onClick={() => { setIsAddingPatient(false); setIsEditingPatient(false); }} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAddPatient} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Full Name</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                    value={patientForm.name}
                    onChange={e => setPatientForm({ ...patientForm, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Age</label>
                  <input 
                    type="number" 
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                    value={patientForm.age}
                    onChange={e => setPatientForm({ ...patientForm, age: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Gender</label>
                  <select 
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                    value={patientForm.gender}
                    onChange={e => setPatientForm({ ...patientForm, gender: e.target.value })}
                  >
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Date of Birth</label>
                  <input 
                    type="date" 
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                    value={patientForm.dob}
                    onChange={e => setPatientForm({ ...patientForm, dob: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">City</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                    value={patientForm.city}
                    onChange={e => setPatientForm({ ...patientForm, city: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Country</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                    value={patientForm.country}
                    onChange={e => setPatientForm({ ...patientForm, country: e.target.value })}
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Phone Number</label>
                  <input 
                    type="tel" 
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                    value={patientForm.phone}
                    onChange={e => setPatientForm({ ...patientForm, phone: e.target.value })}
                    required
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Email</label>
                  <input 
                    type="email" 
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                    value={patientForm.email}
                    onChange={e => setPatientForm({ ...patientForm, email: e.target.value })}
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">NHS Number</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                    value={patientForm.nhs_no}
                    onChange={e => setPatientForm({ ...patientForm, nhs_no: e.target.value })}
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Address</label>
                  <textarea 
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 h-20"
                    value={patientForm.address}
                    onChange={e => setPatientForm({ ...patientForm, address: e.target.value })}
                  />
                </div>
                <div className="col-span-2 border-t border-gray-100 pt-4">
                  <label className="block text-sm font-bold text-gray-900 mb-2">Allergies</label>
                  <textarea 
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 h-20"
                    placeholder="e.g. Peanuts, Penicillin..."
                    value={patientForm.allergies}
                    onChange={e => setPatientForm({ ...patientForm, allergies: e.target.value })}
                  />
                  <input 
                    type="text"
                    placeholder="Doctor's comment on allergies..."
                    className="w-full mt-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500 italic"
                    value={patientForm.allergy_comment}
                    onChange={e => setPatientForm({ ...patientForm, allergy_comment: e.target.value })}
                  />
                </div>
              </div>
              <button type="submit" className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all sticky bottom-0">
                Save Patient Record
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* Complaint Wizard Modal */}
      <AnimatePresence>
        {isAddingComplaint && selectedPatient && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-5xl h-[85vh] overflow-hidden flex"
            >
              {/* Sidebar Navigation */}
              <div className="w-80 bg-gray-50 border-r border-gray-100 flex flex-col h-full">
                <div className="p-6 border-b border-gray-100 bg-white">
                  <h3 className="text-xl font-bold text-gray-900">Clinical Sections</h3>
                  <p className="text-sm text-gray-500 mt-1">Patient: {selectedPatient.name}</p>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-1">
                  {[
                    { step: 1, label: 'Presenting Complaints' },
                    { step: 2, label: 'Medical History' },
                    { step: 3, label: 'Family History' },
                    { step: 4, label: 'Social History' },
                    { step: 5, label: 'Current Medication' },
                    { step: 6, label: 'Allergies' },
                    { step: 7, label: 'Examinations' },
                    { step: 8, label: 'Diagnosis Value' },
                    { step: 9, label: 'Diagnosis Comment' },
                    { step: 10, label: 'Plan & Follow up' },
                    { step: 11, label: 'Medications' },
                    { step: 12, label: 'Services' },
                    { step: 13, label: 'Final Remarks' },
                  ].map(item => (
                    <button
                      key={item.step}
                      onClick={() => setComplaintStep(item.step)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${
                        complaintStep === item.step 
                          ? 'bg-emerald-100 text-emerald-700 font-bold shadow-sm' 
                          : 'hover:bg-gray-200 text-gray-600 font-medium'
                      }`}
                    >
                      <Eye className={`w-4 h-4 ${complaintStep === item.step ? 'text-emerald-600' : 'text-gray-400'}`} />
                      <span className="text-sm uppercase tracking-wider">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Main Content Area */}
              <div className="flex-1 flex flex-col h-full bg-white">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">
                      {complaintStep === 1 ? 'Presenting Complaints' : 
                       complaintStep === 2 ? 'Medical History' : 
                       complaintStep === 3 ? 'Family History' :
                       complaintStep === 4 ? 'Social History' :
                       complaintStep === 5 ? 'Current Medication' : 
                       complaintStep === 6 ? 'Allergies' :
                       complaintStep === 7 ? 'Examinations' :
                       complaintStep === 8 ? 'Diagnosis Value' :
                       complaintStep === 9 ? 'Diagnosis Comment' :
                       complaintStep === 10 ? 'Plan & Follow up' :
                       complaintStep === 11 ? 'Medications' : 
                       complaintStep === 12 ? 'Services' : 'Final Remarks'}
                    </h3>
                    <p className="text-sm text-gray-500">Step {complaintStep} of 13</p>
                  </div>
                  <button 
                    onClick={() => setIsAddingComplaint(false)}
                    className="p-3 hover:bg-gray-100 rounded-2xl transition-all text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8">
                  {complaintStep === 1 && (

                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                    <div className="space-y-4">
                      <label className="block text-sm font-bold text-gray-700 uppercase tracking-wider">Presenting Complaints</label>
                      <textarea 
                        className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-3xl outline-none focus:ring-2 focus:ring-emerald-500 h-32 transition-all"
                        placeholder="Describe the patient's current complaints..."
                        value={complaintForm.presenting_complaints}
                        onChange={e => setComplaintForm({ ...complaintForm, presenting_complaints: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Condition Type</label>
                        <select 
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                          value={complaintForm.condition_type}
                          onChange={e => setComplaintForm({ ...complaintForm, condition_type: e.target.value as any })}
                        >
                          <option value="Acute">Acute</option>
                          <option value="Chronic">Chronic</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Condition Significance</label>
                        <select 
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                          value={complaintForm.condition_significance}
                          onChange={e => setComplaintForm({ ...complaintForm, condition_significance: e.target.value as any })}
                        >
                          <option value="Minor">Minor</option>
                          <option value="Significance">Significance</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Condition Status</label>
                        <select 
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                          value={complaintForm.condition_status}
                          onChange={e => setComplaintForm({ ...complaintForm, condition_status: e.target.value as any })}
                        >
                          <option value="Stable">Stable</option>
                          <option value="Critical">Critical</option>
                          <option value="Improving">Improving</option>
                          <option value="Deteriorating">Deteriorating</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Medical Treatment</label>
                        <input 
                          type="text"
                          className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-3xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                          placeholder="e.g. Initial Consultation..."
                          value={complaintForm.medical_treatment}
                          onChange={e => setComplaintForm({ ...complaintForm, medical_treatment: e.target.value })}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {complaintStep === 2 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                    <div className="border border-gray-300 rounded-lg overflow-hidden">
                      <div className="bg-blue-100 p-2 flex items-center justify-between border-b border-gray-300">
                        <h4 className="font-bold text-sm uppercase tracking-wider">Medical History</h4>
                        <Edit className="w-4 h-4 text-gray-600" />
                      </div>
                      <div className="grid grid-cols-2">
                        <div className="bg-gray-100 p-2 text-xs font-bold border-b border-r border-gray-300">MEDICAL HISTORY</div>
                        <div className="bg-gray-100 p-2 text-xs font-bold border-b border-gray-300">Comments</div>
                        
                        <div className="p-0 border-r border-gray-300">
                          <textarea 
                            className="w-full p-2 text-sm outline-none h-32 resize-none"
                            placeholder="Enter medical history..."
                            value={complaintForm.medical_history}
                            onChange={e => setComplaintForm({ ...complaintForm, medical_history: e.target.value })}
                          />
                        </div>
                        <div className="p-0">
                          <textarea 
                            className="w-full p-2 text-sm outline-none h-32 resize-none"
                            placeholder="Add comments..."
                            value={complaintForm.medical_history_comment}
                            onChange={e => setComplaintForm({ ...complaintForm, medical_history_comment: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {complaintStep === 3 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                    <div className="border border-gray-300 rounded-lg overflow-hidden">
                      <div className="bg-purple-100 p-2 flex items-center justify-between border-b border-gray-300">
                        <h4 className="font-bold text-sm uppercase tracking-wider">Family History</h4>
                        <Edit className="w-4 h-4 text-gray-600" />
                      </div>
                      <div className="grid grid-cols-2">
                        <div className="bg-gray-100 p-2 text-xs font-bold border-b border-r border-gray-300">FAMILY HISTORY</div>
                        <div className="bg-gray-100 p-2 text-xs font-bold border-b border-gray-300">Comments</div>
                        
                        <div className="p-0 border-r border-gray-300">
                          <textarea 
                            className="w-full p-2 text-sm outline-none h-32 resize-none"
                            placeholder="Enter family history..."
                            value={complaintForm.family_history}
                            onChange={e => setComplaintForm({ ...complaintForm, family_history: e.target.value })}
                          />
                        </div>
                        <div className="p-0">
                          <textarea 
                            className="w-full p-2 text-sm outline-none h-32 resize-none"
                            placeholder="Add comments..."
                            value={complaintForm.family_history_comment}
                            onChange={e => setComplaintForm({ ...complaintForm, family_history_comment: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {complaintStep === 4 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                    <div className="border border-gray-300 rounded-lg overflow-hidden">
                      <div className="bg-gray-200 p-2 flex items-center justify-between border-b border-gray-300">
                        <h4 className="font-bold text-sm uppercase tracking-wider">Social History</h4>
                        <Edit className="w-4 h-4 text-gray-600" />
                      </div>
                      <div className="grid grid-cols-2">
                        <div className="bg-gray-100 p-2 text-xs font-bold border-b border-r border-gray-300">SOCIAL HISTORY</div>
                        <div className="bg-gray-100 p-2 text-xs font-bold border-b border-gray-300">Comments</div>
                        
                        <div className="p-0 border-r border-gray-300">
                          <textarea 
                            className="w-full p-2 text-sm outline-none h-32 resize-none"
                            placeholder="Enter social history..."
                            value={complaintForm.social_history}
                            onChange={e => setComplaintForm({ ...complaintForm, social_history: e.target.value })}
                          />
                        </div>
                        <div className="p-0">
                          <textarea 
                            className="w-full p-2 text-sm outline-none h-32 resize-none"
                            placeholder="Add comments..."
                            value={complaintForm.social_history_comment}
                            onChange={e => setComplaintForm({ ...complaintForm, social_history_comment: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {complaintStep === 5 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                    <div className="border border-gray-300 rounded-lg overflow-hidden">
                      <div className="bg-emerald-100 p-2 flex items-center justify-between border-b border-gray-300">
                        <h4 className="font-bold text-sm uppercase tracking-wider">Current Medication</h4>
                        <Edit className="w-4 h-4 text-gray-600" />
                      </div>
                      <div className="grid grid-cols-3">
                        <div className="bg-gray-100 p-2 text-xs font-bold border-b border-r border-gray-300">CURRENT MEDICATION</div>
                        <div className="bg-gray-100 p-2 text-xs font-bold border-b border-r border-gray-300">Relationship</div>
                        <div className="bg-gray-100 p-2 text-xs font-bold border-b border-gray-300">Comments</div>
                        
                        <div className="p-0 border-r border-gray-300">
                          <textarea 
                            className="w-full p-2 text-sm outline-none h-32 resize-none"
                            placeholder="Enter current medication..."
                            value={complaintForm.current_medication}
                            onChange={e => setComplaintForm({ ...complaintForm, current_medication: e.target.value })}
                          />
                        </div>
                        <div className="p-0 border-r border-gray-300">
                          <textarea 
                            className="w-full p-2 text-sm outline-none h-32 resize-none"
                            placeholder="Relationship..."
                            value={complaintForm.current_medication_relationship}
                            onChange={e => setComplaintForm({ ...complaintForm, current_medication_relationship: e.target.value })}
                          />
                        </div>
                        <div className="p-0">
                          <textarea 
                            className="w-full p-2 text-sm outline-none h-32 resize-none"
                            placeholder="Add comments..."
                            value={complaintForm.current_medication_comment}
                            onChange={e => setComplaintForm({ ...complaintForm, current_medication_comment: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {complaintStep === 6 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                    <div className="border border-gray-300 rounded-lg overflow-hidden">
                      <div className="bg-yellow-100 p-2 flex items-center justify-between border-b border-gray-300">
                        <h4 className="font-bold text-sm uppercase tracking-wider">Allergy</h4>
                        <Edit className="w-4 h-4 text-gray-600" />
                      </div>
                      <div className="grid grid-cols-3">
                        <div className="bg-gray-100 p-2 text-xs font-bold border-b border-r border-gray-300">ALLERGY</div>
                        <div className="bg-gray-100 p-2 text-xs font-bold border-b border-r border-gray-300">Severity</div>
                        <div className="bg-gray-100 p-2 text-xs font-bold border-b border-gray-300">Comments</div>
                        
                        <div className="p-0 border-r border-gray-300">
                          <textarea 
                            className="w-full p-2 text-sm outline-none h-32 resize-none"
                            placeholder="Enter allergy..."
                            value={complaintForm.allergy_name}
                            onChange={e => setComplaintForm({ ...complaintForm, allergy_name: e.target.value })}
                          />
                        </div>
                        <div className="p-2 border-r border-gray-300 flex flex-col gap-2">
                          <label className="flex items-center gap-2 text-sm cursor-pointer">
                            <input 
                              type="radio" 
                              name="severity" 
                              value="Mild" 
                              checked={complaintForm.allergy_severity === 'Mild'}
                              onChange={() => setComplaintForm({ ...complaintForm, allergy_severity: 'Mild' })}
                            /> Mild
                          </label>
                          <label className="flex items-center gap-2 text-sm cursor-pointer">
                            <input 
                              type="radio" 
                              name="severity" 
                              value="High" 
                              checked={complaintForm.allergy_severity === 'High'}
                              onChange={() => setComplaintForm({ ...complaintForm, allergy_severity: 'High' })}
                            /> High
                          </label>
                        </div>
                        <div className="p-0">
                          <textarea 
                            className="w-full p-2 text-sm outline-none h-32 resize-none"
                            placeholder="Add comments..."
                            value={complaintForm.allergy_comment}
                            onChange={e => setComplaintForm({ ...complaintForm, allergy_comment: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {complaintStep === 7 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                    <div className="border border-gray-300 rounded-lg overflow-hidden">
                      <div className="bg-orange-100 p-2 flex items-center justify-between border-b border-gray-300">
                        <h4 className="font-bold text-sm uppercase tracking-wider">Examinations</h4>
                        <Edit className="w-4 h-4 text-gray-600" />
                      </div>
                      <div className="grid grid-cols-3">
                        <div className="bg-gray-100 p-2 text-xs font-bold border-b border-r border-gray-300">EXAMINATIONS</div>
                        <div className="bg-gray-100 p-2 text-xs font-bold border-b border-r border-gray-300">Values</div>
                        <div className="bg-gray-100 p-2 text-xs font-bold border-b border-gray-300">Comments</div>
                        
                        <div className="p-0 border-r border-gray-300">
                          <select 
                            className="w-full p-2 text-sm outline-none border-b border-gray-200"
                            value={complaintForm.examinations}
                            onChange={e => setComplaintForm({ ...complaintForm, examinations: e.target.value as any })}
                          >
                            <option value="all clear">All Clear</option>
                            <option value="none">None</option>
                          </select>
                        </div>
                        <div className="p-0 border-r border-gray-300">
                          <textarea 
                            className="w-full p-2 text-sm outline-none h-32 resize-none"
                            placeholder="Values..."
                            value={complaintForm.examinations_value}
                            onChange={e => setComplaintForm({ ...complaintForm, examinations_value: e.target.value })}
                          />
                        </div>
                        <div className="p-0">
                          <textarea 
                            className="w-full p-2 text-sm outline-none h-32 resize-none"
                            placeholder="Add comments..."
                            value={complaintForm.examinations_comment}
                            onChange={e => setComplaintForm({ ...complaintForm, examinations_comment: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {complaintStep === 8 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Diagnosis Value</label>
                      <select 
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                        value={complaintForm.diagnosis_value}
                        onChange={e => setComplaintForm({ ...complaintForm, diagnosis_value: e.target.value as any })}
                      >
                        <option value="clear">Clear</option>
                        <option value="non clear">Non Clear</option>
                      </select>
                    </div>
                  </motion.div>
                )}

                {complaintStep === 9 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                    <div className="space-y-4">
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Doctor Comment on Diagnosis</label>
                      <textarea 
                        className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-3xl outline-none focus:ring-2 focus:ring-emerald-500 h-32 transition-all"
                        placeholder="Add diagnosis comments..."
                        value={complaintForm.diagnosis_comment}
                        onChange={e => setComplaintForm({ ...complaintForm, diagnosis_comment: e.target.value })}
                      />
                    </div>
                  </motion.div>
                )}

                {complaintStep === 10 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Plan & Follow up & Safety Net</label>
                      <select 
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                        value={complaintForm.plan_value}
                        onChange={e => setComplaintForm({ ...complaintForm, plan_value: e.target.value as any })}
                      >
                        <option value="all clear">All Clear</option>
                        <option value="none">None</option>
                      </select>
                    </div>
                    <div className="space-y-4">
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Doctor Comment</label>
                      <textarea 
                        className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-3xl outline-none focus:ring-2 focus:ring-emerald-500 h-32 transition-all"
                        placeholder="Add plan comments..."
                        value={complaintForm.plan_comment}
                        onChange={e => setComplaintForm({ ...complaintForm, plan_comment: e.target.value })}
                      />
                    </div>
                  </motion.div>
                )}

                {complaintStep === 11 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                    <div className="bg-gray-50 p-6 rounded-3xl space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <input 
                          type="text" 
                          placeholder="Medicine Name"
                          className="px-4 py-2 rounded-xl border border-gray-200"
                          id="new-med-name"
                        />
                        <input 
                          type="text" 
                          placeholder="Dosage"
                          className="px-4 py-2 rounded-xl border border-gray-200"
                          id="new-med-dosage"
                        />
                        <input 
                          type="text" 
                          placeholder="Quantity"
                          className="px-4 py-2 rounded-xl border border-gray-200"
                          id="new-med-qty"
                        />
                        <input 
                          type="text" 
                          placeholder="Frequency"
                          className="px-4 py-2 rounded-xl border border-gray-200"
                          id="new-med-freq"
                        />
                      </div>
                      <textarea 
                        placeholder="Doctor Comment"
                        className="w-full px-4 py-2 rounded-xl border border-gray-200 h-20"
                        id="new-med-comment"
                      />
                      <button 
                        onClick={() => {
                          const name = (document.getElementById('new-med-name') as HTMLInputElement).value;
                          const dosage = (document.getElementById('new-med-dosage') as HTMLInputElement).value;
                          const qty = (document.getElementById('new-med-qty') as HTMLInputElement).value;
                          const freq = (document.getElementById('new-med-freq') as HTMLInputElement).value;
                          const comment = (document.getElementById('new-med-comment') as HTMLTextAreaElement).value;
                          if (name) {
                            setMedicines([...medicines, { name, dosage, frequency: freq, duration: '', quantity: qty, comment }]);
                            (document.getElementById('new-med-name') as HTMLInputElement).value = '';
                            (document.getElementById('new-med-dosage') as HTMLInputElement).value = '';
                            (document.getElementById('new-med-qty') as HTMLInputElement).value = '';
                            (document.getElementById('new-med-freq') as HTMLInputElement).value = '';
                            (document.getElementById('new-med-comment') as HTMLTextAreaElement).value = '';
                          }
                        }}
                        className="w-full bg-emerald-600 text-white py-2 rounded-xl font-bold"
                      >
                        Add Medicine
                      </button>
                    </div>
                    <div className="space-y-2">
                      {medicines.map((m, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl">
                          <div>
                            <p className="font-bold text-sm">{m.name} - {m.dosage} ({m.quantity})</p>
                            <p className="text-xs text-gray-500">{m.comment}</p>
                          </div>
                          <button onClick={() => setMedicines(medicines.filter((_, i) => i !== idx))} className="text-red-500"><X className="w-4 h-4" /></button>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {complaintStep === 12 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                    <div className="space-y-4">
                      <label className="block text-sm font-bold text-gray-700 uppercase tracking-wider">Services</label>
                      <textarea 
                        className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-3xl outline-none focus:ring-2 focus:ring-emerald-500 h-32 transition-all"
                        placeholder="Enter services provided..."
                        value={complaintForm.services}
                        onChange={e => setComplaintForm({ ...complaintForm, services: e.target.value })}
                      />
                    </div>
                    <div className="space-y-4">
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Doctor Comment</label>
                      <input 
                        type="text"
                        className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-3xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                        placeholder="Add services comments..."
                        value={complaintForm.services_comment}
                        onChange={e => setComplaintForm({ ...complaintForm, services_comment: e.target.value })}
                      />
                    </div>
                  </motion.div>
                )}

                {complaintStep === 13 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                    <div className="space-y-4">
                      <label className="block text-sm font-bold text-gray-700 uppercase tracking-wider">Final Remarks & Attachments</label>
                      <textarea 
                        className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-3xl outline-none focus:ring-2 focus:ring-emerald-500 h-24 transition-all"
                        placeholder="Any final remarks or comments..."
                        value={complaintForm.comments}
                        onChange={e => setComplaintForm({ ...complaintForm, comments: e.target.value })}
                      />
                    </div>
                    
                    <div className="space-y-4">
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Attachments (PDF/PNG)</label>
                      <input 
                        type="file" 
                        multiple 
                        accept=".pdf,.png"
                        onChange={(e) => {
                          const files = e.target.files;
                          if (!files) return;
                          Array.from(files).forEach((file: File) => {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              const data = event.target?.result as string;
                              setComplaintForm(prev => ({
                                ...prev,
                                attachments: [...prev.attachments, { name: file.name, data, type: file.type }]
                              }));
                            };
                            reader.readAsDataURL(file);
                          });
                        }}
                        className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                      />
                      <div className="flex flex-wrap gap-2">
                        {complaintForm.attachments.map((file, idx) => (
                          <div key={idx} className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full text-xs">
                            <span className="truncate max-w-[150px]">{file.name}</span>
                            <button 
                              type="button" 
                              onClick={() => setComplaintForm(prev => ({ ...prev, attachments: prev.attachments.filter((_, i) => i !== idx) }))}
                              className="text-red-500 hover:text-red-700"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Patient Signature</label>
                      <SignaturePad onSave={(data) => setComplaintForm({ ...complaintForm, signature: data })} />
                    </div>
                  </motion.div>
                )}

                </div>

                <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-4">
                  {complaintForm.id && (
                    <button 
                      onClick={async () => {
                        if (complaintForm.id) {
                          const success = await handleDeleteVisit(complaintForm.id);
                          if (success) {
                            setIsAddingComplaint(false);
                          }
                        }
                      }}
                      className="px-6 py-4 border border-red-200 text-red-600 rounded-3xl font-bold hover:bg-red-50 transition-all flex items-center justify-center gap-2 shadow-sm"
                    >
                      <Trash2 className="w-5 h-5" /> Delete Visit
                    </button>
                  )}
                  {complaintStep > 1 && (
                    <button 
                      onClick={() => setComplaintStep(complaintStep - 1)}
                      className="flex-1 px-8 py-4 border border-gray-200 text-gray-600 rounded-3xl font-bold hover:bg-white transition-all flex items-center justify-center gap-2 shadow-sm"
                    >
                      <ChevronLeft className="w-5 h-5" /> Back
                    </button>
                  )}
                  <button 
                    onClick={async () => {
                      if (complaintStep < 13) {
                        setComplaintStep(complaintStep + 1);
                      } else {
                        // Final Save
                        try {
                          // 1. Update Patient History
                          await fetch(`/api/patients/${selectedPatient.id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              ...selectedPatient,
                              medical_history: complaintForm.medical_history,
                              medical_history_comment: complaintForm.medical_history_comment,
                              family_history: complaintForm.family_history,
                              family_history_comment: complaintForm.family_history_comment,
                              social_history: complaintForm.social_history,
                              social_history_comment: complaintForm.social_history_comment,
                              current_medication: complaintForm.current_medication,
                              current_medication_comment: complaintForm.current_medication_comment,
                              current_medication_relationship: complaintForm.current_medication_relationship,
                              allergies: JSON.stringify({ allergy: complaintForm.allergy_name, severity: complaintForm.allergy_severity, history: '' }),
                              allergy_comment: complaintForm.allergy_comment
                            })
                          });

                          // 2. Create or Update a Visit
                          const method = complaintForm.id ? 'PUT' : 'POST';
                          const url = complaintForm.id ? `/api/visits/${complaintForm.id}` : '/api/visits';
                          
                          await fetch(url, {
                            method,
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              patient_id: selectedPatient.id,
                              doctor_id: user?.id,
                              presenting_condition: complaintForm.presenting_complaints,
                              condition_status: complaintForm.condition_status,
                              medical_treatment: complaintForm.medical_treatment,
                              complaints: complaintForm.presenting_complaints,
                              diagnosis: complaintForm.diagnosis_comment || 'Pending Evaluation',
                              comments: complaintForm.comments || 'Added via Merged Wizard',
                              condition_type: complaintForm.condition_type,
                              condition_significance: complaintForm.condition_significance,
                              examinations: complaintForm.examinations,
                              examinations_value: complaintForm.examinations_value,
                              examinations_comment: complaintForm.examinations_comment,
                              diagnosis_value: complaintForm.diagnosis_value,
                              diagnosis_comment: complaintForm.diagnosis_comment,
                              plan_value: complaintForm.plan_value,
                              plan_comment: complaintForm.plan_comment,
                              services: complaintForm.services,
                              services_comment: complaintForm.services_comment,
                              current_medication_relationship: complaintForm.current_medication_relationship,
                              medical_history: complaintForm.medical_history,
                              medical_history_comment: complaintForm.medical_history_comment,
                              family_history: complaintForm.family_history,
                              family_history_comment: complaintForm.family_history_comment,
                              social_history: complaintForm.social_history,
                              social_history_comment: complaintForm.social_history_comment,
                              allergies: JSON.stringify({ allergy: complaintForm.allergy_name, severity: complaintForm.allergy_severity, history: '' }),
                              allergy_comment: complaintForm.allergy_comment,
                              medicines: JSON.stringify(medicines),
                              tests: JSON.stringify(tests),
                              signature: complaintForm.signature,
                              attachments: JSON.stringify(complaintForm.attachments)
                            })
                          });

                          setIsAddingComplaint(false);
                          fetchPatients();
                          
                          // Refresh current patient view
                          const updatedPatientRes = await fetch(`/api/patients?search=#${selectedPatient.id}`);
                          const updatedPatients = await updatedPatientRes.json();
                          if (updatedPatients.length > 0) {
                            setSelectedPatient(updatedPatients[0]);
                          }
                          const visitsRes = await fetch(`/api/patients/${selectedPatient.id}/visits`);
                          const visitsData = await visitsRes.json();
                          setCurrentVisits(visitsData);

                          alert(complaintForm.id ? 'Visit updated successfully!' : 'New Visit recorded successfully!');
                          
                          // Automatically trigger history print
                          setTimeout(printPatientHistory, 500);
                        } catch (err) {
                          console.error(err);
                          alert('Failed to save visit data.');
                        }
                      }
                    }}
                    className="flex-[2] px-8 py-4 bg-emerald-600 text-white rounded-3xl font-bold hover:bg-emerald-700 shadow-xl shadow-emerald-100 transition-all flex items-center justify-center gap-2"
                  >
                    {complaintStep === 13 ? 'Finish & Save' : 'Next Step'} <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Print Preview Modal */}
      {printingVisit && selectedPatient && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
          <div className="bg-white w-full max-w-3xl rounded-3xl overflow-hidden flex flex-col h-[90vh]">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white">
              <h3 className="font-bold text-gray-900">Prescription Preview</h3>
              <div className="flex gap-2">
                <button 
                  onClick={generatePDF}
                  className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" /> Download PDF
                </button>
                <button 
                  onClick={() => window.print()}
                  className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" /> Print
                </button>
                <button onClick={() => setPrintingVisit(null)} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-5 h-5" /></button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-12 bg-gray-50">
              <div id="prescription-print" className="bg-white shadow-2xl mx-auto p-12 w-full max-w-[210mm] min-h-[297mm] text-gray-900 font-serif">
                {/* Header */}
                <div className="border-b-2 pb-6 mb-8 flex justify-between items-start" style={{ borderColor: templateSettings.primaryColor }}>
                  <div>
                    <h1 className="text-4xl font-bold mb-1" style={{ color: templateSettings.primaryColor }}>{templateSettings.clinicName}</h1>
                    <p className="text-sm text-gray-500 italic">{templateSettings.clinicSubtitle}</p>
                    <p className="text-xs text-gray-400 mt-2 whitespace-pre-line">{templateSettings.address}</p>
                    <p className="text-xs text-gray-400">Phone: {templateSettings.phone}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">{printingVisit.doctor_name}</p>
                    <p className="text-sm" style={{ color: templateSettings.primaryColor }}>Specialist Physician</p>
                    <p className="text-xs text-gray-400 mt-4">Date: {new Date(printingVisit.created_at).toLocaleDateString()}</p>
                  </div>
                </div>

                {/* Patient Info */}
                <div className="grid grid-cols-2 gap-x-8 gap-y-4 bg-gray-50 p-6 rounded-lg mb-8 text-sm">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-gray-400">Patient Name</p>
                    <p className="font-bold">{selectedPatient.name}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-gray-400">Age / Gender</p>
                    <p className="font-bold">{selectedPatient.age} yrs / {selectedPatient.gender}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-gray-400">Location</p>
                    <p className="font-bold">{selectedPatient.city}, {selectedPatient.country}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-gray-400">Contact</p>
                    <p className="font-bold">{selectedPatient.phone}</p>
                  </div>
                  <div className="col-span-2 border-t border-gray-200 pt-2">
                    <p className="text-[10px] uppercase font-bold text-gray-400">Address</p>
                    <p className="font-bold">{selectedPatient.address}</p>
                  </div>
                </div>

                {/* Clinical Details */}
                <div className="space-y-8">
                  <div className="grid grid-cols-2 gap-8">
                    <div>
                      <h3 className="text-lg font-bold border-b border-gray-200 pb-1 mb-3" style={{ color: templateSettings.primaryColor }}>Clinical Background</h3>
                      <div className="space-y-3">
                        <div>
                          <p className="text-[10px] uppercase font-bold text-gray-400">Medical History</p>
                          <p className="text-xs">{selectedPatient.medical_history || 'None reported'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-bold text-gray-400">Family History</p>
                          <p className="text-xs">
                            {selectedPatient.family_history ? 
                              `${safeJSONParse(selectedPatient.family_history, { relationship: '' }).relationship}: ${safeJSONParse(selectedPatient.family_history, { history: '' }).history}` : 
                              'None reported'}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-bold text-gray-400">Allergies</p>
                          <p className="text-xs text-red-600 font-bold">
                            {selectedPatient.allergies ? 
                              `${safeJSONParse(selectedPatient.allergies, { allergy: '' }).allergy} (${safeJSONParse(selectedPatient.allergies, { severity: '' }).severity})` : 
                              'None reported'}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold border-b border-gray-200 pb-1 mb-3" style={{ color: templateSettings.primaryColor }}>Current Visit</h3>
                      <div className="space-y-3">
                        <div>
                          <p className="text-[10px] uppercase font-bold text-gray-400">Presenting Condition</p>
                          <p className="text-xs font-bold">{printingVisit.presenting_condition}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-bold text-gray-400">Status</p>
                          <p className="text-xs">{printingVisit.condition_status}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-bold text-gray-400">Treatment</p>
                          <p className="text-xs">{printingVisit.medical_treatment}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold border-b border-gray-200 pb-1 mb-3" style={{ color: templateSettings.primaryColor }}>Findings</h3>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <p className="text-[10px] uppercase font-bold text-gray-400">Chief Complaints</p>
                        <p className="text-sm italic">{printingVisit.complaints}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-gray-400">Diagnosis</p>
                        <p className="text-sm font-medium">{printingVisit.diagnosis}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold border-b border-gray-200 pb-1 mb-3 flex items-center gap-2" style={{ color: templateSettings.primaryColor }}>
                      <span className="text-2xl">℞</span> Prescription
                    </h3>
                    <table className="w-full text-left">
                      <thead>
                        <tr className="text-[10px] uppercase font-bold text-gray-400 border-b border-gray-100">
                          <th className="py-2">Medicine Name</th>
                          <th className="py-2">Dosage</th>
                          <th className="py-2">Frequency</th>
                          <th className="py-2">Duration</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {safeJSONParse(printingVisit.medicines, []).map((m: Medicine, idx: number) => (
                          <tr key={idx} className="text-sm">
                            <td className="py-3 font-bold">{m.name}</td>
                            <td className="py-3">{m.dosage}</td>
                            <td className="py-3">{m.frequency}</td>
                            <td className="py-3">{m.duration}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {safeJSONParse(printingVisit.tests, []).length > 0 && (
                    <div>
                      <h3 className="text-lg font-bold border-b border-gray-200 pb-1 mb-3" style={{ color: templateSettings.primaryColor }}>Recommended Tests</h3>
                      <ul className="list-disc list-inside text-sm space-y-1">
                        {safeJSONParse(printingVisit.tests, []).map((t: string, idx: number) => (
                          <li key={idx}>{t}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {printingVisit.comments && (
                    <div>
                      <h3 className="text-lg font-bold border-b border-gray-200 pb-1 mb-3" style={{ color: templateSettings.primaryColor }}>Final Remarks</h3>
                      <p className="text-sm text-gray-600 leading-relaxed">{printingVisit.comments}</p>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="mt-12 pt-8 border-t border-gray-100">
                  <p className="text-[10px] text-gray-400 text-center italic mb-12">{templateSettings.footerText}</p>
                  <div className="flex justify-between items-end">
                    <div className="text-center">
                      {printingVisit.signature && (
                        <img src={printingVisit.signature} alt="Patient Signature" className="h-12 mx-auto mb-2" />
                      )}
                      <div className="w-40 border-t border-gray-300 pt-1">
                        <p className="text-[10px] uppercase font-bold text-gray-400">Patient Signature</p>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="w-48 border-t border-gray-300 pt-1">
                        <p className="font-bold text-sm">{printingVisit.doctor_name}</p>
                        <p className="text-[10px] uppercase font-bold text-gray-400">Authorized Signature</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit User Modal */}
      {isAddingUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">{userForm.id ? 'Edit User' : 'Add New User'}</h3>
              <button onClick={() => setIsAddingUser(false)} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAddUser} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Full Name</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                  value={userForm.full_name}
                  onChange={e => setUserForm({ ...userForm, full_name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Username</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                  value={userForm.username}
                  onChange={e => setUserForm({ ...userForm, username: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Password {userForm.id && '(Leave blank to keep current)'}</label>
                <input 
                  type="password" 
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                  value={userForm.password}
                  onChange={e => setUserForm({ ...userForm, password: e.target.value })}
                  required={!userForm.id}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Role</label>
                <select 
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                  value={userForm.role}
                  onChange={e => setUserForm({ ...userForm, role: e.target.value as any })}
                >
                  <option value="staff">Staff</option>
                  <option value="doctor">Doctor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <button 
                type="submit" 
                className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all"
              >
                {userForm.id ? 'Update User' : 'Create User'}
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* Print Specific CSS */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #prescription-print, #prescription-print * { visibility: visible; }
          #prescription-print {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 20mm;
            box-shadow: none;
          }
        }
      `}</style>
    </div>
  );
}
