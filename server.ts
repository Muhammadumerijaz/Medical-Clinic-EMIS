import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("clinic.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    role TEXT, -- 'admin', 'doctor', 'staff'
    full_name TEXT
  );

  CREATE TABLE IF NOT EXISTS patients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    age INTEGER,
    gender TEXT,
    phone TEXT,
    email TEXT,
    nhs_no TEXT,
    address TEXT,
    city TEXT,
    country TEXT,
    current_medication TEXT,
    current_medication_comment TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS visits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER,
    doctor_id INTEGER,
    presenting_condition TEXT,
    condition_status TEXT,
    medical_treatment TEXT,
    complaints TEXT,
    diagnosis TEXT,
    medicines TEXT, -- JSON string
    tests TEXT, -- JSON string
    comments TEXT,
    signature TEXT, -- Base64
    attachments TEXT, -- JSON string for files
    condition_type TEXT,
    condition_significance TEXT,
    examinations TEXT,
    examinations_comment TEXT,
    diagnosis_value TEXT,
    diagnosis_comment TEXT,
    plan_value TEXT,
    plan_comment TEXT,
    services TEXT,
    services_comment TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(patient_id) REFERENCES patients(id),
    FOREIGN KEY(doctor_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS permissions (
    role TEXT PRIMARY KEY,
    can_add_patient INTEGER,
    can_edit_patient INTEGER,
    can_view_records INTEGER,
    can_prescribe INTEGER,
    can_manage_users INTEGER,
    can_manage_appointments INTEGER,
    can_manage_billing INTEGER
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    username TEXT,
    action TEXT,
    details TEXT,
    ip_address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER,
    doctor_id INTEGER,
    start_time DATETIME,
    end_time DATETIME,
    title TEXT,
    description TEXT,
    status TEXT, -- 'scheduled', 'completed', 'cancelled'
    FOREIGN KEY(patient_id) REFERENCES patients(id),
    FOREIGN KEY(doctor_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER,
    visit_id INTEGER,
    amount REAL,
    status TEXT, -- 'unpaid', 'paid', 'partially_paid'
    items TEXT, -- JSON string of services/items
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(patient_id) REFERENCES patients(id),
    FOREIGN KEY(visit_id) REFERENCES visits(id)
  );
`);

// Migrations for existing databases
const migrate = () => {
  const tables = {
    patients: ['city', 'country', 'current_medication', 'current_medication_comment', 'email', 'nhs_no'],
    visits: ['presenting_condition', 'condition_status', 'medical_treatment', 'attachments', 'condition_type', 'condition_significance', 'examinations', 'examinations_comment', 'diagnosis_value', 'diagnosis_comment', 'plan_value', 'plan_comment', 'services', 'services_comment'],
    permissions: ['can_manage_appointments', 'can_manage_billing']
  };

  for (const [table, columns] of Object.entries(tables)) {
    const info = db.prepare(`PRAGMA table_info(${table})`).all() as any[];
    const existingColumns = info.map(c => c.name);
    
    for (const col of columns) {
      if (!existingColumns.includes(col)) {
        console.log(`Migrating: Adding column ${col} to ${table}`);
        db.prepare(`ALTER TABLE ${table} ADD COLUMN ${col} TEXT`).run();
      }
    }
  }

  // Ensure admin has all permissions
  db.prepare(`
    UPDATE permissions 
    SET can_add_patient = 1, 
        can_edit_patient = 1, 
        can_view_records = 1, 
        can_prescribe = 1, 
        can_manage_users = 1, 
        can_manage_appointments = 1, 
        can_manage_billing = 1 
    WHERE role = 'admin'
  `).run();
};

migrate();

// Seed initial data if empty
const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get() as { count: number };
if (userCount.count === 0) {
  db.prepare("INSERT INTO users (username, password, role, full_name) VALUES (?, ?, ?, ?)").run("admin", "admin123", "admin", "System Administrator");
  db.prepare("INSERT INTO users (username, password, role, full_name) VALUES (?, ?, ?, ?)").run("doctor1", "doc123", "doctor", "Dr. Sarah Smith");
  db.prepare("INSERT INTO users (username, password, role, full_name) VALUES (?, ?, ?, ?)").run("staff1", "staff123", "staff", "John Doe");

  db.prepare("INSERT INTO permissions (role, can_add_patient, can_edit_patient, can_view_records, can_prescribe, can_manage_users, can_manage_appointments, can_manage_billing) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run("admin", 1, 1, 1, 1, 1, 1, 1);
  db.prepare("INSERT INTO permissions (role, can_add_patient, can_edit_patient, can_view_records, can_prescribe, can_manage_users, can_manage_appointments, can_manage_billing) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run("doctor", 0, 1, 1, 1, 0, 1, 0);
  db.prepare("INSERT INTO permissions (role, can_add_patient, can_edit_patient, can_view_records, can_prescribe, can_manage_users, can_manage_appointments, can_manage_billing) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run("staff", 1, 1, 1, 0, 0, 1, 1);

  const defaultTemplate = {
    clinicName: "Medical Clinic",
    clinicSubtitle: "Advanced Healthcare Solutions",
    address: "123 Medical Plaza, Health City, HC 45678",
    phone: "+1 (555) 000-1111",
    primaryColor: "#047857", // emerald-700
    footerText: "This is a computer generated prescription. No signature is required unless specified."
  };
  db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)").run("prescription_template", JSON.stringify(defaultTemplate));
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  const PORT = 3000;

  // Helper for logging
  const logAction = (req: express.Request, action: string, details: string, userId?: number, username?: string) => {
    try {
      const ip = (req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || '').split(',')[0].trim();
      db.prepare(`
        INSERT INTO audit_logs (user_id, username, action, details, ip_address)
        VALUES (?, ?, ?, ?, ?)
      `).run(userId || null, username || null, action, details, ip);
    } catch (error) {
      console.error("Failed to log action:", error);
    }
  };

  // Auth API
  app.post("/api/login", (req, res) => {
    const { username, password } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE username = ? AND password = ?").get(username, password) as any;
    if (user) {
      const permissions = db.prepare("SELECT * FROM permissions WHERE role = ?").get(user.role);
      logAction(req, "LOGIN", `User ${username} logged in`, user.id, user.username);
      res.json({ user: { id: user.id, username: user.username, role: user.role, full_name: user.full_name }, permissions });
    } else {
      logAction(req, "LOGIN_FAILED", `Failed login attempt for username: ${username}`);
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  // Patients API
  app.get("/api/patients", (req, res) => {
    const search = req.query.search || "";
    let patients;
    if (typeof search === 'string' && search.startsWith('#')) {
      const id = search.substring(1);
      patients = db.prepare("SELECT * FROM patients WHERE id = ?").all(id);
    } else {
      patients = db.prepare("SELECT * FROM patients WHERE name LIKE ? OR phone LIKE ? ORDER BY created_at DESC").all(`%${search}%`, `%${search}%`);
    }
    res.json(patients);
  });

  app.post("/api/patients", (req, res) => {
    const { 
      name, age, gender, phone, email, nhs_no, address, city, country, 
      current_medication, current_medication_comment,
      userId, username 
    } = req.body;
    const result = db.prepare(`
      INSERT INTO patients (
        name, age, gender, phone, email, nhs_no, address, city, country, 
        current_medication, current_medication_comment
      ) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      name, age, gender, phone, email, nhs_no, address, city, country, 
      current_medication, current_medication_comment
    );
    
    logAction(req, "ADD_PATIENT", `Added patient: ${name} (ID: ${result.lastInsertRowid})`, userId, username);
    res.json({ id: result.lastInsertRowid });
  });

  app.put("/api/patients/:id", (req, res) => {
    const { 
      name, age, gender, phone, email, nhs_no, address, city, country, 
      current_medication, current_medication_comment,
      userId, username 
    } = req.body;
    db.prepare(`
      UPDATE patients 
      SET name = ?, age = ?, gender = ?, phone = ?, email = ?, nhs_no = ?, address = ?, city = ?, country = ?, 
          current_medication = ?, current_medication_comment = ?
      WHERE id = ?
    `).run(
      name, age, gender, phone, email, nhs_no, address, city, country, 
      current_medication, current_medication_comment,
      req.params.id
    );
    
    logAction(req, "EDIT_PATIENT", `Edited patient: ${name} (ID: ${req.params.id})`, userId, username);
    res.json({ success: true });
  });

  // Visits API
  app.get("/api/patients/:id/visits", (req, res) => {
    const visits = db.prepare(`
      SELECT v.*, u.full_name as doctor_name 
      FROM visits v 
      JOIN users u ON v.doctor_id = u.id 
      WHERE v.patient_id = ? 
      ORDER BY v.created_at DESC
    `).all(req.params.id);
    res.json(visits);
  });

  app.post("/api/visits", (req, res) => {
    try {
      const { 
        patient_id, 
        doctor_id, 
        presenting_condition, 
        condition_status, 
        medical_treatment, 
        complaints, 
        diagnosis, 
        medicines, 
        tests, 
        comments, 
        signature,
        attachments,
        condition_type,
        condition_significance,
        examinations,
        examinations_comment,
        diagnosis_value,
        diagnosis_comment,
        plan_value,
        plan_comment,
        services,
        services_comment
      } = req.body;

      if (!patient_id || !doctor_id) {
        return res.status(400).json({ error: "Missing patient_id or doctor_id" });
      }

      const result = db.prepare(`
        INSERT INTO visits (
          patient_id, 
          doctor_id, 
          presenting_condition, 
          condition_status, 
          medical_treatment, 
          complaints, 
          diagnosis, 
          medicines, 
          tests, 
          comments, 
          signature,
          attachments,
          condition_type,
          condition_significance,
          examinations,
          examinations_comment,
          diagnosis_value,
          diagnosis_comment,
          plan_value,
          plan_comment,
          services,
          services_comment
        ) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        patient_id, 
        doctor_id, 
        presenting_condition || "", 
        condition_status || "Stable", 
        medical_treatment || "", 
        complaints || "", 
        diagnosis || "", 
        JSON.stringify(medicines || []), 
        JSON.stringify(tests || []), 
        comments || "", 
        signature || "",
        JSON.stringify(attachments || []),
        condition_type || "Acute",
        condition_significance || "Minor",
        examinations || "all clear",
        examinations_comment || "",
        diagnosis_value || "clear",
        diagnosis_comment || "",
        plan_value || "all clear",
        plan_comment || "",
        services || "",
        services_comment || ""
      );

      const visit = db.prepare(`
        SELECT v.*, u.full_name as doctor_name 
        FROM visits v 
        JOIN users u ON v.doctor_id = u.id 
        WHERE v.id = ?
      `).get(result.lastInsertRowid);

      if (!visit) {
        throw new Error("Failed to retrieve created visit");
      }

      const doctor = db.prepare("SELECT username FROM users WHERE id = ?").get(doctor_id) as any;
      logAction(req, "ADD_VISIT", `Added visit for patient ID: ${patient_id}`, doctor_id, doctor?.username);

      res.json(visit);
    } catch (error: any) {
      console.error("Server Error in /api/visits:", error);
      res.status(500).json({ error: error.message || "Internal Server Error" });
    }
  });

  // Users API
  app.get("/api/users", (req, res) => {
    const users = db.prepare("SELECT id, username, role, full_name FROM users").all();
    res.json(users);
  });

  app.post("/api/users", (req, res) => {
    const { username, password, role, full_name, adminId, adminUsername } = req.body;
    const result = db.prepare("INSERT INTO users (username, password, role, full_name) VALUES (?, ?, ?, ?)").run(username, password, role, full_name);
    logAction(req, "ADD_USER", `Added user: ${username} (${role})`, adminId, adminUsername);
    res.json({ id: result.lastInsertRowid });
  });

  app.put("/api/users/:id", (req, res) => {
    const { username, password, role, full_name, adminId, adminUsername } = req.body;
    if (password) {
      db.prepare("UPDATE users SET username = ?, password = ?, role = ?, full_name = ? WHERE id = ?").run(username, password, role, full_name, req.params.id);
    } else {
      db.prepare("UPDATE users SET username = ?, role = ?, full_name = ? WHERE id = ?").run(username, role, full_name, req.params.id);
    }
    logAction(req, "EDIT_USER", `Edited user: ${username}`, adminId, adminUsername);
    res.json({ success: true });
  });

  app.delete("/api/users/:id", (req, res) => {
    const { adminId, adminUsername } = req.query as any;
    const user = db.prepare("SELECT username FROM users WHERE id = ?").get(req.params.id) as any;
    db.prepare("DELETE FROM users WHERE id = ?").run(req.params.id);
    logAction(req, "DELETE_USER", `Deleted user: ${user?.username || req.params.id}`, parseInt(adminId), adminUsername);
    res.json({ success: true });
  });

  app.put("/api/visits/:id", (req, res) => {
    try {
      const { 
        presenting_condition, 
        condition_status, 
        medical_treatment, 
        complaints, 
        diagnosis, 
        medicines, 
        tests, 
        comments, 
        signature,
        attachments,
        condition_type,
        condition_significance,
        examinations,
        examinations_comment,
        diagnosis_value,
        diagnosis_comment,
        plan_value,
        plan_comment,
        services,
        services_comment
      } = req.body;

      db.prepare(`
        UPDATE visits 
        SET presenting_condition = ?, 
            condition_status = ?, 
            medical_treatment = ?, 
            complaints = ?, 
            diagnosis = ?, 
            medicines = ?, 
            tests = ?, 
            comments = ?, 
            signature = ?,
            attachments = ?,
            condition_type = ?,
            condition_significance = ?,
            examinations = ?,
            examinations_comment = ?,
            diagnosis_value = ?,
            diagnosis_comment = ?,
            plan_value = ?,
            plan_comment = ?,
            services = ?,
            services_comment = ?
        WHERE id = ?
      `).run(
        presenting_condition || "", 
        condition_status || "Stable", 
        medical_treatment || "", 
        complaints || "", 
        diagnosis || "", 
        JSON.stringify(medicines || []), 
        JSON.stringify(tests || []), 
        comments || "", 
        signature || "",
        JSON.stringify(attachments || []),
        condition_type || "Acute",
        condition_significance || "Minor",
        examinations || "all clear",
        examinations_comment || "",
        diagnosis_value || "clear",
        diagnosis_comment || "",
        plan_value || "all clear",
        plan_comment || "",
        services || "",
        services_comment || "",
        req.params.id
      );

      const visit = db.prepare(`
        SELECT v.*, u.full_name as doctor_name 
        FROM visits v 
        JOIN users u ON v.doctor_id = u.id 
        WHERE v.id = ?
      `).get(req.params.id);

      const doctor = db.prepare("SELECT username FROM users WHERE id = ?").get(visit.doctor_id) as any;
      logAction(req, "EDIT_VISIT", `Edited visit ID: ${req.params.id}`, visit.doctor_id, doctor?.username);

      res.json(visit);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/visits/:id", (req, res) => {
    try {
      const { userId, username } = req.query as any;
      db.prepare("DELETE FROM visits WHERE id = ?").run(req.params.id);
      logAction(req, "DELETE_VISIT", `Deleted visit ID: ${req.params.id}`, userId ? parseInt(userId) : undefined, username);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Audit Logs API
  app.get("/api/audit-logs", (req, res) => {
    try {
      const logs = db.prepare("SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 500").all();
      res.json(logs);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Appointments API
  app.get("/api/appointments", (req, res) => {
    const appointments = db.prepare(`
      SELECT a.*, p.name as patient_name, u.full_name as doctor_name 
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN users u ON a.doctor_id = u.id
      ORDER BY a.start_time ASC
    `).all();
    res.json(appointments);
  });

  app.post("/api/appointments", (req, res) => {
    const { patient_id, doctor_id, start_time, end_time, title, description, status, userId, username } = req.body;
    const result = db.prepare(`
      INSERT INTO appointments (patient_id, doctor_id, start_time, end_time, title, description, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(patient_id, doctor_id, start_time, end_time, title, description, status || 'scheduled');
    
    logAction(req, "ADD_APPOINTMENT", `Scheduled appointment for patient ID: ${patient_id}`, userId, username);
    res.json({ id: result.lastInsertRowid });
  });

  app.put("/api/appointments/:id", (req, res) => {
    const { start_time, end_time, title, description, status, userId, username } = req.body;
    db.prepare(`
      UPDATE appointments 
      SET start_time = ?, end_time = ?, title = ?, description = ?, status = ?
      WHERE id = ?
    `).run(start_time, end_time, title, description, status, req.params.id);
    
    logAction(req, "EDIT_APPOINTMENT", `Updated appointment ID: ${req.params.id}`, userId, username);
    res.json({ success: true });
  });

  app.delete("/api/appointments/:id", (req, res) => {
    const { adminId, adminUsername } = req.query as any;
    db.prepare("DELETE FROM appointments WHERE id = ?").run(req.params.id);
    logAction(req, "DELETE_APPOINTMENT", `Deleted appointment ID: ${req.params.id}`, parseInt(adminId), adminUsername);
    res.json({ success: true });
  });

  // Invoices API
  app.get("/api/invoices", (req, res) => {
    const invoices = db.prepare(`
      SELECT i.*, p.name as patient_name 
      FROM invoices i
      JOIN patients p ON i.patient_id = p.id
      ORDER BY i.created_at DESC
    `).all();
    res.json(invoices);
  });

  app.post("/api/invoices", (req, res) => {
    const { patient_id, visit_id, amount, status, items, userId, username } = req.body;
    const result = db.prepare(`
      INSERT INTO invoices (patient_id, visit_id, amount, status, items)
      VALUES (?, ?, ?, ?, ?)
    `).run(patient_id, visit_id || null, amount, status || 'unpaid', JSON.stringify(items || []));
    
    logAction(req, "ADD_INVOICE", `Created invoice for patient ID: ${patient_id}`, userId, username);
    res.json({ id: result.lastInsertRowid });
  });

  app.put("/api/invoices/:id", (req, res) => {
    const { status, userId, username } = req.body;
    db.prepare("UPDATE invoices SET status = ? WHERE id = ?").run(status, req.params.id);
    logAction(req, "EDIT_INVOICE", `Updated invoice ID: ${req.params.id} status to ${status}`, userId, username);
    res.json({ success: true });
  });

  // Settings API
  app.get("/api/settings/:key", (req, res) => {
    const setting = db.prepare("SELECT value FROM settings WHERE key = ?").get(req.params.key) as any;
    res.json(setting ? JSON.parse(setting.value) : null);
  });

  app.post("/api/settings/:key", (req, res) => {
    db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)").run(req.params.key, JSON.stringify(req.body));
    res.json({ success: true });
  });

  // Reports API
  app.get("/api/reports/stats", (req, res) => {
    const totalPatients = db.prepare("SELECT COUNT(*) as count FROM patients").get() as any;
    const totalVisits = db.prepare("SELECT COUNT(*) as count FROM visits").get() as any;
    const visitsByDay = db.prepare(`
      SELECT date(created_at) as date, COUNT(*) as count 
      FROM visits 
      GROUP BY date(created_at) 
      ORDER BY date DESC 
      LIMIT 7
    `).all();
    res.json({ totalPatients: totalPatients.count, totalVisits: totalVisits.count, visitsByDay });
  });

  // Permissions API
  app.get("/api/permissions", (req, res) => {
    const perms = db.prepare("SELECT * FROM permissions").all();
    res.json(perms);
  });

  app.put("/api/permissions/:role", (req, res) => {
    const { can_add_patient, can_edit_patient, can_view_records, can_prescribe, can_manage_users } = req.body;
    db.prepare(`
      UPDATE permissions 
      SET can_add_patient = ?, can_edit_patient = ?, can_view_records = ?, can_prescribe = ?, can_manage_users = ? 
      WHERE role = ?
    `).run(can_add_patient, can_edit_patient, can_view_records, can_prescribe, can_manage_users, req.params.role);
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
