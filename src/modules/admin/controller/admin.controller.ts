import type { Request, Response } from 'express';
import argon2 from 'argon2';
import {
  BadRequestError,
  NotFoundError,
  UnauthorizedError,
} from '../../../common/handlers/error.handlers.js';
import * as adminService from '../service/admin.service.js';
import type { IResponse } from '../../../common/handlers/response.handler.js';
import type {
  IRegisterAdmin,
  IAdminData,
  IUpdateAdminProfile,
} from '../interface/admin.interface.js';

export const resgisterAdmin = async (req: Request, res: Response) => {
  try {
    const {
      firstName,
      lastName,
      gender,
      email,
      mobile,
      dateOfBirth,
      password,
      hospitalGroupId,
    }: IRegisterAdmin = req.body;

    const hashedPassword: string = await argon2.hash(password);

    const adminData: IAdminData = {
      firstName,
      lastName,
      gender,
      email,
      mobile,
      dateOfBirth,
      hashedPassword,
      hospitalGroupId,
    };

    if (!firstName || !lastName || !gender || !email || !hospitalGroupId || !password) {
      throw new BadRequestError('Enter vaild credentails');
    }
    if (email) {
      let isAdmin = await adminService.isAlreadyAdmin(email); // this function will return false if there is no admin with this email
      console.log(isAdmin);
      if (isAdmin) throw new BadRequestError('Admin already exsist no this email');
    }
    const result = await adminService.createAdmin(adminData);

    const response: IResponse = {
      status: 200,
      success: true,
      message: 'Admin register successfully.',
      data: result,
    };
    res.status(200).json(response);
  } catch (error: any) {
    const response: IResponse = {
      status: error.statusCode || 500,
      message: error.message || 'Internal Server Error',
      success: false,
      error,
    };
    res.status(response.status).json(response);
  }
};

export const displayAdminDashboard = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      throw new UnauthorizedError('User not found');
    }
    const adminId = req.user?.userId;
    const adminData = await adminService.getAdminHospitalId(adminId);

    if (!adminData) {
      throw new BadRequestError('Admin not found');
    }

    const allCountsData = await adminService.getCounts(adminData.hospitalGroupId);
    const searchString = typeof req.query.searchString === 'string' ? req.query.searchString : '';
    const allAppointments = await adminService.getAppointments(adminData.hospitalGroupId, searchString);
    const response: IResponse = {
      status: 200,
      success: true,
      message: 'Counts and appointments retrieved successfully',
      data: {
        ...allCountsData,
        allAppointments,
      },
    };
    res.status(200).json(response);
  } catch (error: any) {
    const response: IResponse = {
      status: error.statusCode || 500,
      message: error.message || 'Internal Server Error',
      success: false,
      error,
    };
    res.status(response.status).json(response);
  }
};

export const getStaffDetails = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      throw new UnauthorizedError('User not found');
    }
    const adminId = req.user?.userId;

    const adminData = await adminService.getAdminHospitalId(adminId);

    if (!adminData) {
      throw new BadRequestError('Admin not found');
    }

    const staffDetails = await adminService.getStaffDetails(adminData.hospitalGroupId);

    const response: IResponse = {
      status: 200,
      success: true,
      message: 'Staff Data Retrived.',
      data: staffDetails,
    };
    res.status(200).json(response);
  } catch (error: any) {
    const response: IResponse = {
      status: error.statusCode || 500,
      message: error.message || 'Internal Server Error',
      success: false,
      error,
    };
    res.status(response.status).json(response);
  }
};

export const getDoctorDetails = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      throw new UnauthorizedError('User not found');
    }
    const adminId = req.user?.userId;

    const adminData = await adminService.getAdminHospitalId(adminId);

    if (!adminData) {
      throw new BadRequestError('Admin not found');
    }

    const doctorDetails = await adminService.getDoctorDetails(adminData.hospitalGroupId);

    const response: IResponse = {
      status: 200,
      success: true,
      message: 'Doctor Data Retrived',
      data: doctorDetails,
    };
    res.status(200).json(response);
  } catch (error: any) {
    const response: IResponse = {
      status: error.statusCode || 500,
      message: error.message || 'Internal Server Error',
      success: false,
      error,
    };
    res.status(response.status).json(response);
  }
};

