import argon2 from 'argon2';

import prisma from '../../../config/prisma.js';
import { ROLE } from '../../../common/constants/index.js';
import { BadRequestError, NotFoundError } from '../../../common/handlers/error.handlers.js';
import type {
  BookAppointmentByStaffDto,
  RegisterPatientByStaffDto,
} from '../interfaces/staffDashboard.interface.js';

// ─────────────────────────────────────────────────────────────
// Helper: get hospitalId for the authenticated staff member.
// JWT stores staffId (staff table PK) in userId — query by id.
// ─────────────────────────────────────────────────────────────
export const getStaffHospitalId = async (staffId: bigint): Promise<bigint> => {
  const staff = await prisma.staff.findUnique({
    where: { id: staffId },
    select: { hospitalId: true },
  });
  if (!staff) throw new NotFoundError('Staff profile not found');
  return staff.hospitalId;
};

// ─────────────────────────────────────────────────────────────
// 1. Staff's own profile (populates dashboard header)
// ─────────────────────────────────────────────────────────────
export const getMyProfileService = async (staffId: bigint) => {
  const staff = await prisma.staff.findUnique({
    where: { id: staffId },
    select: {
      id: true,
      firstName: true,
      middleName: true,
      lastName: true,
      profilePhoto: true,
      gender: true,
      dateOfBirth: true,
      hospital: {
        select: {
          id: true,
          branchName: true,
          hospitalGroupId: true,
          hospitalGroup: { select: { id: true, name: true } },
        },
      },
      credential: { select: { email: true, mobile: true } },
    },
  });

  if (!staff) throw new NotFoundError('Staff profile not found');

  const mid = staff.middleName ? ` ${staff.middleName}` : '';

  return {
    id: staff.id.toString(),
    firstName: staff.firstName,
    middleName: staff.middleName ?? null,
    lastName: staff.lastName,
    fullName: `${staff.firstName}${mid} ${staff.lastName}`,
    profilePhoto: staff.profilePhoto ?? null,
    gender: staff.gender,
    dateOfBirth: staff.dateOfBirth,
    email: staff.credential.email,
    mobile: staff.credential.mobile,
    hospitalId: staff.hospital.id.toString(),
    hospitalName: staff.hospital.branchName,
    hospitalGroupId: staff.hospital.hospitalGroupId.toString(),
    hospitalGroupName: staff.hospital.hospitalGroup.name,
  };
};

// ─────────────────────────────────────────────────────────────
// 2. Resolve hospitalGroupId — works for STAFF and ADMIN roles
// ─────────────────────────────────────────────────────────────
export const resolveHospitalGroupService = async (userId: bigint, role: string) => {
  if (role === ROLE.STAFF) {
    const staff = await prisma.staff.findUnique({
      where: { id: userId },
      select: {
        hospital: {
          select: {
            id: true,
            branchName: true,
            hospitalGroupId: true,
            hospitalGroup: { select: { id: true, name: true } },
          },
        },
      },
    });
    if (!staff) throw new NotFoundError('Staff not found');
    return {
      hospitalGroupId: staff.hospital.hospitalGroupId.toString(),
      hospitalGroupName: staff.hospital.hospitalGroup.name,
      hospitalId: staff.hospital.id.toString(),
      hospitalName: staff.hospital.branchName,
    };
  }

  if (role === ROLE.ADMIN || role === ROLE.SUPER_ADMIN) {
    const admin = await prisma.admin.findUnique({
      where: { id: userId },
      select: {
        hospitalGroupId: true,
        hospitalGroup: { select: { id: true, name: true } },
      },
    });
    if (!admin) throw new NotFoundError('Admin not found');
    return {
      hospitalGroupId: admin.hospitalGroupId.toString(),
      hospitalGroupName: admin.hospitalGroup.name,
      hospitalId: null,
      hospitalName: null,
    };
  }

  throw new BadRequestError('Invalid role');
};

