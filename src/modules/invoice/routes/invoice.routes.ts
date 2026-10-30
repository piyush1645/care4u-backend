import express from 'express'
import * as invoiceController from '../controller/invoice.controller.js'
import { authenticateToken } from '../../../middlewares/jwt.middleware.js';
import { checkPermission } from '../../../middlewares/access.middleware.js';
import { ROLE } from '../../../common/constants/index.js';

const router = express.Router();

router.get('/patient/:id',authenticateToken,checkPermission([ROLE.SUPER_ADMIN,ROLE.PATIENT]),invoiceController.getPatientInvocies)
router.get('/doctor/:id',authenticateToken,checkPermission([ROLE.DOCTOR,ROLE.ADMIN,ROLE.SUPER_ADMIN]),invoiceController.getDoctorInvoices)
router.get('/hospital/:id',authenticateToken,checkPermission([ROLE.ADMIN,ROLE.SUPER_ADMIN,ROLE.STAFF]),invoiceController.getHospitalInvoices)
router.get('/hospitalGroup/:id',authenticateToken,checkPermission([ROLE.ADMIN,ROLE.SUPER_ADMIN]),invoiceController.getHospitalGroupInvoices)
router.get('/appointment/:id',authenticateToken,invoiceController.getAppointmentInvoice)
router.get('/:id',authenticateToken,invoiceController.getById)

export default router