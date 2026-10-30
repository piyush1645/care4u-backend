import argon2 from 'argon2';

import prisma from '../../../config/prisma.js';
import { ROLE } from '../../../common/constants/index.js';
import type { CreateStaffDto, UpdateStaffDto } from '../interfaces/staff.interface.js';

// ─── Create ────────────────────────────────────────────────────────────────
// hospitalGroupId scopes the operation; the specific branch (hospitalId)
// is supplied in the request body and verified to belong to that group.
export const createStaffService = async (hospitalGroupId: bigint, data: CreateStaffDto) => {
  const hospitalId = BigInt(data.hospitalId);

  // Verify the target hospital belongs to the requested group
  const hospital = await prisma.hospital.findFirst({
    where: { id: hospitalId, hospitalGroupId },
  });

  if (!hospital) {
    throw new Error('Hospital not found or does not belong to this hospital group');
  }

  const existingCredential = await prisma.userCredential.findFirst({
    where: {
      OR: [{ email: data.email }, { mobile: data.mobile }],
    },
  });

  if (existingCredential) {
    throw new Error('Email or mobile already exists');
  }

  const hashedPassword = await argon2.hash(data.password);

  return prisma.$transaction(async (tx) => {
    const credential = await tx.userCredential.create({
      data: {
        email: data.email,
        mobile: data.mobile,
        hashedPassword,
        role: ROLE.STAFF,
      } as any,
    });

    const staff = await tx.staff.create({
      data: {
        firstName: data.firstName,
        middleName: data.middleName ?? null,
        lastName: data.lastName,
        gender: data.gender,
        profilePhoto: data.profilePhoto ?? null,
        dateOfBirth: new Date(data.dateOfBirth),
        credentialId: credential.id,
        hospitalId,
      },
      include: { credential: true },
    });

    return staff;
  });
};

// ─── Get all ────────────────────────────────────────────────────────────────
export const getAllStaffService = async (hospitalGroupId: bigint) => {
  return prisma.staff.findMany({
    where: {
      hospital: { hospitalGroupId },
    },
    include: {
      credential: {
        select: {
          email: true,
          mobile: true,
          role: true,
          isActive: true,
        },
      },
      hospital: {
        select: {
          id: true,
          branchName: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
};

// ─── Get single ─────────────────────────────────────────────────────────────
export const getSingleStaffService = async (hospitalGroupId: bigint, staffId: bigint) => {
  const staff = await prisma.staff.findFirst({
    where: {
      id: staffId,
      hospital: { hospitalGroupId },
    },
    include: { credential: true, hospital: true },
  });

  if (!staff) {
    throw new Error('Staff not found');
  }

  return staff;
};

// ─── Update ─────────────────────────────────────────────────────────────────
export const updateStaffService = async (
  hospitalGroupId: bigint,
  staffId: bigint,
  data: UpdateStaffDto,
) => {
  const existingStaff = await prisma.staff.findFirst({
    where: {
      id: staffId,
      hospital: { hospitalGroupId },
    },
    include: { credential: true },
  });

  if (!existingStaff) {
    throw new Error('Staff not found');
  }

  // If updating hospital branch, verify it belongs to the group
  let targetHospitalId: bigint | undefined;
  if (data.hospitalId !== undefined) {
    targetHospitalId = BigInt(data.hospitalId);
    const hospital = await prisma.hospital.findFirst({
      where: { id: targetHospitalId, hospitalGroupId },
    });
    if (!hospital) {
      throw new Error('Hospital branch not found or does not belong to this group');
    }
  }

  return prisma.$transaction(async (tx) => {
    const credentialData: { email?: string; mobile?: string } = {};
    if (data.email !== undefined) credentialData.email = data.email;
    if (data.mobile !== undefined) credentialData.mobile = data.mobile;

    if (Object.keys(credentialData).length > 0) {
      await tx.userCredential.update({
        where: { id: existingStaff.credentialId },
        data: credentialData,
      });
    }

    return tx.staff.update({
      where: { id: staffId },
      data: {
        ...(data.firstName !== undefined && { firstName: data.firstName }),
        ...(data.middleName !== undefined && { middleName: data.middleName }),
        ...(data.lastName !== undefined && { lastName: data.lastName }),
        ...(data.gender !== undefined && { gender: data.gender }),
        ...(data.profilePhoto !== undefined && { profilePhoto: data.profilePhoto }),
        ...(data.dateOfBirth !== undefined && { dateOfBirth: new Date(data.dateOfBirth) }),
        ...(targetHospitalId !== undefined && { hospitalId: targetHospitalId }),
      },
      include: { credential: true, hospital: true },
    });
  });
};

// ─── Deactivate ──────────────────────────────────────────────────────────────
export const deactivateStaffService = async (hospitalGroupId: bigint, staffId: bigint) => {
  const staff = await prisma.staff.findFirst({
    where: {
      id: staffId,
      hospital: { hospitalGroupId },
    },
  });

  if (!staff) {
    throw new Error('Staff not found');
  }

  return prisma.userCredential.update({
    where: { id: staff.credentialId },
    data: { isActive: false },
  });
};

// ─── Get by credential ───────────────────────────────────────────────────────
export const getStaffIdByCredentialIdService = async (credentialId: bigint) => {
  if (!credentialId) {
    throw new Error('Credential ID is required');
  }

  const staff = await prisma.staff.findFirst({
    where: { credentialId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      hospitalId: true,
      credentialId: true,
    },
  });

  if (!staff) {
    throw new Error('Staff not found with this credential ID');
  }

  return staff;
};

// ─── Get hospital group id by staff id ──────────────────────────────────────
export const getStaffHospitalGroupIdService = async (staffId: bigint) => {
  const staff = await prisma.staff.findUnique({
    where: { id: staffId },
    select: {
      id: true,
      hospital: {
        select: {
          id: true,
          hospitalGroupId: true,
          hospitalGroup: {
            select: { id: true, name: true },
          },
        },
      },
    },
  });

  if (!staff) {
    throw new Error('Staff not found');
  }

  return {
    staffId: staff.id,
    hospitalId: staff.hospital.id,
    hospitalGroupId: staff.hospital.hospitalGroupId,
    hospitalGroupName: staff.hospital.hospitalGroup.name,
  };
};
