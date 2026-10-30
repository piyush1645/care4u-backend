import express from 'express'
import * as taxController from '../controller/tax.controller.js'
import { authenticateToken } from '../../../middlewares/jwt.middleware.js';
import { checkPermission } from '../../../middlewares/access.middleware.js';
import { ROLE } from '../../../common/constants/index.js';

const router = express.Router()

router.get('/:id',authenticateToken,checkPermission([ROLE.PATIENT,ROLE.STAFF]),taxController.getByHospitalId);

export default router;