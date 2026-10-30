import { Router } from 'express';
import {
	register,
	getProfile,
	updateProfile,
	updateProfilePhoto,
	searchDoctors,
	getDoctorDetails,
	getDashboard,
	getSlots,
} from '../controller/patient.controller.js';
import { upload } from '../../../middlewares/upload.middleware.js';
import { validate } from '../../../middlewares/validate.middleware.js';
import { registerPatientSchema, updatePatientSchema } from '../validation/patient.validation.js';
import { authenticateToken } from '../../../middlewares/jwt.middleware.js';
import { checkPermission } from '../../../middlewares/access.middleware.js';
import { ROLE } from '../../../common/constants/index.js';

const router = Router();

router.post('/register', validate(registerPatientSchema), register);

router.use(authenticateToken);
router.use(checkPermission([ROLE.PATIENT]));

router.get('/profile', getProfile);
router.patch('/profile', upload.single('profilePhoto'), validate(updatePatientSchema), updateProfile);
router.patch('/profile/photo', upload.single('profilePhoto'), updateProfilePhoto);

router.get('/doctors/search', searchDoctors);
router.get('/doctors/:doctorId/slots', getSlots);
router.get('/doctors/:doctorId', getDoctorDetails);

router.get('/dashboard', getDashboard);

export default router;
