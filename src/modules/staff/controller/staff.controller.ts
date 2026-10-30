import type { Request, Response } from 'express';

import {
  createStaffService,
  getAllStaffService,
  getSingleStaffService,
  updateStaffService,
  deactivateStaffService,
  getStaffIdByCredentialIdService,
  getStaffHospitalGroupIdService,
} from '../services/staff.service.js';

const convertStaffToResponse = (staff: any) => ({
  id: staff.id.toString(),
  firstName: staff.firstName,
  middleName: staff.middleName ?? null,
  lastName: staff.lastName,
  gender: staff.gender,
  profilePhoto: staff.profilePhoto ?? null,
  dateOfBirth: staff.dateOfBirth,
  credentialId: staff.credentialId.toString(),
  hospitalId: staff.hospitalId.toString(),
  credential: staff.credential ? {
    id: staff.credential.id.toString(),
    email: staff.credential.email,
    mobile: staff.credential.mobile,
    role: staff.credential.role,
    isActive: staff.credential.isActive,
  } : null,
  hospital: staff.hospital ? {
    id: staff.hospital.id.toString(),
    branchName: staff.hospital.branchName,
  } : null,
  createdAt: staff.createdAt,
  updatedAt: staff.updatedAt,
});

export const createStaff = async (req: Request, res: Response): Promise<void> => {
  try {
    const hospitalGroupId = BigInt(req.params.hospitalGroupId as any);

    const staff = await createStaffService(hospitalGroupId, req.body);

    res.status(201).json({
      success: true,
      data: convertStaffToResponse(staff),
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAllStaff = async (req: Request, res: Response): Promise<void> => {
  try {
    const hospitalGroupId = BigInt(req.params.hospitalGroupId as any);

    const staffs = await getAllStaffService(hospitalGroupId);

    res.status(200).json({
      success: true,
      data: staffs.map((staff) => ({
        id: staff.id.toString(),
        firstName: staff.firstName,
        middleName: staff.middleName ?? null,
        lastName: staff.lastName,
        fullName: `${staff.firstName} ${staff.lastName}`,
        gender: staff.gender,
        profilePhoto: staff.profilePhoto ?? null,
        dateOfBirth: staff.dateOfBirth,
        credentialId: staff.credentialId.toString(),
        hospitalId: staff.hospitalId.toString(),
        credential: staff.credential ? {
          email: staff.credential.email,
          mobile: staff.credential.mobile,
          role: staff.credential.role,
          isActive: staff.credential.isActive,
        } : null,
        hospital: staff.hospital ? {
          id: staff.hospital.id.toString(),
          branchName: staff.hospital.branchName,
        } : null,
      })),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getSingleStaff = async (req: Request, res: Response): Promise<void> => {
  try {
    const hospitalGroupId = BigInt(req.params.hospitalGroupId as any);

    const staff = await getSingleStaffService(
      hospitalGroupId,
      BigInt(req.params.staffId as any),
    );

    res.status(200).json({
      success: true,
      data: convertStaffToResponse(staff),
    });
  } catch (error: any) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateStaff = async (req: Request, res: Response): Promise<void> => {
  try {
    const hospitalGroupId = BigInt(req.params.hospitalGroupId as any);

    const updatedStaff = await updateStaffService(
      hospitalGroupId,
      BigInt(req.params.staffId as any),
      req.body,
    );

    res.status(200).json({
      success: true,
      data: convertStaffToResponse(updatedStaff),
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const deactivateStaff = async (req: Request, res: Response): Promise<void> => {
  try {
    const hospitalGroupId = BigInt(req.params.hospitalGroupId as any);

    await deactivateStaffService(
      hospitalGroupId,
      BigInt(req.params.staffId as any),
    );

    res.status(200).json({
      success: true,
      message: 'Staff deactivated successfully',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const getStaffIdByCredentialId = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { credentialId } = req.params;

    if (!credentialId) {
      res.status(400).json({
        success: false,
        message: 'credentialId is required',
      });
      return;
    }

    const staff = await getStaffIdByCredentialIdService(
      BigInt(credentialId as any),
    );

    res.status(200).json({
      success: true,
      data: {
        id: staff.id.toString(),
        firstName: staff.firstName,
        lastName: staff.lastName,
        hospitalId: staff.hospitalId.toString(),
        credentialId: staff.credentialId.toString(),
      },
    });
  } catch (error: any) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

export const getStaffHospitalGroupId = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const staffId = BigInt(req.params.staffId as any);

    const result = await getStaffHospitalGroupIdService(staffId);

    res.status(200).json({
      success: true,
      data: {
        staffId: result.staffId.toString(),
        hospitalId: result.hospitalId.toString(),
        hospitalGroupId: result.hospitalGroupId.toString(),
        hospitalGroupName: result.hospitalGroupName,
      },
    });
  } catch (error: any) {
    res.status(error.message === 'Staff not found' ? 404 : 500).json({
      success: false,
      message: error.message,
    });
  }
};
