import { Router } from 'express';
import { getByAppointmentId, startMeeting, endMeeting } from '../controller/meeting.controller.js';
import { authenticateToken } from '../../../middlewares/jwt.middleware.js';
import { checkPermission } from '../../../middlewares/access.middleware.js';
import { ROLE } from '../../../common/constants/index.js';
import { WrapAsync } from '../../../common/helpers/WrapAsync.js';

const router = Router();

router.get(
  '/:id',
  authenticateToken,
  checkPermission([ROLE.DOCTOR, ROLE.PATIENT]),
  WrapAsync(getByAppointmentId)
);

router.post(
  '/:id/start',
  authenticateToken,
  checkPermission([ROLE.DOCTOR]),
  WrapAsync(startMeeting)
);

router.post(
  '/:id/end',
  authenticateToken,
  checkPermission([ROLE.DOCTOR]),
  WrapAsync(endMeeting)
);

export default router;
