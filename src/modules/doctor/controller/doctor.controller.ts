// controllers/doctor.controller.ts
import { type Request, type Response } from 'express';
import { mapAppointmentStatus } from '../../appointment/service/appointment.service.js';
import { BadRequestError, InternalServerError, UnauthorizedError, NotFoundError, ForbiddenError } from '../../../common/handlers/error.handlers.js';
import type { IResponse } from '../../../common/handlers/response.handler.js';
import {
  createDoctor,
  getAllAppointment,
  getDoctorById,
  getSchedule,
  getUpComingLeaves,
  takeLeaves,
  updateDoctor,
  updateSchedule,
} from '../service/doctor.service.js';
import type { IRegisterDoctorDto, IUpdationScheduleDto } from '../interface/doctor.interface.js';
import prisma from '../../../config/prisma.js';
import { uploadImage } from '../../../common/helpers/imageKit.helper.js';
import * as doctorService from '../service/doctor.service.js'

export const getDoctorSchedule = async (req: Request, res: Response): Promise<void> => {
  let response: IResponse;
  try {
    const doctorId = Number(req.params.id);

    const doctorShedules = await getSchedule(BigInt(doctorId));
    response = {
      success: true,
      status: 200,
      message: 'Doctor schedule fetched successfully',
      data: doctorShedules,
    };

    res.status(response.status).json({
      response,
    });
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

/**
 * - Update Doctor shedule and require
 * - moring-start|end , and evening-start|end, and working day string all in one comma sepreted String
 * - All value insert into string formate
 */
export const UpdateDoctorSchedule = async (req: Request, res: Response): Promise<void> => {
  let response: IResponse;
  try {
    const doctorId = Number(req.params.id);
    const {
      morningStartTime,
      morningEndTime,
      eveningStartTime,
      eveningEndTime,
      workingDays,
    }: IUpdationScheduleDto = req.body;

    if (!morningStartTime && !eveningStartTime) {
      throw new BadRequestError('At least one shift timing is required.');
    }

    const newTime = {
      morningStartTime,
      morningEndTime,
      eveningStartTime,
      eveningEndTime,
      workingDays: workingDays.toUpperCase(),
    };

    const newSchedule = await updateSchedule(doctorId, newTime);

    response = {
      success: true,
      status: 200,
      message: 'Doctor schedule updated successfully',
      data: newSchedule,
    };

    res.status(response.status).json({
      response,
    });
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

export const planUpcomingLeaves = async (req: Request, res: Response): Promise<void> => {
  let response: IResponse;
  try {
    const doctorId = Number(req.params.id);
    const { leaveDate, leaveStartTime = null, leaveEndTime = null } = req.body;
    if (!leaveDate) {
      throw new BadRequestError('Leave date is required');
    }

    /**
     * Safty cheak for doctor leaves
     * -can't select a pasts days
     * -can't apply for leaves in today's past time (past-hours etc...)
     */
    // Parse leaveDate strictly as UTC to avoid local timezone shifts
    const selectedDate = new Date(`${leaveDate}T00:00:00.000Z`);

    // Get today's local date, represented as a UTC date at 00:00:00.000Z
    const now = new Date();
    const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

    if (selectedDate < today) {
      throw new BadRequestError('Invalid leave date');
    }

    let startDateTime: Date | null = null;
    let endDateTime: Date | null = null;

    if (leaveStartTime) {
      // Store as true UTC: doctor enters IST time, convert using +05:30 offset
      startDateTime = new Date(`${leaveDate}T${leaveStartTime}:00+05:30`);

      // Reject if the chosen IST time is not in the future
      if (selectedDate.getTime() === today.getTime()) {
        if (startDateTime <= new Date()) {
          throw new BadRequestError('Leave start time must be in the future');
        }
      }
    }

    if (leaveEndTime) {
      // Store as true UTC
      endDateTime = new Date(`${leaveDate}T${leaveEndTime}:00+05:30`);
    }

    /**
     * Leave Conflict Validation Rules:
     * 1. Full-day leave (no times) → blocks ALL further leaves on that date.
     * 2. Any existing leave on a date → blocks a new full-day leave on that date.
     * 3. Timed leave (start + end) → blocks only overlapping timed leaves on the same date,
     *    BUT is also blocked if a full-day (no times) leave already exists on that date.
     */

    // Case A: Requesting a full-day leave (no start/end times provided)
    if (!startDateTime && !endDateTime) {
      const existingLeave = await prisma.leaves.findFirst({
        where: {
          doctorId,
          leaveDate: selectedDate,
        },
      });
      if (existingLeave) {
        throw new BadRequestError(
          'A leave already exists on this date. Full-day leave cannot be added.'
        );
      }
    } else if (startDateTime && endDateTime) {
      // Case B: Requesting a timed (half-day) leave

      // B1: Check if a full-day leave already exists on this date
      const existingFullDayLeave = await prisma.leaves.findFirst({
        where: {
          doctorId,
          leaveDate: selectedDate,
          leaveStartTime: null,
          leaveEndTime: null,
        },
      });
      if (existingFullDayLeave) {
        throw new BadRequestError(
          'A full-day leave already exists on this date. No additional leave can be added.'
        );
      }

      // B2: Check if any existing timed leave overlaps with the requested time slot
      const overlappingLeave = await prisma.leaves.findFirst({
        where: {
          doctorId,
          leaveDate: selectedDate,
          AND: [
            {
              leaveStartTime: {
                lt: endDateTime,
              },
            },
            {
              leaveEndTime: {
                gt: startDateTime,
              },
            },
          ],
        },
      });
      if (overlappingLeave) {
        throw new BadRequestError(
          'A leave already exists for the selected time slot on this date.'
        );
      }
    } else {
      // Case C: Only one of start/end time is provided — treat as a full-day conflict check
      const existingLeave = await prisma.leaves.findFirst({
        where: {
          doctorId,
          leaveDate: selectedDate,
        },
      });
      if (existingLeave) {
        throw new BadRequestError('A leave already exists on this date.');
      }
    }

    // If everything is fine then we can apply for leaves
    const takeNewLeaves = await takeLeaves(doctorId, {
      leaveDate: selectedDate,
      leaveStartTime: startDateTime,
      leaveEndTime: endDateTime,
    });

    response = {
      success: true,
      status: 201,
      message: "Doctor's leave approves successfully",
      data: takeNewLeaves,
    };

    res.status(response.status).json({
      response,
    });
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

export const defaultLeaves = async (req: Request, res: Response): Promise<void> => {
  let response: IResponse;
  try {
    const doctorId = Number(req.params.id);
    const leaveId = Number(req.params.leaveId);

    if (!doctorId && !leaveId) {
      throw new BadRequestError('Require doctorId or leaveId');
    }

    const leaves = await prisma.leaves.delete({
      where: {
        id: leaveId,
        doctorId,
      },
    });

    if (!leaves) {
      throw new BadRequestError('Leave not found');
    }

    response = {
      success: true,
      status: 200,
      message: 'Doctor leave deleted successfully',
      data: leaves,
    };

    res.status(response.status).json({
      response,
    });
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

export const getUpdatedProfileValue = async (req: Request, res: Response): Promise<void> => {
  let response: IResponse;
  try {
    const doctorId = Number(req.params.id);

    const {
      firstName,
      middleName,
      lastName,

      gender,

      dateOfBirth,
      preferedLanguages,
      expereince = 0,

      charges,
      slotDuration = 15,

      specialities,
      degrees,
    } = req.body;

    const languagesString = Array.isArray(preferedLanguages)
      ? preferedLanguages.join(',')
      : (preferedLanguages || '');

    const newDoctorValue = {
      firstName,
      middleName,
      lastName,

      gender,

      dateOfBirth,
      preferedLanguages: languagesString,
      expereince,

      charges,
      slotDuration,

      specialities,
      degrees,
    };

    const doctor = await updateDoctor(doctorId, newDoctorValue);

    response = {
      success: true,
      status: 201,
      message: 'Doctor registered successfully',
      data: doctor,
    };

    res.status(response.status).json({
      response,
    });
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

export const getProfile = async (req: Request, res: Response): Promise<void> => {
  let response: IResponse;
  try {
    let doctorId: number = Number(req.params.id);
    console.log(doctorId);
    if (!doctorId) {
      throw new BadRequestError('Doctor_id is required!');
    }
    const doctor = await getDoctorById(doctorId);
    if (!doctor) {
      throw new BadRequestError('Doctor not found!');
    }
    response = {
      success: true,
      status: 200,
      message: 'Doctor profile fetched successfully',
      data: doctor,
    };

    res.status(response.status).json({
      response,
    });
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

export const getDoctorDashboard = async (req: Request, res: Response): Promise<void> => {
  let response: IResponse;
  try {
    const doctorId = Number(req.params.id);

    if (!doctorId) {
      throw new BadRequestError('Doctor_id is required!');
    }

    const doctor = await getDoctorById(doctorId);
    if (!doctor) {
      throw new BadRequestError('Doctor not found!');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // const doctor = await getDoctorById(doctorId);
    const appointments = await getAllAppointment(doctorId);

    const upcomingLeaves = await getUpComingLeaves(doctorId);

    const categorizedAppointments = {
      booked: appointments.filter((a: { status: string }) => a.status === 'BOOKED' || a.status === 'RESCHEDULED'),
      ongoing: appointments.filter((a: { status: string }) => a.status === 'ON_GOING'),
      cancelled: appointments.filter((a: { status: string }) => a.status === 'CANCELLED'),
      noShow: appointments.filter((a: { status: string }) => a.status === 'NO_SHOW'),
    };

    const upcomingAppointments = appointments.filter(
      (a: { appointmentDate: Date | string; status: string }) => {
        const appointmentDate = new Date(a.appointmentDate);
        appointmentDate.setHours(0, 0, 0, 0);
        return appointmentDate >= today && ['BOOKED', 'ON_GOING', 'RESCHEDULED', 'COMPLETED', 'NO_SHOW', 'CANCELLED'].includes(a.status);
      },
    );

    response = {
      success: true,
      status: 200,
      message: 'Doctor dashboard fetched successfully',
      data: {
        summary: {
          totalAppointments: appointments.length,
          booked: categorizedAppointments.booked.length,
          ongoing: categorizedAppointments.ongoing.length,
          cancelled: categorizedAppointments.cancelled.length,
          noShow: categorizedAppointments.noShow.length,
          upcomingLeaves: upcomingLeaves.length,
        },
        upcomingAppointments,
        allAppointments: categorizedAppointments,
        upcomingLeaves,
        doctor: {
          firstName: doctor.firstName,
          lastName: doctor.lastName
        }
      },
    };

    res.status(response.status).json({
      response,
    });
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

export const getAppointments = async (req: Request, res: Response): Promise<void> => {
  let response: IResponse;
  try {
    const doctorId = Number(req.params.id);
    const { status, date, page = '1', limit = '10' } = req.query;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: any = { doctorId };

    // Filter by status if provided
    if (status) {
      where.status = status;
    }

    // Filter by specific date if provided
    if (date) {
      const filterDate = new Date(date as string);
      filterDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(filterDate);
      nextDay.setDate(nextDay.getDate() + 1);

      where.appointmentDate = {
        gte: filterDate,
        lt: nextDay,
      };
    }

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        include: {
          patient: true,
          hospital: {
            include: {
              address: true,
              hospitalGroup: true,
            }
          },
          prescription: true,
          billing: true,
        },
        orderBy: { appointmentDate: 'desc' },
        skip,
        take: parseInt(limit as string),
      }),
      prisma.appointment.count({ where }),
    ]);

    response = {
      success: true,
      status: 200,
      message: 'Appointments fetched successfully',
      data: {
        appointments: appointments.map(mapAppointmentStatus),
        pagination: {
          total,
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          totalPages: Math.ceil(total / parseInt(limit as string)),
        },
      },
    };

    res.status(response.status).json({
      response,
    });
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

export const getUpcomingLeaves = async (req: Request, res: Response): Promise<void> => {
  let response: IResponse;
  try {
    const doctorId = Number(req.params.id);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const leaves = await getUpComingLeaves(doctorId);
    response = {
      success: true,
      status: 200,
      message: 'Upcoming leaves fetched successfully',
      data: leaves,
    };
    res.status(response.status).json({
      response,
    });
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

export const getAllLeaves = async (req: Request, res: Response): Promise<void> => {
  let response: IResponse;
  try {
    const doctorId = Number(req.params.id);

    const leaves = await prisma.leaves.findMany({
      where: {
        doctorId,
      },
    });
    response = {
      success: true,
      status: 200,
      message: 'Upcoming leaves fetched successfully',
      data: leaves,
    };
    res.status(response.status).json({
      response,
    });
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
/**
 * - Register Doctor Routes
 * - Access only By Admin
 * - Route /api/v1/doctor/register
 */
export const registerDoctor = async (req: Request, res: Response) => {
  let response: IResponse;
  try {
    const body = req.body;
    if (!body) {
      throw new BadRequestError('Doctor data is required');
    }

    // get data from multiple forms

    const {
      // Registration Data
      email,
      mobile,
      password,

      // Doctor_registration Data
      firstName,
      middleName,
      lastName,
      profilePhoto = 'https://37assets.37signals.com/svn/765-default-avatar.png',

      gender,

      dateOfBirth,
      preferedLanguages,
      expereince = 0,

      charges,
      slotDuration = 15,

      credentialId,
      hospitalId,

      // Specialities and Degrees
      specialities,
      degrees,
    }: IRegisterDoctorDto = req.body;
    const doctorData: IRegisterDoctorDto = {
      email,
      mobile,
      password,

      firstName,
      middleName,
      lastName,
      profilePhoto,

      gender,

      dateOfBirth,
      preferedLanguages,
      expereince,

      charges,
      slotDuration,

      credentialId,
      hospitalId,

      specialities,
      degrees,
    };

    const existingEmail = await prisma.userCredential.findFirst({
      where: { email: doctorData.email },
    });
    if (existingEmail) {
      throw new BadRequestError('Email already in use');
    }

    const existingMobile = await prisma.userCredential.findFirst({
      where: { mobile: doctorData.mobile },
    });
    if (existingMobile) {
      throw new BadRequestError('Mobile already in use');
    }

    if (req.user && req.user.role === 'ADMIN') {
      const admin = await prisma.admin.findUnique({
        where: { id: BigInt(req.user.userId) },
        select: { hospitalGroupId: true }
      });
      if (!admin) {
        throw new UnauthorizedError('Admin not found');
      }

      const hospital = await prisma.hospital.findUnique({
        where: { id: BigInt(doctorData.hospitalId) },
        select: { hospitalGroupId: true }
      });

      if (!hospital) {
        throw new BadRequestError('Selected hospital not found');
      }

      if (hospital.hospitalGroupId !== admin.hospitalGroupId) {
        throw new UnauthorizedError('Selected hospital does not belong to your hospital group');
      }
    }

    const doctor = await createDoctor(doctorData);
    response = {
      success: true,
      status: 201,
      message: 'Doctor registered successfully',
      data: doctor,
    };

    res.status(response.status).json({
      response,
    });
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


export const updateProfilePhoto = async (req: Request, res: Response) => {
  let response: IResponse;
  try {
    if(!req.user) {
      throw new UnauthorizedError('Unauthorized');
    }

    let targetDoctorId: bigint;
    
    if (req.user.role === 'DOCTOR') {
      const id = req.user?.userId;
      if (!id) {
        throw new UnauthorizedError('You are not permitted to update photo');
      }
      targetDoctorId = BigInt(id);
    } else {
      const headerDoctorId = req.headers['doctor-id'];
      if (!headerDoctorId) {
        throw new BadRequestError('doctor-id header is required for admin/superAdmin');
      }
      targetDoctorId = BigInt(headerDoctorId as string);

      if (req.user.role === 'ADMIN') {
        const admin = await prisma.admin.findUnique({
          where: { id: BigInt(req.user.userId) },
          select: { hospitalGroupId: true }
        });
        if (!admin) {
          throw new UnauthorizedError('Admin not found');
        }

        const doctor = await prisma.doctor.findUnique({
          where: { id: targetDoctorId },
          select: { hospital: { select: { hospitalGroupId: true } } }
        });
        if (!doctor || doctor.hospital.hospitalGroupId !== admin.hospitalGroupId) {
          throw new UnauthorizedError('Doctor does not belong to your hospital group');
        }
      }
    }

    const file = req.file;
    if (!file) {
      throw new BadRequestError('File is required');
    }

    const fileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}-${file.originalname}`;
    const uploadedImage = await uploadImage(
      file.buffer,
      fileName,
      "/uploads"
    );
    if(!uploadedImage) {
      throw new InternalServerError('Error while uploading profile photo');
    }

    await doctorService.updateProfilePhoto(uploadedImage.url, targetDoctorId);
    response = {
      status: 200,
      message: 'Profile photo updated',
      success: true,
    };

    res.status(200).json(response)
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

export const getPatientProfileForDoctor = async (req: Request, res: Response): Promise<void> => {
  let response: IResponse;
  try {
    const doctorId = Number(req.params.id);
    const patientId = Number(req.params.patientId);

    if (isNaN(doctorId) || isNaN(patientId)) {
      throw new BadRequestError('Invalid Doctor ID or Patient ID');
    }

    const patient = await prisma.patient.findUnique({
      where: { id: BigInt(patientId) },
      include: {
        credential: {
          select: {
            email: true,
            mobile: true,
          },
        },
      },
    });

    if (!patient) {
      throw new NotFoundError('Patient not found');
    }

    const appointments = await prisma.appointment.findMany({
      where: {
        patientId: BigInt(patientId),
        doctorId: BigInt(doctorId),
      },
      include: {
        prescription: {
          include: {
            attachment: true
          }
        },
        billing: true,
        hospital: true,
      },
      orderBy: {
        appointmentDate: 'desc',
      },
    });

    if (req.user && req.user.role === 'DOCTOR' && appointments.length === 0) {
      throw new ForbiddenError('You can only view profiles of patients who have consulted with you.');
    }

    response = {
      success: true,
      status: 200,
      message: 'Patient profile and appointment history fetched successfully',
      data: {
        patient: {
          id: patient.id.toString(),
          firstName: patient.firstName,
          middleName: patient.middleName,
          lastName: patient.lastName,
          profilePhoto: patient.profilePhoto,
          gender: patient.gender,
          dateOfBirth: patient.dateOfBirth,
          bloodGroup: patient.bloodGroup,
          email: patient.credential.email,
          mobile: patient.credential.mobile,
        },
        appointments,
      },
    };

    res.status(200).json({ response });
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

export const uploadPrescriptionPhotoForAppointment = async (req: Request, res: Response): Promise<void> => {
  let response: IResponse;
  try {
    const doctorId = Number(req.params.id);
    const appointmentId = Number(req.params.appointmentId);

    if (isNaN(doctorId) || isNaN(appointmentId)) {
      throw new BadRequestError('Invalid Doctor ID or Appointment ID');
    }

    if (!req.file) {
      throw new BadRequestError('Please upload a prescription file');
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id: BigInt(appointmentId) },
      include: { prescription: true }
    });

    if (!appointment) {
      throw new NotFoundError('Appointment not found');
    }

    if (Number(appointment.doctorId) !== doctorId) {
      throw new ForbiddenError('You do not have permission to modify this appointment');
    }

    if (new Date() < new Date(appointment.appointmentEndTime)) {
      throw new BadRequestError('This appointment is not over yet');
    }

    const file = req.file;
    const fileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}-${file.originalname}`;
    const uploadedImage = await uploadImage(
      file.buffer,
      fileName,
      "/uploads"
    );

    if (!uploadedImage) {
      throw new InternalServerError('Error while uploading prescription photo');
    }

    let prescriptionId: bigint;
    if (appointment.prescription) {
      prescriptionId = appointment.prescription.id;
    } else {
      const newPrescription = await prisma.prescription.create({
        data: {
          precautions: 'Uploaded prescription photo',
          appointmentId: BigInt(appointmentId)
        }
      });
      prescriptionId = newPrescription.id;
    }

    await prisma.attachment.create({
      data: {
        prescriptionId: prescriptionId,
        secretKey: uploadedImage.secretKey,
        url: uploadedImage.url,
        type: 'PRESCRIPTION'
      }
    });

    response = {
      message: 'Prescription Photo Uploaded Successfully',
      status: 201,
      success: true
    };
    res.status(201).json(response);
  } catch (error: any) {
    console.error(error);
    response = {
      status: error.statusCode || 500,
      message: error.message || 'Internal Server Error',
      success: false,
    };
    res.status(response.status).json(response);
  }
};

export const deactivateDoctor = async (req: Request, res: Response): Promise<void> => {
  let response: IResponse;
  try {
    const user = req.user;
    if (!user) {
      throw new UnauthorizedError('Unauthorized');
    }

    const credentialId = Number(req.params.id);
    if (!credentialId) {
      throw new BadRequestError('Credential ID is required');
    }

    const doctor = await prisma.doctor.findFirst({
      where: { credentialId: BigInt(credentialId) },
      include: {
        hospital: {
          select: { hospitalGroupId: true }
        }
      }
    });

    if (!doctor) {
      throw new NotFoundError('Doctor not found');
    }

    if (user.role === 'ADMIN') {
      const admin = await prisma.admin.findUnique({
        where: { id: BigInt(user.userId) },
        select: { hospitalGroupId: true }
      });
      if (!admin || doctor.hospital.hospitalGroupId !== admin.hospitalGroupId) {
        throw new ForbiddenError('Permission denied: Doctor does not belong to your hospital group');
      }
    } else if (user.role !== 'SUPER_ADMIN') {
      throw new ForbiddenError('Permission denied');
    }

    await prisma.userCredential.update({
      where: { id: BigInt(credentialId) },
      data: { isActive: false }
    });

    response = {
      success: true,
      status: 200,
      message: 'Doctor account deactivated successfully',
    };

    res.status(200).json(response);
  } catch (error: any) {
    console.error(error);
    response = {
      status: error.statusCode || 500,
      message: error.message || 'Internal Server Error',
      success: false,
      error,
    };
    res.status(response.status).json(response);
  }
};

export const activateDoctor = async (req: Request, res: Response): Promise<void> => {
  let response: IResponse;
  try {
    const user = req.user;
    if (!user) {
      throw new UnauthorizedError('Unauthorized');
    }

    const credentialId = Number(req.params.id);
    if (!credentialId) {
      throw new BadRequestError('Credential ID is required');
    }

    const doctor = await prisma.doctor.findFirst({
      where: { credentialId: BigInt(credentialId) },
      include: {
        hospital: {
          select: { hospitalGroupId: true }
        }
      }
    });

    if (!doctor) {
      throw new NotFoundError('Doctor not found');
    }

    if (user.role === 'ADMIN') {
      const admin = await prisma.admin.findUnique({
        where: { id: BigInt(user.userId) },
        select: { hospitalGroupId: true }
      });
      if (!admin || doctor.hospital.hospitalGroupId !== admin.hospitalGroupId) {
        throw new ForbiddenError('Permission denied: Doctor does not belong to your hospital group');
      }
    } else if (user.role !== 'SUPER_ADMIN') {
      throw new ForbiddenError('Permission denied');
    }

    await prisma.userCredential.update({
      where: { id: BigInt(credentialId) },
      data: { isActive: true }
    });

    response = {
      success: true,
      status: 200,
      message: 'Doctor account activated successfully',
    };

    res.status(200).json(response);
  } catch (error: any) {
    console.error(error);
    response = {
      status: error.statusCode || 500,
      message: error.message || 'Internal Server Error',
      success: false,
      error,
    };
    res.status(response.status).json(response);
  }
};