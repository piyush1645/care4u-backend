import express from 'express'
import * as prescriptionController from '../controller/prescription.controller.js'
import { authenticateToken } from '../../../middlewares/jwt.middleware.js';
import { checkPermission } from '../../../middlewares/access.middleware.js';
import { ROLE } from '../../../common/constants/index.js';

const router = express.Router();

router.post('/',authenticateToken,checkPermission([ROLE.DOCTOR,ROLE.PATIENT]),prescriptionController.create);
router.get('/doctor/patient/:doctorId/:patientId',authenticateToken,checkPermission([ROLE.PATIENT,ROLE.STAFF,ROLE.DOCTOR,ROLE.SUPER_ADMIN]),prescriptionController.getByPatientIdDoctorId);
router.get('/appointment/:appointmentId',authenticateToken,checkPermission([ROLE.PATIENT,ROLE.STAFF,ROLE.DOCTOR,ROLE.SUPER_ADMIN]),prescriptionController.getByAppointmentId)
router.get('/doctor/:doctorId',authenticateToken,checkPermission([ROLE.PATIENT,ROLE.STAFF,ROLE.DOCTOR,ROLE.SUPER_ADMIN]),prescriptionController.getByDoctorId)
router.get('/patient/:patientId',authenticateToken,checkPermission([ROLE.PATIENT,ROLE.STAFF,ROLE.DOCTOR,ROLE.SUPER_ADMIN]),prescriptionController.getByPatientId)
router.get('/:id',authenticateToken,checkPermission([ROLE.PATIENT,ROLE.STAFF,ROLE.DOCTOR,ROLE.SUPER_ADMIN]),prescriptionController.getById)
router.delete('/:id',authenticateToken,checkPermission([ROLE.STAFF,ROLE.DOCTOR,ROLE.SUPER_ADMIN]),prescriptionController.remove)

export default router;