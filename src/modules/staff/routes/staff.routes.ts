import { Router } from 'express';

import { WrapAsync } from '../../../common/helpers/WrapAsync.js';
import {
  createStaff,
  deactivateStaff,
  getAllStaff,
  getSingleStaff,
  updateStaff,
  getStaffIdByCredentialId,
  getStaffHospitalGroupId,
} from '../controller/staff.controller.js';
import {
  getMyProfile,
  resolveHospitalGroup,
  getDoctorsForHospital,
  getHospitalsInGroup,
  getAvailableSlots,
  getHospitalAppointments,
  searchPatients,
  registerPatientByStaff,
  bookAppointmentByStaff,
  updateMyProfile,
} from '../controller/staffDashboard.controller.js';

import { authenticateToken } from '../../../middlewares/jwt.middleware.js';
import { checkPermission } from '../../../middlewares/access.middleware.js';
import { ROLE } from '../../../common/constants/index.js';

const staffRoutes = Router();

// ═══════════════════════════════════════════════════════════════
// STAFF FRONT-DESK DASHBOARD
// All /dashboard/* routes use the staffId from the JWT to
// automatically scope data to the correct hospital.
// ═══════════════════════════════════════════════════════════════

// GET /staff/dashboard/my-profile
// Returns staff name, email, hospital, hospitalGroupId for the header.
staffRoutes.get(
  '/dashboard/my-profile',
  authenticateToken,
  checkPermission([ROLE.STAFF]),
  WrapAsync(getMyProfile),
);

// GET /staff/dashboard/doctors
// All active doctors at the staff's hospital (for booking dropdown).
staffRoutes.get(
  '/dashboard/doctors',
  authenticateToken,
  checkPermission([ROLE.STAFF]),
  WrapAsync(getDoctorsForHospital),
);

// GET /staff/dashboard/slots?doctorId=X&date=YYYY-MM-DD
// Available time slots for a doctor on a given date.
staffRoutes.get(
  '/dashboard/slots',
  authenticateToken,
  checkPermission([ROLE.STAFF]),
  WrapAsync(getAvailableSlots),
);

// GET /staff/dashboard/appointments?date=YYYY-MM-DD&doctorId=&status=
// All appointments at the hospital with optional filters.
staffRoutes.get(
  '/dashboard/appointments',
  authenticateToken,
  checkPermission([ROLE.STAFF, ROLE.ADMIN, ROLE.SUPER_ADMIN]),
  WrapAsync(getHospitalAppointments),
);

// GET /staff/dashboard/search-patients?q=<name|email|mobile>
// Search patients by name, email, or mobile number.
staffRoutes.get(
  '/dashboard/search-patients',
  authenticateToken,
  checkPermission([ROLE.STAFF]),
  WrapAsync(searchPatients),
);

// POST /staff/dashboard/register-patient
// Register a new walk-in patient account.
staffRoutes.post(
  '/dashboard/register-patient',
  authenticateToken,
  checkPermission([ROLE.STAFF]),
  WrapAsync(registerPatientByStaff),
);

// POST /staff/dashboard/book-appointment
// Book an appointment for a patient with billing and payment details.
staffRoutes.post(
  '/dashboard/book-appointment',
  authenticateToken,
  checkPermission([ROLE.STAFF]),
  WrapAsync(bookAppointmentByStaff),
);

// PATCH /staff/dashboard/update-profile
// Allows the logged-in staff member to update their own profile information.
staffRoutes.patch(
  '/dashboard/update-profile',
  authenticateToken,
  checkPermission([ROLE.STAFF]),
  WrapAsync(updateMyProfile),
);

// ═══════════════════════════════════════════════════════════════
// SHARED UTILITY (STAFF + ADMIN)
// ═══════════════════════════════════════════════════════════════

// GET /staff/resolve-hospital-group
// Returns hospitalGroupId for the logged-in user regardless of role.
// Frontend uses this to bootstrap the admin staff management page.
staffRoutes.get(
  '/resolve-hospital-group',
  authenticateToken,
  checkPermission([ROLE.STAFF, ROLE.ADMIN, ROLE.SUPER_ADMIN]),
  WrapAsync(resolveHospitalGroup),
);

// ═══════════════════════════════════════════════════════════════
// ADMIN STAFF MANAGEMENT
// All routes are scoped by :hospitalGroupId.
// NOTE: Literal paths (/hospital-group/:id/register) must appear
// BEFORE parameterised paths (/hospital-group/:id/:staffId) so
// Express does not swallow "register" as a staffId value.
// ═══════════════════════════════════════════════════════════════

// GET /staff/hospital-group/:hospitalGroupId/hospitals
// All active hospital branches in the group (for Add Staff dropdown).
staffRoutes.get(
  '/hospital-group/:hospitalGroupId/hospitals',
  authenticateToken,
  checkPermission([ROLE.ADMIN, ROLE.SUPER_ADMIN]),
  WrapAsync(getHospitalsInGroup),
);

// GET /staff/hospital-group/:hospitalGroupId
// List all staff in the group.
staffRoutes.get(
  '/hospital-group/:hospitalGroupId',
  authenticateToken,
  checkPermission([ROLE.ADMIN, ROLE.SUPER_ADMIN]),
  WrapAsync(getAllStaff),
);

// POST /staff/hospital-group/:hospitalGroupId/register
// Create a new staff member (hospitalId comes from request body).
staffRoutes.post(
  '/hospital-group/:hospitalGroupId/register',
  authenticateToken,
  checkPermission([ROLE.ADMIN, ROLE.SUPER_ADMIN]),
  WrapAsync(createStaff),
);

// PATCH /staff/hospital-group/:hospitalGroupId/deactivate/:staffId
staffRoutes.patch(
  '/hospital-group/:hospitalGroupId/deactivate/:staffId',
  authenticateToken,
  checkPermission([ROLE.ADMIN, ROLE.SUPER_ADMIN]),
  WrapAsync(deactivateStaff),
);

// GET /staff/hospital-group/:hospitalGroupId/:staffId
staffRoutes.get(
  '/hospital-group/:hospitalGroupId/:staffId',
  authenticateToken,
  checkPermission([ROLE.ADMIN, ROLE.SUPER_ADMIN]),
  WrapAsync(getSingleStaff),
);

// PUT /staff/hospital-group/:hospitalGroupId/:staffId
staffRoutes.put(
  '/hospital-group/:hospitalGroupId/:staffId',
  authenticateToken,
  checkPermission([ROLE.ADMIN, ROLE.SUPER_ADMIN]),
  WrapAsync(updateStaff),
);

// ═══════════════════════════════════════════════════════════════
// UTILITY LOOKUPS
// ═══════════════════════════════════════════════════════════════

// GET /staff/:staffId/hospital-group
// Resolve which hospital group a specific staff member belongs to.
staffRoutes.get(
  '/:staffId/hospital-group',
  authenticateToken,
  checkPermission([ROLE.ADMIN, ROLE.SUPER_ADMIN, ROLE.STAFF]),
  WrapAsync(getStaffHospitalGroupId),
);

// GET /staff/credential/:credentialId
staffRoutes.get(
  '/credential/:credentialId',
  authenticateToken,
  checkPermission([ROLE.ADMIN, ROLE.SUPER_ADMIN, ROLE.STAFF]),
  WrapAsync(getStaffIdByCredentialId),
);

export default staffRoutes;
