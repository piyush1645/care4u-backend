import { ROLE } from '../../../common/constants/index.js';
import { checkPermission } from '../../../middlewares/access.middleware.js';
import { authenticateToken } from '../../../middlewares/jwt.middleware.js';
import * as hospitalController from '../controller/hospital.controller.js'
import express from 'express'

const router = express.Router();

router.post('/register',authenticateToken,checkPermission([ROLE.ADMIN,ROLE.SUPER_ADMIN]),hospitalController.register);
router.delete('/:id',authenticateToken,checkPermission([ROLE.ADMIN,ROLE.SUPER_ADMIN]),hospitalController.deactivate);
router.get('/',authenticateToken,checkPermission([ROLE.ADMIN,ROLE.SUPER_ADMIN,ROLE.PATIENT,ROLE.STAFF,ROLE.DOCTOR]),hospitalController.getAll); 
router.get('/groups/:groupId',authenticateToken,checkPermission([ROLE.ADMIN,ROLE.SUPER_ADMIN,ROLE.PATIENT,ROLE.STAFF,ROLE.DOCTOR]),hospitalController.getByHospitalGroupId);
router.get('/:id/detail',authenticateToken,checkPermission([ROLE.ADMIN,ROLE.SUPER_ADMIN]),hospitalController.getDetail);
router.get('/:name',authenticateToken,checkPermission([ROLE.ADMIN,ROLE.SUPER_ADMIN,ROLE.PATIENT,ROLE.STAFF,ROLE.DOCTOR]),hospitalController.getByName);
router.put('/:id',authenticateToken,checkPermission([ROLE.ADMIN,ROLE.SUPER_ADMIN]),hospitalController.update);
router.patch('/:id',authenticateToken,checkPermission([ROLE.ADMIN,ROLE.SUPER_ADMIN]),hospitalController.activate);

export default router;