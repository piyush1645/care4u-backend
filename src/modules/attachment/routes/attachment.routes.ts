import express from 'express'
import * as attachmentController from '../controller/attachment.controller.js'
import { authenticateToken } from '../../../middlewares/jwt.middleware.js'
import { checkPermission } from '../../../middlewares/access.middleware.js'
import { ROLE } from '../../../common/constants/index.js'
import { upload } from '../../../middlewares/upload.middleware.js'

const router = express.Router()

router.post('/report/:id',authenticateToken,checkPermission([ROLE.DOCTOR,ROLE.STAFF,ROLE.PATIENT]),upload.single('file'),attachmentController.addReport);
router.post('/prescription/:id',authenticateToken,checkPermission([ROLE.DOCTOR,ROLE.STAFF]),upload.single('file'),attachmentController.addPrescription);
router.delete('/:id',authenticateToken,checkPermission([ROLE.DOCTOR,ROLE.PATIENT,ROLE.STAFF]),attachmentController.deleteAttachment);

export default router;