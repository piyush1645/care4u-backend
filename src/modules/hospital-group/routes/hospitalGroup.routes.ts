import { ROLE } from '../../../common/constants/index.js';
import { checkPermission } from '../../../middlewares/access.middleware.js';
import { authenticateToken } from '../../../middlewares/jwt.middleware.js';
import * as hospitalGroupController from '../controller/hospitalGroup.controller.js'
import express from 'express';

const router = express.Router();

router.get('/',authenticateToken,authenticateToken,checkPermission([ROLE.ADMIN,ROLE.SUPER_ADMIN,ROLE.PATIENT,ROLE.STAFF,ROLE.DOCTOR]),hospitalGroupController.getAll);
router.get('/:name',authenticateToken,authenticateToken,checkPermission([ROLE.ADMIN,ROLE.SUPER_ADMIN,ROLE.PATIENT,ROLE.STAFF,ROLE.DOCTOR]),hospitalGroupController.getByName);
router.post('/register',authenticateToken,authenticateToken,checkPermission([ROLE.SUPER_ADMIN]),hospitalGroupController.register);
router.delete('/:id',authenticateToken,authenticateToken,checkPermission([ROLE.SUPER_ADMIN]),hospitalGroupController.deactivateGroup);
router.patch('/:id',authenticateToken,checkPermission([ROLE.SUPER_ADMIN]),hospitalGroupController.activateGroup)

export default router;