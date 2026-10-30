import express from 'express'
import * as googleController from '../controller/google.controller.js'

const router = express.Router()

router.get('/connect',googleController.connectGoogleCalender)
router.get('/callback',googleController.googleCallback);


export default router;