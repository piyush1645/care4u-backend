import type { Request, Response } from 'express';
import argon2 from 'argon2';
import {
  BadRequestError,
  InternalServerError,
  InvalidTokenError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from '../../../common/handlers/error.handlers.js';
import { findUser, updatePassword } from '../service/auth.service.js';
import type { IJwtPayload } from '../../../common/interfaces/jwtPayload.interface.js';
import {
  createResetToken,
  createAccessToken,
  verifyToken,
  createRefreshToken,
  verifyRefreshToken,
} from '../../../common/helpers/jwt.helper.js';
import type { IResponse } from '../../../common/handlers/response.handler.js';
import { generateOtp } from '../../../common/helpers/otp.helper.js';
import * as redisHelper from '../../../common/helpers/redis.helper.js'
import * as patientService from '../../patient/service/patient.service.js'
import * as doctorService from '../../doctor/service/doctor.service.js'
import * as staffService from '../../staff/services/staff.service.js'
import * as adminService from '../../admin/service/admin.service.js'


export const login = async (req: Request, res: Response) => {
  let response: IResponse;
  try {
    const body = req.body;
    if (!body || (!body.email && !body.mobile) || !body.password) {
      throw new BadRequestError('Email or mobile number is required');
    }
    let user;
    if (body.email) {
      user = await findUser(body.email);
    } else {
      user = await findUser(body.mobile);
    }
    if (!user) {
      throw new NotFoundError('Invalid credentials');
    }
    const isValid = await argon2.verify(user.hashedPassword,body.password);
    if (!isValid) {
      throw new NotFoundError('Invalid Credentials');
    }

    let userId: bigint = BigInt(-1);
    if(user.role == 'PATIENT') {
      const patientId = await patientService.getPatientId(user.id);
      userId = patientId;
    } else if(user.role == 'ADMIN') {
      console.log('here');
      const adminData = await adminService.getAdminId(user.id);
      userId = adminData;
    } else if (user.role == 'DOCTOR') {
      console.log('doctor');
      
      const doctorId = await doctorService.getDoctorId(user.id);
      userId = doctorId;
    } else if (user.role == 'STAFF') {
      const staffData = await staffService.getStaffIdByCredentialIdService(user.id);
      userId = staffData.id
    } else if (user.role == 'SUPER_ADMIN') {
      userId = user.id;
    }
    if(!userId || userId == BigInt(-1)) {
      throw new NotFoundError('Invalid credentials');
    }
    const payload: IJwtPayload = {
      email: user.email,
      role: user.role,
      userId: Number(userId), //need to update based on user
    };
    const token = createAccessToken(payload, 15);
    const refreshToken = createRefreshToken(user.email);
    await redisHelper.setRefreshToken(user.email, refreshToken);
    response = {
      status: 200,
      message: 'User logged in successfully',
      success: true,
      data: {
        accessToken: token,
        refreshToken,
        role: user.role,
        userId: Number(userId),
      },
    };
    res.status(200).json(response);
  } catch (error: any) {
    console.log(error);
    response = {
      status: error.statusCode || 500,
      message: error.message || 'Internal Server Error',
      success: false,
      error,
    };
    res.status(response.status).json(response);
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  let response: IResponse;
  try {
    const credential = req.body.email;
    if (!credential) {
      throw new BadRequestError('Email Id/Phone number is required');
    }
    const user = await findUser(credential);
    if (!user) {
      throw new NotFoundError('Invalid email or phone number');
    }
    const otp = generateOtp();
    await redisHelper.createOtp(user.email,otp)
    response = {
      status: 200,
      message: 'OTP sent successfully',
      success: true,
      data: {
        otp,
      },
    };
    res.status(200).json(response);
  } catch (error: any) {
    console.log(error);
    response = {
      status: error.statusCode || 500,
      message: error.message || 'Internal Server Error',
      success: false,
      error,
    };
    res.status(response.status).json(response);
  }
};

export const verifyOtp = async (req: Request, res: Response) => {
  let response: IResponse;
  try {
    const otp = req.body.otp;
    const email = req.body.email
    if (!otp) {
      throw new BadRequestError('OTP is required');
    }
    const storedOtp = await redisHelper.getOtp(email);
    if(otp != storedOtp) {
      throw new ValidationError('Invalid OTP');
    }
    const newToken = createResetToken(email);
    response = {
      message: 'OTP verified successfully',
      status: 200,
      success: true,
      data: newToken,
    };
    res.status(200).json(response);
  } catch (error: any) {
    console.log(error);
    response = {
      status: error.statusCode || 500,
      message: error.message || 'Internal Server Error',
      success: false,
      error,
    };
    res.status(response.status).json(response);
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  let response: IResponse;
  try {
    const token = req.params.token;
    if (!token || Array.isArray(token)) {
      throw new BadRequestError('Invalid token');
    }
    const password = req.body.password;
    if (!password) {
      throw new BadRequestError('New Password is required');
    }
    const tokenData = verifyToken(token);
    if (!tokenData || !tokenData.email) {
      throw new InvalidTokenError('Invalid Token');
    }

    const user = await findUser(tokenData.email);
    if (!user) {
      throw new InvalidTokenError('Invalid token! Please try again later!');
    }
    const oldPassword = user.hashedPassword;
    const isSame = await argon2.verify(oldPassword, password);
    if (isSame) {
      throw new ValidationError('New Password cannot be same as old password');
    }
    const hashedPassword = await argon2.hash(password);
    const updatedUserCredential = await updatePassword(hashedPassword, tokenData.email);
    if (!updatedUserCredential) {
      throw new InternalServerError('Error while updating password');
    }
    response = {
      message: 'Password reset successfully',
      status: 200,
      success: true,
    };
    res.status(200).json(response);
  } catch (error: any) {
    console.log(error);
    response = {
      status: error.statusCode || 500,
      message: error.message || 'Internal Server Error',
      success: false,
      error,
    };
    res.status(response.status).json(response);
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  let response: IResponse;
  try {
    const header = req.headers.authorization;
    const refreshToken = header?.split(' ')[1];
    if (!refreshToken) {
      throw new UnauthorizedError('User is unauthorized');
    }
    const decoded = verifyRefreshToken(refreshToken);
    const userEmail = decoded.email;
    const storedToken = await redisHelper.getRefreshToken(userEmail);

    if (!storedToken || storedToken != refreshToken) {
      throw new InvalidTokenError('Invalid refresh token');
    }
    const user = await findUser(userEmail);
    if (!user) {
      throw new NotFoundError('Invalid user error');
    }
    let userId: bigint = BigInt(-1);
    if(user.role == 'PATIENT') {
      const patientId = await patientService.getPatientId(user.id);
      userId = patientId;
    } else if(user.role == 'ADMIN') {
      console.log('here');
      const adminData = await adminService.getAdminId(user.id);
      userId = adminData;
    } else if (user.role == 'DOCTOR') {
      console.log('doctor');
      const doctorId = await doctorService.getDoctorId(user.id);
      userId = doctorId;
    } else if (user.role == 'STAFF') {
      const staffData = await staffService.getStaffIdByCredentialIdService(user.id);
      userId = staffData.id
    } else if (user.role == 'SUPER_ADMIN') {
      userId = user.id;
    }
    const payload: IJwtPayload = {
      email: user.email,
      role: user.role,
      userId,
    };
    
    const accessToken = createAccessToken(payload, 15);
    const newRefreshToken = createRefreshToken(userEmail);

    await redisHelper.deleteRefreshToken(userEmail);
    await redisHelper.setRefreshToken(userEmail, refreshToken);

    response = {
      status: 200,
      message: 'OTP sent successfully',
      success: true,
      data: {
        accessToken,
        newRefreshToken,
      },
    };
    res.status(200).json(response);
  } catch (error: any) {
    console.log(error);
    response = {
      status: error.statusCode || 500,
      message: error.message || 'Internal Server Error',
      success: false,
      error,
    };
    res.status(response.status).json(response);
  }
};

export const logout = async (req: Request, res: Response) => {
  let response: IResponse;
  try {
    const header = req.headers.authorization;
    const token = header?.split(' ')[1];
    if (!token) {
      throw new BadRequestError('Token is required');
    }
    const decoded = verifyRefreshToken(token);
    if (!decoded || !decoded.email) {
      throw new UnauthorizedError('Invalid user');
    }
    await redisHelper.deleteRefreshToken(decoded.email);
    response = {
      message: 'User logged out successfully',
      status: 200,
      success: true,
    };
    res.status(200).json(response);
  } catch (error: any) {
    console.log(error);
    response = {
      status: error.statusCode || 500,
      message: error.message || 'Internal Server Error',
      success: false,
      error,
    };
    res.status(response.status).json(response);
  }
};
