import { Router } from 'express';
import AuthRoutes from '../modules/auth/routes/auth.routes.js';
import HospitalGroupRoutes from '../modules/hospital-group/routes/hospitalGroup.routes.js'
import DoctorRoutes from '../modules/doctor/routes/doctor.route.js';
import PatientRoutes from '../modules/patient/routes/patient.routes.js';
import AdminRoutes from '../modules/admin/routes/admin.routes.js';
import HospitalRoutes from '../modules/hospital/routes/hospital.routes.js'
import staffRoutes from '../modules/staff/routes/staff.routes.js';
import { appointmentRoutes } from '../modules/appointment/routes/appointment.routes.js';
import PrescriptionRoutes from '../modules/prescription/routes/prescription.routes.js'
import InvoiceRoutes from '../modules/invoice/routes/invoice.routes.js'
import TaxRoutes from '../modules/tax/routes/tax.routes.js'
import AttachmentRoutes from '../modules/attachment/routes/attachment.routes.js'
import MeetingRoutes from '../modules/meeting/routes/meeting.routes.js'
import GoogleRoutes from '../modules/google/routes/google.routes.js'
export function setupRoutes(): Router {
  // Importing route modules
  const Routes = Router();

  // Auth routes
  Routes.use('/auth', AuthRoutes);
  Routes.use('/hospital-group',HospitalGroupRoutes);
  Routes.use('/doctor', DoctorRoutes);
  Routes.use('/patient', PatientRoutes);
  Routes.use('/admin', AdminRoutes);
  Routes.use('/appointment', appointmentRoutes);
  Routes.use('/staff', staffRoutes);
  Routes.use('/hospital',HospitalRoutes)
  Routes.use('/prescription',PrescriptionRoutes);
  Routes.use('/invoice',InvoiceRoutes);
  Routes.use('/tax',TaxRoutes);
  Routes.use('/attachment',AttachmentRoutes);
  Routes.use('/meeting', MeetingRoutes);
  Routes.use('/google',GoogleRoutes);
  
  // Additional route modules can be imported and set up here in a similar manner
  return Routes;
}
