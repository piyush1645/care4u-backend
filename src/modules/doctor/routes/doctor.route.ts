import { Router } from 'express';
import { WrapAsync } from '../../../common/helpers/WrapAsync.js';

import {
  getAppointments,
  getDoctorDashboard,
  getUpcomingLeaves,
  registerDoctor,
  getProfile,
  getUpdatedProfileValue,
  getDoctorSchedule,
  UpdateDoctorSchedule,
  planUpcomingLeaves,
  getAllLeaves,
  defaultLeaves,
  updateProfilePhoto,
  getPatientProfileForDoctor,
  uploadPrescriptionPhotoForAppointment,
  deactivateDoctor,
  activateDoctor,
} from '../controller/doctor.controller.js';
import { RegisterDoctorSchema, UpdateDoctorSchema } from '../validation/doctor.validation.js';
import { validate } from '../../../middlewares/validate.middleware.js';
import { authenticateToken } from '../../../middlewares/jwt.middleware.js';
import { checkPermission } from '../../../middlewares/access.middleware.js';
import { checkDoctorAccess } from '../middleware/access.middleware.js';
import { ROLE } from '../../../common/constants/index.js';
import { upload } from '../../../middlewares/upload.middleware.js';
const doctorRoutes = Router();

// routes/doctor.routes.ts

/**
 * - Doctor dashboard routes
 * - get appointment | leaves
 */
doctorRoutes.get(
  '/:id/dashboard',
  authenticateToken,
  checkPermission([ROLE.DOCTOR, ROLE.ADMIN, ROLE.SUPER_ADMIN]),
  checkDoctorAccess,
  WrapAsync(getDoctorDashboard),
);

/**
 * - get only appointments
 */
doctorRoutes.get(
  '/:id/appointments',
  authenticateToken,
  checkPermission([ROLE.DOCTOR, ROLE.ADMIN, ROLE.SUPER_ADMIN, ROLE.STAFF]),
  checkDoctorAccess,
  WrapAsync(getAppointments),
);

/**
 * - get only leaves
 */
doctorRoutes.get(
  '/:id/leaves',
  authenticateToken,
  checkPermission([ROLE.DOCTOR, ROLE.ADMIN, ROLE.SUPER_ADMIN, ROLE.STAFF]),
  checkDoctorAccess,
  WrapAsync(getUpcomingLeaves),
);

doctorRoutes.get(
  '/:id/allLeaves',
  authenticateToken,
  checkPermission([ROLE.DOCTOR, ROLE.ADMIN, ROLE.SUPER_ADMIN]),
  checkDoctorAccess,
  WrapAsync(getAllLeaves),
);

/**
 * - get Doctor Profile
 * - API api/v1/doctor/:id/profile
 */
doctorRoutes.get(
  '/:id/profile',
  authenticateToken,
  checkDoctorAccess,
  WrapAsync(getProfile),
);

/**
 * - get Doctor profile edit mode
 * - API api/v1/doctor/:id/profile/edit
 */
doctorRoutes.get(
  '/:id/profile/edit',
  authenticateToken,
  checkPermission([ROLE.DOCTOR, ROLE.ADMIN, ROLE.SUPER_ADMIN]),
  checkDoctorAccess,
  WrapAsync(getProfile),
);

/**
 * - PATCH Doctor profile edit mode
 * - API PATCH: api/v1/doctor/:id/profile/edit
 */
doctorRoutes.patch(
  '/:id/profile/edit',
  authenticateToken,
  checkPermission([ROLE.ADMIN, ROLE.SUPER_ADMIN, ROLE.DOCTOR]),
  checkDoctorAccess,
  validate(UpdateDoctorSchema),
  WrapAsync(getUpdatedProfileValue),
);

/**
 *  - Register Routes
 *  - /api/v1/doctor/register
 *  - Only access by Admin|superAdmin
 */
doctorRoutes.post(
  '/register',
  authenticateToken,
  checkPermission([ROLE.ADMIN, ROLE.SUPER_ADMIN]),
  validate(RegisterDoctorSchema),
  WrapAsync(registerDoctor),
);

doctorRoutes.get(
  '/:id/get-schedules',
  authenticateToken,
  checkPermission([ROLE.DOCTOR, ROLE.ADMIN, ROLE.SUPER_ADMIN]),
  checkDoctorAccess,
  WrapAsync(getDoctorSchedule),
);

doctorRoutes.patch(
  '/:id/update-schedules',
  authenticateToken,
  checkPermission([ROLE.DOCTOR, ROLE.ADMIN, ROLE.SUPER_ADMIN]),
  checkDoctorAccess,
  WrapAsync(UpdateDoctorSchedule),
);

doctorRoutes.post(
  '/:id/get-leaves',
  authenticateToken,
  checkPermission([ROLE.DOCTOR, ROLE.ADMIN, ROLE.SUPER_ADMIN]),
  checkDoctorAccess,
  WrapAsync(planUpcomingLeaves),
);

doctorRoutes.delete(
  '/:id/leaves/:leaveId',
  authenticateToken,
  checkPermission([ROLE.DOCTOR, ROLE.ADMIN, ROLE.SUPER_ADMIN]),
  checkDoctorAccess,
  WrapAsync(defaultLeaves),
);


doctorRoutes.patch(
  '/profile-photo',
  authenticateToken,
  checkPermission([ROLE.DOCTOR, ROLE.ADMIN, ROLE.SUPER_ADMIN]),
  upload.single('profile-photo'),
  WrapAsync(updateProfilePhoto)
)

doctorRoutes.get(
  '/:id/patients/:patientId',
  authenticateToken,
  checkPermission([ROLE.DOCTOR, ROLE.ADMIN, ROLE.SUPER_ADMIN]),
  checkDoctorAccess,
  WrapAsync(getPatientProfileForDoctor),
);

doctorRoutes.post(
  '/:id/appointments/:appointmentId/prescription-photo',
  authenticateToken,
  checkPermission([ROLE.DOCTOR, ROLE.ADMIN, ROLE.SUPER_ADMIN]),
  checkDoctorAccess,
  upload.single('file'),
  WrapAsync(uploadPrescriptionPhotoForAppointment),
);

doctorRoutes.patch(
  '/:id/deactive',
  authenticateToken,
  checkPermission([ROLE.ADMIN, ROLE.SUPER_ADMIN]),
  WrapAsync(deactivateDoctor),
);

doctorRoutes.patch(
  '/:id/active',
  authenticateToken,
  checkPermission([ROLE.ADMIN, ROLE.SUPER_ADMIN]),
  WrapAsync(activateDoctor),
);

export default doctorRoutes;
