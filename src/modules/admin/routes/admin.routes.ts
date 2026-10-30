import express from 'express'
import {
  resgisterAdmin,
  displayAdminDashboard,
  getStaffDetails,
  getDoctorDetails,
  displayAdminProfile,
  updateAdminProfile,
  searchDoctors,
  getAdminHospitalGroupId,
} from '../controller/admin.controller.js';
import { authenticateToken } from '../../../middlewares/jwt.middleware.js';
import { checkPermission } from '../../../middlewares/access.middleware.js';
import { ROLE } from '../../../common/constants/index.js';
const AdminRoutes = express.Router()

// Get Routes
AdminRoutes.get(
    '/adminDashboard', 
    authenticateToken, 
    checkPermission([ROLE.DOCTOR, ROLE.ADMIN, ROLE.SUPER_ADMIN]), 
    displayAdminDashboard
);
AdminRoutes.get(
  '/getStaffMembers',
  authenticateToken,
  checkPermission([ROLE.ADMIN, ROLE.SUPER_ADMIN]),
  getStaffDetails,
);
AdminRoutes.get(
  '/getDoctorsDetail',
  authenticateToken,
  checkPermission([ROLE.ADMIN, ROLE.SUPER_ADMIN]),
  getDoctorDetails,
);
AdminRoutes.get(
  '/getAdminHospitalGroupId',
  authenticateToken,
  checkPermission([ROLE.ADMIN, ROLE.SUPER_ADMIN]),
  getAdminHospitalGroupId,
);
AdminRoutes.get(
  '/displayAdminProfile',
  authenticateToken,
  checkPermission([ROLE.ADMIN, ROLE.SUPER_ADMIN]),
  displayAdminProfile,
);
AdminRoutes.get(
  '/findDoctors',
  authenticateToken,
  checkPermission([ROLE.ADMIN, ROLE.SUPER_ADMIN]),
  searchDoctors
);
AdminRoutes.get(
  '/findStaffMembers',
  authenticateToken,
  checkPermission([ROLE.ADMIN, ROLE.SUPER_ADMIN]),
);

// Post Routes
AdminRoutes.post(
  '/registerAdmin',
  authenticateToken,
  checkPermission([ROLE.SUPER_ADMIN]),
  resgisterAdmin,
);

// Put Routes
AdminRoutes.put(
  '/updateAdminProfile',
  authenticateToken,
  checkPermission([ROLE.ADMIN, ROLE.SUPER_ADMIN]),
  updateAdminProfile,
);

export default AdminRoutes