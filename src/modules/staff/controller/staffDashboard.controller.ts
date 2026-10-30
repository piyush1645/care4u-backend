import type { Request, Response } from 'express';

import type { IResponse } from '../../../common/handlers/response.handler.js';
import { BadRequestError } from '../../../common/handlers/error.handlers.js';
import {
  getStaffHospitalId,
  getMyProfileService,
  resolveHospitalGroupService,
  getDoctorsForHospitalService,
  getHospitalsInGroupService,
  getAvailableSlotsService,
  registerPatientByStaffService,
  getHospitalAppointmentsService,
  searchPatientsService,
  updateMyProfileService,
} from '../services/staffDashboard.service.js';
import { bookAnAppointment } from '../../appointment/controller/doctorAppointment.controller.js';

export const getMyProfile = async (req: Request, res: Response): Promise<void> => {
  let response: IResponse;
  try {
    // JWT userId = staffId (set during login as staffData.id)
    const staffId = BigInt(req.user!.userId);

    const profile = await getMyProfileService(staffId);

    response = { status: 200, message: 'Profile fetched', success: true, data: profile };
    res.status(200).json(response);
  } catch (error: any) {
    response = { status: error.statusCode || 500, message: error.message, success: false, error };
    res.status(response.status).json(response);
  }
};

export const resolveHospitalGroup = async (req: Request, res: Response): Promise<void> => {
  let response: IResponse;
  try {
    const userId = BigInt(req.user!.userId);
    const role = req.user!.role;

    const data = await resolveHospitalGroupService(userId, role);

    response = { status: 200, message: 'Hospital group resolved', success: true, data };
    res.status(200).json(response);
  } catch (error: any) {
    response = { status: error.statusCode || 500, message: error.message, success: false, error };
    res.status(response.status).json(response);
  }
};

export const getDoctorsForHospital = async (req: Request, res: Response): Promise<void> => {
  let response: IResponse;
  try {
    const staffId = BigInt(req.user!.userId);
    const hospitalId = await getStaffHospitalId(staffId);

    const doctors = await getDoctorsForHospitalService(hospitalId);

    response = { status: 200, message: 'Doctors fetched', success: true, data: doctors };
    res.status(200).json(response);
  } catch (error: any) {
    response = { status: error.statusCode || 500, message: error.message, success: false, error };
    res.status(response.status).json(response);
  }
};

export const getHospitalsInGroup = async (req: Request, res: Response): Promise<void> => {
  let response: IResponse;
  try {
    const hospitalGroupId = BigInt(req.params.hospitalGroupId as any);

    const hospitals = await getHospitalsInGroupService(hospitalGroupId);

    response = { status: 200, message: 'Hospitals fetched', success: true, data: hospitals };
    res.status(200).json(response);
  } catch (error: any) {
    response = { status: error.statusCode || 500, message: error.message, success: false, error };
    res.status(response.status).json(response);
  }
};

export const getAvailableSlots = async (req: Request, res: Response): Promise<void> => {
  let response: IResponse;
  try {
    const { doctorId, date } = req.query;

    if (!doctorId || !date) {
      throw new BadRequestError('doctorId and date are required');
    } 
    
    const userId: bigint = BigInt(req.user!.userId);
    
    const hospitalId = await getStaffHospitalId(userId);
    
    const slots = await getAvailableSlotsService(
      BigInt(doctorId as string),
      date as string,
      hospitalId as any,
    );

    response = { status: 200, message: 'Slots fetched', success: true, data: slots };
    res.status(200).json(response);
  } catch (error: any) {
    response = { status: error.statusCode || 500, message: error.message, success: false, error };
    res.status(response.status).json(response);
  }
};

export const getHospitalAppointments = async (req: Request, res: Response): Promise<void> => {
  let response: IResponse;
  try {
    const { date, doctorId, status } = req.query;

    // BUG FIX: was incorrectly named 'credentialId' but JWT carries staffId
    const staffId = BigInt(req.user!.userId);
    const hospitalId = await getStaffHospitalId(staffId);

    const appointments = await getHospitalAppointmentsService(
      hospitalId,
      date as string | undefined,
      doctorId as string | undefined,
      status as string | undefined,
    );

    response = { status: 200, message: 'Appointments fetched', success: true, data: appointments };
    res.status(200).json(response);
  } catch (error: any) {
    response = { status: error.statusCode || 500, message: error.message, success: false, error };
    res.status(response.status).json(response);
  }
};