// ─────────────────────────────────────────────────────────────
// 3. Doctors at the staff's hospital (for booking dropdown)
//
// FIX: Doctor model relation is `speciality` (singular),
//      NOT `specialities`.
// ─────────────────────────────────────────────────────────────
export const getDoctorsForHospitalService = async (hospitalId: bigint) => {
  const doctors = await prisma.doctor.findMany({
    where: {
      hospitalId,
      credential: { isActive: true },
    },
    select: {
      id: true,
      firstName: true,
      middleName: true,
      lastName: true,
      profilePhoto: true,
      charges: true,
      slotDuration: true,
      speciality: { select: { name: true } }, // ← correct relation name
      gender: true,
      expereince: true,
      hospital: {
        select: {
          branchName: true,
          address: {
            select: { addressLine1: true, city: true, state: true }
          }
        }
      },
      schedule: true,
      degree: true,
    },
    orderBy: { firstName: 'asc' },
  });

  return doctors.map((d) => ({
    id: d.id.toString(),
    fullName: `Dr. ${d.firstName}${d.middleName ? ' ' + d.middleName : ''} ${d.lastName}`,
    profilePhoto: d.profilePhoto ?? null,
    charges: d.charges,
    slotDuration: d.slotDuration,
    specialities: d.speciality.map((s) => s.name), // map from correct relation
    gender: d.gender,
    experience: d.expereince,
    expereince: d.expereince,
    hospital: d.hospital,
    schedules: d.schedule,
    schedule: d.schedule,
    degrees: d.degree,
  }));
};

// ─────────────────────────────────────────────────────────────
// 4. All hospitals in a group (for Add Staff hospital dropdown)
// ─────────────────────────────────────────────────────────────
export const getHospitalsInGroupService = async (hospitalGroupId: bigint) => {
  const hospitals = await prisma.hospital.findMany({
    where: { hospitalGroupId, isActive: true },
    select: { id: true, branchName: true },
    orderBy: { branchName: 'asc' },
  });
  return hospitals.map((h) => ({ id: h.id.toString(), branchName: h.branchName }));
};

