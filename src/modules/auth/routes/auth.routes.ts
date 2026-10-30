import express from 'express';
import { forgotPassword, login, logout, refreshToken, resetPassword, verifyOtp } from '../controller/auth.controller.js';

const router = express.Router();

router.post('/login',login);
router.post('/forgot-password',forgotPassword);
router.post('/verify-otp',verifyOtp);
router.post('/refresh-token',refreshToken);
router.post('/logout',logout);

router.patch('/reset-password/:token',resetPassword);

export default router;