export const displayAdminProfile = async (req: Request, res: Response) => {
  try {
    const adminId = req.user?.userId;
    if (!adminId) {
      throw new NotFoundError('Error in displayAdminProfile : Not getting admin id');
    }
    const adminData = await adminService.getAdminDetails(adminId);

    // res.render("profile",adminData)
    const response: IResponse = {
      status: 200,
      success: true,
      message: 'Admin Data Retrived',
      data: adminData,
    };
    res.status(200).json(response);
  } catch (error: any) {
    console.log(error);
    const response: IResponse = {
      status: error.statusCode || 500,
      message: error.message || 'Internal Server Error',
      success: false,
      error,
    };
    res.status(response.status).json(response);
  }
};

export const updateAdminProfile = async (req: Request, res: Response) => {
  try {
    const adminId = req.user?.userId;

    const { firstName, lastName }: IUpdateAdminProfile = req.body;

    const adminData: IUpdateAdminProfile = {
      firstName,
      lastName,
    };

    if (!adminId) {
      throw new NotFoundError('Error in displayAdminProfile : Not getting admin id');
    }

    const updatedAdminData = await adminService.updateAdminProfile(adminId, adminData);

    const response: IResponse = {
      status: 200,
      success: true,
      message: 'Admin profile updated successfully.',
      data: updatedAdminData,
    };
    res.status(200).json(response);
  } catch (error: any) {
    const response: IResponse = {
      status: error.statusCode || 500,
      message: error.message || 'Internal Server Error',
      success: false,
      error,
    };
    res.status(response.status).json(response);
  }
};

export const searchDoctors = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      throw new UnauthorizedError('User not found');
    }
    const adminId = req.user?.userId;

    const adminData = await adminService.getAdminHospitalId(adminId);

    if (!adminData) {
      throw new BadRequestError('Admin not found');
    }
    const searchString: string =
      typeof req.query.searchString === 'string' ? req.query.searchString : '';

    if (searchString === '') throw new NotFoundError('Enter valid search string.');

    const doctorDetails = await adminService.getDoctorDetails(
      adminData.hospitalGroupId,
      searchString,
    );

    const response: IResponse = {
      status: 200,
      success: true,
      message: 'Doctor Data Retrived',
      data: doctorDetails,
    };
    res.status(200).json(response);
  } catch (error: any) {
    const response: IResponse = {
      status: error.statusCode || 500,
      message: error.message || 'Internal Server Error',
      success: false,
      error,
    };
    res.status(response.status).json(response);
  }
};

export const searchStaffs = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      throw new UnauthorizedError('User not found');
    }
    const adminId = req.user?.userId;

    const adminData = await adminService.getAdminHospitalId(adminId);

    if (!adminData) {
      throw new BadRequestError('Admin not found');
    }
    const searchString: string =
      typeof req.query.searchString === 'string' ? req.query.searchString : '';

    if (searchString === '') throw new NotFoundError('Enter valid search string.');

    const staffDetails = await adminService.getStaffDetails(adminData.hospitalGroupId , searchString);

    const response: IResponse = {
      status: 200,
      success: true,
      message: 'Staff Data Retrived.',
      data: staffDetails,
    };
    res.status(200).json(response);
  } catch (error: any) {
    const response: IResponse = {
      status: error.statusCode || 500,
      message: error.message || 'Internal Server Error',
      success: false,
      error,
    };
    res.status(response.status).json(response);
  }
};

export const getAdminHospitalGroupId = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      throw new UnauthorizedError('User not found');
    }
    const adminId = req.user?.userId;
    const adminData = await adminService.getAdminHospitalId(adminId);

    if (!adminData) {
      throw new BadRequestError('Admin not found');
    }

    const response: IResponse = {
      status: 200,
      success: true,
      message: 'Hospital Group ID retrieved',
      data: {
        hospitalGroupId: adminData.hospitalGroupId,
      },
    };
    res.status(200).json(response);
  } catch (error: any) {
    const response: IResponse = {
      status: error.statusCode || 500,
      message: error.message || 'Internal Server Error',
      success: false,
      error,
    };
    res.status(response.status).json(response);
  }
};