export const searchPatients = async (req: Request, res: Response): Promise<void> => {
  let response: IResponse;
  try {
    const { q } = req.query;

    if (!q) throw new BadRequestError('Query parameter "q" is required');

    const patients = await searchPatientsService(q as string);

    response = { status: 200, message: 'Patients fetched', success: true, data: patients };
    res.status(200).json(response);
  } catch (error: any) {
    response = { status: error.statusCode || 500, message: error.message, success: false, error };
    res.status(response.status).json(response);
  }
};

export const registerPatientByStaff = async (req: Request, res: Response): Promise<void> => {
  let response: IResponse;
  try {
    const {
      firstName, middleName, lastName, email, mobile,
      password, gender, dateOfBirth, bloodGroup,
    } = req.body;

    if (!firstName || !lastName || !email || !mobile || !password || !gender || !dateOfBirth || !bloodGroup) {
      throw new BadRequestError(
        'firstName, lastName, email, mobile, password, gender, dateOfBirth, and bloodGroup are required',
      );
    }

    const patient = await registerPatientByStaffService({
      firstName, middleName, lastName, email, mobile,
      password, gender, dateOfBirth, bloodGroup,
    });

    response = { status: 201, message: 'Patient registered successfully', success: true, data: patient };
    res.status(201).json(response);
  } catch (error: any) {
    response = { status: error.statusCode || 500, message: error.message, success: false, error };
    res.status(response.status).json(response);
  }
};

export const bookAppointmentByStaff = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      doctorId, 
      patientId, 
      appointmentTime,
      totalAmount,
      paidBy,
      paymentType,
      paymentStatus,
      transactionId,
      cardNumber,
      upiId,
    } = req.body;

    if (!doctorId || !patientId || !appointmentTime) {
      throw new BadRequestError('doctorId, patientId, and appointmentTime are required');
    }

    if (!totalAmount || !paidBy || !paymentType || !paymentStatus) {
      throw new BadRequestError(
        'totalAmount, paidBy, paymentType, and paymentStatus are required',
      );
    }

    // Resolve hospital ID for this staff member
    const staffId = BigInt(req.user!.userId);
    const hospitalId = await getStaffHospitalId(staffId);

    // Transform req.body for the shared appointment controller
    req.body = {
      appointmentDate: new Date(appointmentTime),
      appointmentStartTime: new Date(appointmentTime),
      patientId: String(patientId),
      type: req.body.type || "IN_PERSON",
      bookedBy: "STAFF",
      doctorId: String(doctorId),
      hospitalId: String(hospitalId),
      paidBy: paidBy || "SELF",
      payment: {
        amount: Number(totalAmount),
        type: paymentType,
        status: paymentStatus,
        paymentDetails: (transactionId || cardNumber || upiId) ? {
          transactionId: transactionId || undefined,
          cardNumber: cardNumber || undefined,
          upiId: upiId || undefined,
        } : undefined,
      },
    };

    // Call the shared appointment controller
    return bookAnAppointment(req, res);
  } catch (error: any) {
    const response: IResponse = { status: error.statusCode || 500, message: error.message, success: false, error };
    res.status(response.status).json(response);
  }
};

// ─── Staff Self-Profile Update ──────────────────────────────────────────────
// PATCH /staff/dashboard/update-profile
// Allows the logged-in staff member to update their own personal information.
// Scoped entirely by JWT (staffId = req.user.userId) — no hospitalGroupId needed.
export const updateMyProfile = async (req: Request, res: Response): Promise<void> => {
  let response: IResponse;
  try {
    const staffId = BigInt(req.user!.userId);

    const {
      firstName,
      middleName,
      lastName,
      gender,
      dateOfBirth,
      profilePhoto,
      email,
      mobile,
    } = req.body;

    // At least one field must be provided
    if (
      firstName === undefined &&
      middleName === undefined &&
      lastName === undefined &&
      gender === undefined &&
      dateOfBirth === undefined &&
      profilePhoto === undefined &&
      email === undefined &&
      mobile === undefined
    ) {
      throw new BadRequestError('At least one field must be provided for update');
    }

    const updatedProfile = await updateMyProfileService(staffId, {
      firstName,
      middleName,
      lastName,
      gender,
      dateOfBirth,
      profilePhoto,
      email,
      mobile,
    });

    response = { status: 200, message: 'Profile updated successfully', success: true, data: updatedProfile };
    res.status(200).json(response);
  } catch (error: any) {
    response = { status: error.statusCode || 500, message: error.message, success: false, error };
    res.status(response.status).json(response);
  }
};
