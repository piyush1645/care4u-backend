import { Router } from 'express';

import {
  bookAnAppointment,
  cancelAnAppointment,
  rescheduleAnAppointment,
  showAllAppointments,
  updateAppointmentStatus,
} from '../controller/doctorAppointment.controller.js';

import { WrapAsync } from '../../../common/helpers/WrapAsync.js';

import { checkPermission } from '../../../middlewares/access.middleware.js';

import { authenticateToken } from '../../../middlewares/jwt.middleware.js';

import { ROLE } from '../../../common/constants/index.js';
import { downloadInvoice } from '../../invoice/controller/invoicePdf.controller.js';
import { downloadPrescription } from '../../prescription/controller/prescriptionPdf.controller.js';

export const appointmentRoutes = Router();

appointmentRoutes.get(
  '/appointments',

  authenticateToken,

  checkPermission([
    ROLE.DOCTOR,
    ROLE.ADMIN,
    ROLE.PATIENT,
    ROLE.STAFF,
  ]),

  WrapAsync(showAllAppointments),
);

appointmentRoutes.post(
  '/book-appointment',

  authenticateToken,

  checkPermission([
    ROLE.ADMIN,
    ROLE.DOCTOR,
    ROLE.PATIENT,
    ROLE.STAFF,
  ]),

  WrapAsync(bookAnAppointment),
);

appointmentRoutes.delete(
  '/appointments',

  authenticateToken,

  checkPermission([
    ROLE.ADMIN,
    ROLE.DOCTOR,
    ROLE.PATIENT,
    ROLE.STAFF,
  ]),

  WrapAsync(cancelAnAppointment),
);

appointmentRoutes.patch(
  '/appointments/reschedule',

  authenticateToken,

  checkPermission([
    ROLE.ADMIN,
    ROLE.DOCTOR,
    ROLE.PATIENT,
    ROLE.STAFF,
  ]),

  WrapAsync(rescheduleAnAppointment),
);

appointmentRoutes.patch(
  '/appointments/:appointmentId/status',

  authenticateToken,

  checkPermission([
    ROLE.ADMIN,
    ROLE.DOCTOR,
    ROLE.STAFF,
  ]),

  WrapAsync(updateAppointmentStatus),
);


appointmentRoutes.get(
 '/appointments/:appointmentId/invoice/download',

  authenticateToken,

  checkPermission([
    ROLE.DOCTOR,
    ROLE.ADMIN,
    ROLE.PATIENT,
    ROLE.STAFF,
  ]),

  WrapAsync(downloadInvoice),
);
appointmentRoutes.get(
  '/appointments/:appointmentId/prescription/download',

  authenticateToken,

  checkPermission([
    ROLE.DOCTOR,
    ROLE.ADMIN,
    ROLE.PATIENT,
    ROLE.STAFF,
  ]),

  WrapAsync(downloadPrescription),
);