// ─────────────────────────────────────────────────────────────
// 5. Available time slots for a doctor on a date
// ─────────────────────────────────────────────────────────────
export const getAvailableSlotsService = async (
  doctorId: bigint,
  date: string,
  hospitalId: bigint,
) => {
  const doctor = await prisma.doctor.findFirst({
    where: { id: doctorId, hospitalId },
    include: { schedule: true, leaves: true },
  });

  if (!doctor) throw new NotFoundError('Doctor not found in this hospital');

  const schedule = doctor.schedule[0];
  if (!schedule) throw new NotFoundError('No schedule configured for this doctor');

  // Day-of-week check — use 'long' to get "Monday", then uppercase → "MONDAY"
  const selectedDate = new Date(date);
  const dayName = selectedDate.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();

  let workingDays: string[] = [];
  try {
    workingDays = JSON.parse(schedule.workingDays);
  } catch {
    workingDays = schedule.workingDays.split(',').map((d) => d.trim().toUpperCase());
  }

  if (!workingDays.includes(dayName)) {
    return { isAvailable: false, reason: `Doctor does not work on ${dayName}`, slots: [] };
  }

  // Leave check
  const startOfDay = new Date(selectedDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(selectedDate);
  endOfDay.setHours(23, 59, 59, 999);

  const onLeave = doctor.leaves.some((leave) => {
    const ld = new Date(leave.leaveDate);
    return ld >= startOfDay && ld <= endOfDay;
  });

  if (onLeave) {
    return { isAvailable: false, reason: 'Doctor is on leave on this date', slots: [] };
  }

  // Existing bookings for the day
  const booked = await prisma.appointment.findMany({
    where: {
      doctorId,
      status: { not: 'CANCELLED' },
      appointmentDate: { gte: startOfDay, lte: endOfDay },
    },
    select: { appointmentStartTime: true, appointmentEndTime: true },
  });

  const slotDuration = doctor.slotDuration;
  type Slot = { startTime: string; endTime: string; isBooked: boolean };
  const allSlots: Slot[] = [];

  const generateSlots = (windowStart: Date | null, windowEnd: Date | null) => {
    if (!windowStart || !windowEnd) return;

    const start = new Date(selectedDate);
    start.setHours(new Date(windowStart).getHours(), new Date(windowStart).getMinutes(), 0, 0);
    const end = new Date(selectedDate);
    end.setHours(new Date(windowEnd).getHours(), new Date(windowEnd).getMinutes(), 0, 0);

    const cursor = new Date(start);
    while (cursor < end) {
      const slotEnd = new Date(cursor);
      slotEnd.setMinutes(slotEnd.getMinutes() + slotDuration);
      if (slotEnd > end) break;

      const isBooked = booked.some(
        (a) =>
          new Date(a.appointmentStartTime) < slotEnd && new Date(a.appointmentEndTime) > cursor,
      );

      allSlots.push({
        startTime: new Date(cursor).toISOString(),
        endTime: slotEnd.toISOString(),
        isBooked,
      });
      cursor.setMinutes(cursor.getMinutes() + slotDuration);
    }
  };

  generateSlots(schedule.morningStartTime, schedule.morningEndTime);
  generateSlots(schedule.eveningStartTime, schedule.eveningEndTime);

  return {
    isAvailable: true,
    doctorId: doctorId.toString(),
    date,
    slotDuration,
    totalSlots: allSlots.length,
    availableSlots: allSlots.filter((s) => !s.isBooked).length,
    bookedSlots: allSlots.filter((s) => s.isBooked).length,
    slots: allSlots,
  };
};

// ─────────────────────────────────────────────────────────────
// 6. Register a new walk-in patient
// ─────────────────────────────────────────────────────────────
export const registerPatientByStaffService = async (data: RegisterPatientByStaffDto) => {
  const existing = await prisma.userCredential.findFirst({
    where: { OR: [{ email: data.email }, { mobile: data.mobile }] },
  });
  if (existing) throw new BadRequestError('An account with this email or mobile already exists');

  const hashedPassword = await argon2.hash(data.password);

  return prisma.$transaction(async (tx) => {
    const credential = await tx.userCredential.create({
      data: {
        email: data.email,
        mobile: data.mobile,
        hashedPassword,
        role: ROLE.PATIENT as any,
      },
    });

    const patient = await tx.patient.create({
      data: {
        firstName: data.firstName,
        middleName: data.middleName ?? null,
        lastName: data.lastName,
        gender: data.gender as any,
        dateOfBirth: new Date(data.dateOfBirth),
        bloodGroup: data.bloodGroup as any,
        credentialId: credential.id,
      },
    });

    return {
      id: patient.id.toString(),
      firstName: patient.firstName,
      middleName: patient.middleName ?? null,
      lastName: patient.lastName,
      fullName: `${patient.firstName} ${patient.lastName}`,
      gender: patient.gender,
      dateOfBirth: patient.dateOfBirth,
      bloodGroup: patient.bloodGroup,
      email: credential.email,
      mobile: credential.mobile,
    };
  });
};

// ─────────────────────────────────────────────────────────────
// 7. Book appointment + billing + payment (single transaction)
//
// FIX: Payment model fields are `amount`, `type`, `status`
//      NOT `totalAmount`, `paymentType`, `paymentStatus`.
// ─────────────────────────────────────────────────────────────
export const bookAppointmentByStaffService = async (
  data: BookAppointmentByStaffDto,
  hospitalId: bigint,
) => {
  const doctorId = BigInt(data.doctorId);
  const patientId = BigInt(data.patientId);

  const doctor = await prisma.doctor.findFirst({
    where: { id: doctorId, hospitalId },
    select: { id: true, firstName: true, lastName: true, slotDuration: true },
  });
  if (!doctor) throw new NotFoundError('Doctor not found in this hospital');

  const patient = await prisma.patient.findFirst({
    where: { id: patientId },
    select: { id: true, firstName: true, lastName: true },
  });
  if (!patient) throw new NotFoundError('Patient not found');

  const startTime = new Date(data.appointmentTime);
  const endTime = new Date(startTime);
  endTime.setMinutes(endTime.getMinutes() + doctor.slotDuration);

  // Conflict check before entering the transaction
  const conflict = await prisma.appointment.findFirst({
    where: {
      doctorId,
      status: { not: 'CANCELLED' },
      AND: [{ appointmentStartTime: { lt: endTime } }, { appointmentEndTime: { gt: startTime } }],
    },
  });
  if (conflict)
    throw new BadRequestError('This slot is already booked. Please choose another time.');

  return prisma.$transaction(async (tx) => {
    const conflict = await tx.appointment.findFirst({
      where: {
        doctorId,
        status: { not: 'CANCELLED' },
        AND: [
          { appointmentStartTime: { lt: endTime } },
          { appointmentEndTime: { gt: startTime } },
        ],
      },
    });

    if (conflict) {
      throw new BadRequestError('This slot is already booked. Please choose another time.');
    }

    const appointment = await tx.appointment.create({
      data: {
        doctorId,
        patientId,
        hospitalId,
        appointmentDate: startTime,
        appointmentStartTime: startTime,
        appointmentEndTime: endTime,
        status: 'BOOKED',
        bookedBy: 'STAFF',
        referenceNumber: `APT-${Date.now()}`,
      } as any,
      include: {
        doctor: { select: { id: true, firstName: true, lastName: true } },
        patient: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    // 2. Create the Invoice (Only the fee calculation fields go here)
    const billing = await tx.invoice.create({
      data: {
        appointmentId: appointment.id,
        consultationFees: data.consultationFees,
        taxRate: data.taxRate,
        taxCharges: data.taxCharges,
        totalAmount: data.totalAmount,
        paidBy: data.paidBy,
      } as any,
    });

    // 3. Create the Payment Record (Only the transaction details go here)
    await tx.payment.create({
      data: {
        invoiceId: billing.id,
        amount: data.totalAmount,
        
        // Maps the frontend "CASH"/"CARD" to your PaymentType enum
        type: data.paymentType as any, 
        
        // Maps the frontend "SUCCESS" to your PaymentStatus enum
        status: data.paymentStatus as any, 

        // Nested write to your PaymentDetails table
        paymentDetails: {
          create: {
            // 🚨 CRITICAL: We must use "transcationId" exactly as spelled in your schema
            transcationId: data.transactionId || null,
            
            // Note: If you ever pass card/upi from the frontend, add them here:
            // cardNumber: data.cardNumber || null,
            // upiId: data.upiId || null,
          }
        }
      } as any,
    });

    return {
      ...appointment,
      id: appointment.id.toString(),
      doctorId: appointment.doctorId.toString(),
      patientId: appointment.patientId.toString(),
      hospitalId: appointment.hospitalId.toString(),
    };
  });
};

// ─────────────────────────────────────────────────────────────
// 4. View all appointments at the hospital (with filters)
// ─────────────────────────────────────────────────────────────
export const getHospitalAppointmentsService = async (
  hospitalId: bigint,
  date?: string,
  doctorId?: string,
  status?: string,
) => {
  const where: any = { hospitalId };

  if (date) {
    const selectedDate = new Date(date);
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);
    where.appointmentDate = { gte: startOfDay, lte: endOfDay };
  }

  if (doctorId) where.doctorId = BigInt(doctorId);

  if (status) {
    if (status === 'COMPLETED') {
      where.status = { in: ['BOOKED', 'ON_GOING', 'RESCHEDULED'] };
      where.appointmentEndTime = { lt: new Date() };
    } else if (status === 'BOOKED' || status === 'ON_GOING' || status === 'RESCHEDULED') {
      where.status = status;
      where.appointmentEndTime = { gte: new Date() };
    } else {
      where.status = status as any;
    }
  }

  const appointments = await prisma.appointment.findMany({
    where,
    include: {
      doctor: {
        select: { id: true, firstName: true, lastName: true, profilePhoto: true },
      },
      patient: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          profilePhoto: true,
          credential: { select: { mobile: true, email: true } },
        },
      },
      billing: {
        select: {
          totalAmount: true,
          paidBy: true,
          payment: {
            select: {
              status: true, // ← correct field name on Payment model
              type: true, // ← correct field name on Payment model
            },
          },
        },
      },
    },
    orderBy: { appointmentStartTime: 'asc' },
  });

  const now = new Date();
  return appointments.map((a) => {
    let mappedStatus = a.status;
    const endTime = new Date(a.appointmentEndTime);
    if (
      now > endTime &&
      (a.status === 'BOOKED' ||
        a.status === 'ON_GOING' ||
        a.status === 'RESCHEDULED')
    ) {
      mappedStatus = 'COMPLETED';
    }

    return {
      id: a.id.toString(),
      doctorId: a.doctorId.toString(),
      patientId: a.patientId.toString(),
      hospitalId: a.hospitalId.toString(),
      status: mappedStatus,
      bookedBy: a.bookedBy,
      appointmentDate: a.appointmentDate,
      startTime: a.appointmentStartTime,
      endTime: a.appointmentEndTime,
    doctor: {
      id: a.doctor.id.toString(),
      fullName: `Dr. ${a.doctor.firstName} ${a.doctor.lastName}`,
      profilePhoto: a.doctor.profilePhoto ?? null,
    },
    patient: {
      id: a.patient.id.toString(),
      fullName: `${a.patient.firstName} ${a.patient.lastName}`,
      profilePhoto: a.patient.profilePhoto ?? null,
      mobile: a.patient.credential.mobile,
      email: a.patient.credential.email,
    },
    billing: a.billing
      ? {
          totalAmount: a.billing.totalAmount,
          paidBy: a.billing.paidBy,
          paymentStatus: a.billing.payment?.[0]?.status ?? null, // ← .status
          paymentType: a.billing.payment?.[0]?.type ?? null, // ← .type
        }
      : null,
    };
  });
};

// ─────────────────────────────────────────────────────────────
// 9. Search patients by name / email / mobile
// ─────────────────────────────────────────────────────────────
export const searchPatientsService = async (query: string) => {
  if (!query || query.trim().length < 2) {
    throw new BadRequestError('Search query must be at least 2 characters');
  }

  const patients = await prisma.patient.findMany({
    where: {
      OR: [
        { firstName: { contains: query } },
        { lastName: { contains: query } },
        {
          credential: {
            OR: [{ email: { contains: query } }, { mobile: { contains: query } }],
          },
        },
      ],
    },
    include: {
      credential: { select: { email: true, mobile: true, isActive: true } },
    },
    take: 20,
  });

  return patients.map((p) => ({
    id: p.id.toString(),
    firstName: p.firstName,
    middleName: p.middleName ?? null,
    lastName: p.lastName,
    fullName: `${p.firstName} ${p.lastName}`,
    gender: p.gender,
    dateOfBirth: p.dateOfBirth,
    bloodGroup: p.bloodGroup,
    email: p.credential.email,
    mobile: p.credential.mobile,
    isActive: p.credential.isActive,
  }));
};

// ─────────────────────────────────────────────────────────────
// 10. Staff self-update: updates own profile using staffId from JWT
//     No hospitalGroupId required — scoped entirely by JWT identity.
// ─────────────────────────────────────────────────────────────
export const updateMyProfileService = async (
  staffId: bigint,
  data: {
    firstName?: string;
    middleName?: string;
    lastName?: string;
    gender?: string;
    dateOfBirth?: string;
    profilePhoto?: string;
    email?: string;
    mobile?: string;
  },
) => {
  const existingStaff = await prisma.staff.findUnique({
    where: { id: staffId },
    include: { credential: true },
  });

  if (!existingStaff) throw new NotFoundError('Staff profile not found');

  // If email/mobile is being updated, check for conflicts with OTHER credentials
  if (data.email || data.mobile) {
    const conflict = await prisma.userCredential.findFirst({
      where: {
        AND: [
          { id: { not: existingStaff.credentialId } },
          {
            OR: [
              ...(data.email ? [{ email: data.email }] : []),
              ...(data.mobile ? [{ mobile: data.mobile }] : []),
            ],
          },
        ],
      },
    });
    if (conflict) throw new BadRequestError('Email or mobile is already in use by another account');
  }

  return prisma.$transaction(async (tx) => {
    // Update credential (email / mobile)
    const credentialData: { email?: string; mobile?: string } = {};
    if (data.email !== undefined) credentialData.email = data.email;
    if (data.mobile !== undefined) credentialData.mobile = data.mobile;

    if (Object.keys(credentialData).length > 0) {
      await tx.userCredential.update({
        where: { id: existingStaff.credentialId },
        data: credentialData,
      });
    }

    // Update staff record
    const updatedStaff = await tx.staff.update({
      where: { id: staffId },
      data: {
        ...(data.firstName !== undefined && { firstName: data.firstName }),
        ...(data.middleName !== undefined && { middleName: data.middleName }),
        ...(data.lastName !== undefined && { lastName: data.lastName }),
        ...(data.gender !== undefined && { gender: data.gender as any }),
        ...(data.profilePhoto !== undefined && { profilePhoto: data.profilePhoto }),
        ...(data.dateOfBirth !== undefined && { dateOfBirth: new Date(data.dateOfBirth) }),
      },
      include: {
        credential: { select: { email: true, mobile: true } },
        hospital: {
          select: {
            id: true,
            branchName: true,
            hospitalGroupId: true,
            hospitalGroup: { select: { id: true, name: true } },
          },
        },
      },
    });

    const mid = updatedStaff.middleName ? ` ${updatedStaff.middleName}` : '';
    return {
      id: updatedStaff.id.toString(),
      firstName: updatedStaff.firstName,
      middleName: updatedStaff.middleName ?? null,
      lastName: updatedStaff.lastName,
      fullName: `${updatedStaff.firstName}${mid} ${updatedStaff.lastName}`,
      profilePhoto: updatedStaff.profilePhoto ?? null,
      gender: updatedStaff.gender,
      dateOfBirth: updatedStaff.dateOfBirth,
      email: updatedStaff.credential.email,
      mobile: updatedStaff.credential.mobile,
      hospitalId: updatedStaff.hospital.id.toString(),
      hospitalName: updatedStaff.hospital.branchName,
      hospitalGroupId: updatedStaff.hospital.hospitalGroupId.toString(),
      hospitalGroupName: updatedStaff.hospital.hospitalGroup.name,
    };
  });
};
