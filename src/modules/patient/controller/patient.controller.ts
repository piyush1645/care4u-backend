import type { Request, Response } from 'express';
import { BadRequestError, InternalServerError } from '../../../common/handlers/error.handlers.js';
import type { IResponse } from '../../../common/handlers/response.handler.js';
import type { RegisterPatientInput, UpdatePatientInput } from '../validation/patient.validation.js';
import { NotFoundError } from '../../../common/handlers/error.handlers.js';
import { uploadImage } from '../../../common/helpers/imageKit.helper.js';
import * as patientService from '../service/patient.service.js';

export const register = async (req: Request, res: Response) => {
  let response: IResponse;
  try {
    const body = req.body as RegisterPatientInput;
    console.log('Registering patient, body:', req.body);

    await patientService.registerPatientService(body);

    response = {
      status: 201,
      message: 'Patient registered successfully',
      success: true,
    };
    res.status(201).json(response);
  } catch (error: any) {
    console.log(error);
    response = {
      status: error.statusCode || 500,
      message: error.message || 'Internal Server Error',
      success: false,
    };
    res.status(response.status).json(response);
  }
};

export const getProfile = async (req: Request, res: Response) => {
  let response: IResponse;
  try {
    const patientId = req.user?.userId;
    if (!patientId) throw new NotFoundError('User not authenticated');

    const profile = await patientService.getPatientProfileService(BigInt(patientId));

    response = {
      status: 200,
      message: 'Patient profile fetched',
      success: true,
      data: profile,
    };
    res.status(200).json(response);
  } catch (error: any) {
    console.log(error);
    response = {
      status: error.statusCode || 500,
      message: error.message || 'Internal Server Error',
      success: false,
    };
    res.status(response.status).json(response);
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  let response: IResponse;
  try {
    const patientId = req.user?.userId;
    if (!patientId) throw new NotFoundError('User not authenticated');

    const body = req.body as UpdatePatientInput;
    const file = req.file;

    const updatedProfile = await patientService.updatePatientProfileService(
      BigInt(patientId),
      body,
      file
    );

    response = {
      status: 200,
      message: 'Patient profile updated',
      success: true,
      data: updatedProfile,
    };
    res.status(200).json(response);
  } catch (error: any) {
    console.log(error);
    response = {
      status: error.statusCode || 500,
      message: error.message || 'Internal Server Error',
      success: false,
    };
    res.status(response.status).json(response);
  }
};

export const updateProfilePhoto = async (req: Request, res: Response) => {
  let response: IResponse;
  try {
    const patientId = req.user?.userId;
    if (!patientId) throw new NotFoundError('User not authenticated');

    const file = req.file;
    if (!file) {
      response = { status: 400, message: 'No file uploaded', success: false };
      return res.status(400).json(response);
    }

    const fileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}-${file.originalname}`;
    const uploadedImage = await uploadImage(
      file.buffer,
      fileName,
      "/uploads"
    );
    if (!uploadedImage) {
      throw new InternalServerError('Error while uploading profile photo');
    }

    await patientService.updateProfilePhoto(BigInt(patientId), uploadedImage.url);

    response = {
      status: 200,
      message: 'Profile photo updated',
      success: true,
    };

    res.status(200).json(response);
  } catch (error: any) {
    console.log(error);
    response = {
      status: error.statusCode || 500,
      message: error.message || 'Internal Server Error',
      success: false,
    };
    res.status(response.status).json(response);
  }
};

export const searchDoctors = async (req: Request, res: Response) => {
  let response: IResponse;
  try {
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : undefined;
    const hospitalId = typeof req.query.hospitalId === 'string' ? req.query.hospitalId : undefined;
    const speciality = typeof req.query.speciality === 'string' ? req.query.speciality.trim() : undefined;
    const page = typeof req.query.page === 'string' ? Number(req.query.page) : 1;
    const limit = typeof req.query.limit === 'string' ? Number(req.query.limit) : 10;

    const doctors = await patientService.searchDoctorsForPatient({
      q: q ?? '',
      hospitalId: hospitalId ?? '',
      speciality: speciality ?? '',
      page,
      limit,
    });

    response = {
      status: 200,
      message: 'Doctors fetched successfully',
      success: true,
      data: {
        items: doctors.items.map((doctor) => ({
          id: doctor.id.toString(),
          firstName: doctor.firstName,
          lastName: doctor.lastName,
          profilePhoto: doctor.profilePhoto,
          expereince: doctor.expereince,
          charges: doctor.charges,
          slotDuration: doctor.slotDuration,
          specialities: doctor.speciality.map((sp) => sp.name),
          hospital: {
            id: doctor.hospital.id.toString(),
            branchName: doctor.hospital.branchName,
            city: doctor.hospital.address?.city ?? null,
          },
        })),
        pagination: doctors.pagination,
      },
    };
    res.status(200).json(response);
  } catch (error: any) {
    console.log(error);
    response = {
      status: error.statusCode || 500,
      message: error.message || 'Internal Server Error',
      success: false,
    };
    res.status(response.status).json(response);
  }
};

export const getDoctorDetails = async (req: Request, res: Response) => {
  let response: IResponse;
  try {
    const doctorId = String(req.params.doctorId);
    if (!doctorId) {
      throw new BadRequestError('doctorId is required');
    }

    const doctor = await patientService.getDoctorDetailsForPatient(doctorId);

    const totalReviews = doctor.review.length;
    const avgRating =
      totalReviews > 0
        ? doctor.review.reduce((acc, item) => acc + item.rating, 0) / totalReviews
        : 0;

    response = {
      status: 200,
      message: 'Doctor details fetched successfully',
      success: true,
      data: {
        id: doctor.id.toString(),
        firstName: doctor.firstName,
        middleName: doctor.middleName,
        lastName: doctor.lastName,
        profilePhoto: doctor.profilePhoto,
        gender: doctor.gender,
        preferedLanguages: doctor.preferedLanguages,
        expereince: doctor.expereince,
        charges: doctor.charges,
        slotDuration: doctor.slotDuration,
        specialities: doctor.speciality.map((sp) => sp.name),
        degrees: doctor.degree,
        schedules: doctor.schedule,
        hospital: {
          id: doctor.hospital.id.toString(),
          branchName: doctor.hospital.branchName,
          photo: doctor.hospital.photo,
          address: doctor.hospital.address,
        },
        rating: {
          average: Number(avgRating.toFixed(1)),
          totalReviews,
        },
        reviews: doctor.review,
      },
    };
    res.status(200).json(response);
  } catch (error: any) {
    console.log(error);
    response = {
      status: error.statusCode || 500,
      message: error.message || 'Internal Server Error',
      success: false,
    };
    res.status(response.status).json(response);
  }
};

export const getDashboard = async (req: Request, res: Response) => {
  let response: IResponse;
  try {
    const patientId = req.user?.userId;
    if (!patientId) {
      throw new BadRequestError('Patient is Required!!');
    }

    const data = await patientService.getDashboardService(BigInt(patientId));

    response = {
      success: true,
      status: 200,
      message: "Patient Dashboard Data Fetched!!",
      data,
    };
    res.status(200).json(response);
  } catch (error: any) {
    console.log(error);
    response = {
      status: error.statusCode || 500,
      message: error.message || 'Internal Server Error',
      success: false,
    };
    res.status(response.status).json(response);
  }
};

export const getSlots = async (req: Request, res: Response) => {
  let response: IResponse;
  try {
    const doctorId = String(req.params.doctorId);
    const date = typeof req.query.date === 'string' ? req.query.date.trim() : '';

    if (!doctorId) throw new BadRequestError('doctorId is required');
    if (!date)     throw new BadRequestError('date query param is required (YYYY-MM-DD)');

    const slots = await patientService.getAvailableSlots(doctorId, date);

    response = {
      status: 200,
      message: 'Slots fetched successfully',
      success: true,
      data: slots,
    };
    res.status(200).json(response);
  } catch (error: any) {
    console.log(error);
    response = {
      status: error.statusCode || 500,
      message: error.message || 'Internal Server Error',
      success: false,
    };
    res.status(response.status).json(response);
  }
};