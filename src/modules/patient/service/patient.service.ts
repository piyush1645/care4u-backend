import prisma from '../../../config/prisma.js';
import {
  BadRequestError,
  DatabaseError,
  InternalServerError,
  NotFoundError,
} from '../../../common/handlers/error.handlers.js';
import type { ICreatePatient } from '../interface/patient.interface.js';
import argon2 from 'argon2';
import { createCredential } from '../../auth/service/auth.service.js';
import type { RegisterPatientInput, UpdatePatientInput } from '../validation/patient.validation.js';
import type { BloodGroup, Gender } from '../../../databases/generated/client.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'node:url';
import { uploadImage } from '../../../common/helpers/imageKit.helper.js';



type SearchDoctorFilters = {
  q?: string;
  hospitalId?: string;
  speciality?: string;
  page?: number;
  limit?: number;
};

export const getPatientId = async (credentialId: bigint | undefined) => {
  try {
    if (!credentialId) {
      throw new InternalServerError('patient id is required');
    }

    const patient = await prisma.patient.findUnique({
      where: {
        credentialId,
      },
    });
    if (!patient || !patient.id) {
      throw new NotFoundError('User with this credential id not found');
    }
    return patient.id;
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw new NotFoundError(error.message);
    }
    console.error(error);
    throw new DatabaseError('Error while finding user');
  }
};

export const createPatient = async (tx: any, data: ICreatePatient) => {
  return tx.patient.create({
    data: {
      firstName: data.firstName,
      middleName: data.middleName,
      lastName: data.lastName,
      gender: data.gender,
      dateOfBirth: new Date(data.dateOfBirth),
      bloodGroup: data.bloodGroup,
      credentialId: data.credentialId,
    },
  });
};

export const updateProfilePhoto = async (id: bigint, url: string) => {
  try {
    const updatedProfile = await prisma.patient.update({
      where: {
        id,
      },
      data: {
        profilePhoto: url,
      },
    });
    if (!updatedProfile) {
      throw new NotFoundError('Invalid Patient');
    }
    return updatedProfile;
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw new NotFoundError(error.message);
    }
    console.error(error);
    throw new InternalServerError('Error while updating profile photo');
  }
};
export const searchDoctorsForPatient = async (filters: SearchDoctorFilters) => {
  try {
    const page = filters.page && filters.page > 0 ? filters.page : 1;
    const limit = filters.limit && filters.limit > 0 ? filters.limit : 10;
    const skip = (page - 1) * limit;

    const where: any = {
      hospital: {
        isActive: true,
      },
      credential: {
        isActive: true,
      },
    };

    if (filters.hospitalId) {
      where.hospitalId = BigInt(filters.hospitalId);
    }

    if (filters.speciality) {
      where.speciality = {
        some: {
          name: {
            contains: filters.speciality,
          },
        },
      };
    }

    if (filters.q) {
      where.OR = [
        {
          firstName: {
            contains: filters.q,
          },
        },
        {
          lastName: {
            contains: filters.q,
          },
        },
        {
          speciality: {
            some: {
              name: {
                contains: filters.q,
              },
            },
          },
        },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.doctor.findMany({
        where,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          profilePhoto: true,
          expereince: true,
          charges: true,
          slotDuration: true,
          hospital: {
            select: {
              id: true,
              branchName: true,
              address: {
                select: {
                  city: true,
                },
              },
            },
          },
          speciality: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.doctor.count({ where }),
    ]);

    return {
      items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error(error);
    throw new DatabaseError('Error while searching doctors');
  }
};

export const getDoctorDetailsForPatient = async (doctorId: string) => {
  try {
    if (!doctorId) {
      throw new InternalServerError('doctorId is required');
    }

    const doctor = await prisma.doctor.findFirst({
      where: {
        id: BigInt(doctorId),
        hospital: {
          isActive: true,
        },
        credential: {
          isActive: true,
        },
      },
      select: {
        id: true,
        firstName: true,
        middleName: true,
        lastName: true,
        profilePhoto: true,
        gender: true,
        preferedLanguages: true,
        expereince: true,
        charges: true,
        slotDuration: true,
        hospital: {
          select: {
            id: true,
            branchName: true,
            photo: true,
            address: {
              select: {
                addressLine1: true,
                addressLine2: true,
                city: true,
                state: true,
                country: true,
                pincode: true,
              },
            },
          },
        },
        speciality: {
          select: {
            name: true,
          },
        },
        degree: {
          select: {
            courseName: true,
            abbreviation: true,
            institution: true,
            passingYear: true,
          },
          orderBy: {
            passingYear: 'desc',
          },
        },
        schedule: {
          select: {
            morningStartTime: true,
            morningEndTime: true,
            eveningStartTime: true,
            eveningEndTime: true,
            workingDays: true,
          },
        },
        review: {
          select: {
            rating: true,
            review: true,
            createdAt: true,
            patient: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!doctor) {
      throw new NotFoundError('Doctor not found');
    }

    return doctor;
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw new NotFoundError(error.message);
    }
    if (error instanceof InternalServerError) {
      throw new InternalServerError(error.message);
    }
    console.error(error);
    throw new DatabaseError('Error while fetching doctor details');
  }
};

export const getDashboardService = async (patientId: bigint) => {
  // get patient + credential
  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    include: {
      credential: {
        select: {
          email: true,
          mobile: true,
        },
      },
    },
  });

  if (!patient) throw new NotFoundError('Patient profile not found');

  const [nextAppointment, stats, recentAppointments] = await Promise.all([
    // NEXT UPCOMING APPOINTMENT
    // findFirst not findMany — we only need one
    // gte: future dates only
    prisma.appointment.findFirst({
      where: {
        patientId: patient.id,
        status: {
          in : ['BOOKED','RESCHEDULED']
        },
        appointmentEndTime: { gt: new Date() },
      },

      orderBy: [{ appointmentDate: 'asc' },
        { appointmentStartTime: 'asc' }] ,

      select: {
        id: true,
        appointmentDate: true,
        appointmentStartTime: true,
        appointmentEndTime: true,
        status: true,
        bookedBy: true,
        type: true,
        doctor: {
          select: {
            id: true,
            firstName: true,
            middleName: true,
            lastName: true,
            profilePhoto: true,
            expereince: true,
            charges: true,
            speciality: {
              select: { name: true },
            },
          },
        },
        hospital: {
          select: {
            id: true,
            branchName: true,
            photo: true,
            hospitalGroup: {
              select: { name: true },
            },
          },
        },
      },
    }),

    // STATS
    Promise.all([
      prisma.appointment.count({
        where: {
          patientId: patient.id,
          status: { not: 'CANCELLED' },
          appointmentEndTime: { lte: new Date() },
        },
      }),
      prisma.appointment.count({
        where: {
          patientId: patient.id,
          status: { in: ['BOOKED', 'RESCHEDULED'] },
          appointmentEndTime: { gt: new Date() },
        },
      }),
      prisma.appointment.count({
        where: {
          patientId: patient.id,
          status: 'CANCELLED',
        },
      }),
    ]).then(([totalVisits, upcomingCount, cancelledCount]) => ({
      totalVisits,
      upcomingCount,
      cancelledCount,
    })),

    // RECENT PAST APPOINTMENTS
    prisma.appointment.findMany({
      where: {
        patientId: patient.id,
        status: { not: 'CANCELLED' },
        appointmentEndTime: { lte: new Date() },
      },
      orderBy: [
        { appointmentDate: 'desc' },
        { appointmentStartTime: 'desc' }
      ],
      take: 3,
      select: {
        id: true,
        appointmentDate: true,
        appointmentStartTime: true,
        status: true,
        doctor: {
          select: {
            firstName: true,
            middleName: true,
            lastName: true,
            speciality: {
              select: { name: true },
            },
          },
        },
        hospital: {
          select: {
            branchName: true,
            hospitalGroup: {
              select: { name: true },
            },
          },
        },

        prescription: {
          select: {
            precautions: true,
          },
        },
        billing: {
          select: {
            consultationFees: true,
            taxCharges: true,
            totalAmount: true,
            paidBy: true,
          },
        },
      },
    }),
  ]);

  // Repsonse
  return {
    patient: {
      id: patient.id.toString(),
      firstName: patient.firstName,
      fullName: [patient.firstName, patient.middleName, patient.lastName].filter(Boolean).join(' '),
      profilePhoto: patient.profilePhoto,
      email: patient.credential.email,
      mobile: patient.credential.mobile,
      gender: patient.gender,
      bloodGroup: patient.bloodGroup,
    },

    stats: {
      totalVisits: stats.totalVisits,
      upcomingCount: stats.upcomingCount,
      cancelledCount: stats.cancelledCount,
    },

    // nextAppointment can be null if no upcoming appointments
    nextAppointment: nextAppointment
      ? {
          id: nextAppointment.id.toString(),
          appointmentDate: nextAppointment.appointmentDate,
          appointmentStartTime: nextAppointment.appointmentStartTime,
          appointmentEndTime: nextAppointment.appointmentEndTime,
          status: nextAppointment.status,
          bookedBy: nextAppointment.bookedBy,
          type: nextAppointment.type,
          doctor: {
            id: nextAppointment.doctor.id.toString(),
            fullName: [
              nextAppointment.doctor.firstName,
              nextAppointment.doctor.middleName,
              nextAppointment.doctor.lastName,
            ]
              .filter(Boolean)
              .join(' '),
            profilePhoto: nextAppointment.doctor.profilePhoto,
            experience: nextAppointment.doctor.expereince,
            charges: nextAppointment.doctor.charges,
            specialities: nextAppointment.doctor.speciality.map((s) => s.name),
          },
          hospital: {
            id: nextAppointment.hospital.id.toString(),
            branchName: nextAppointment.hospital.branchName,
            photo: nextAppointment.hospital.photo,
            groupName: nextAppointment.hospital.hospitalGroup.name,
          },
        }
      : null,

    recentAppointments: recentAppointments.map((appt) => ({
      id: appt.id.toString(),
      appointmentDate: appt.appointmentDate,
      appointmentStartTime: appt.appointmentStartTime,
      status: appt.status,
      doctor: {
        fullName: [appt.doctor.firstName, appt.doctor.middleName, appt.doctor.lastName]
          .filter(Boolean)
          .join(' '),
        speciality: appt.doctor.speciality.map((s) => s.name),
      },
      hospital: {
        branchName: appt.hospital.branchName,
        groupName: appt.hospital.hospitalGroup.name,
      },
      prescription: appt.prescription ? { precautions: appt.prescription.precautions } : null,
      billing: appt.billing
        ? {
            consultationFees: appt.billing.consultationFees,
            taxCharges: appt.billing.taxCharges,
            totalAmount: appt.billing.totalAmount,
            paidBy: appt.billing.paidBy,
          }
        : null,
    })),
  };
};

export const getAvailableSlots = async (doctorId: string, date: string) => {
  try {
    if (!doctorId) throw new InternalServerError('doctorId is required');

    const selectedDate = new Date(date);
    if (isNaN(selectedDate.getTime())) throw new BadRequestError('Invalid date');

    const doctor = await prisma.doctor.findFirst({
      where: {
        id: BigInt(doctorId),
        credential: { isActive: true },
      },
      select: {
        slotDuration: true,
        schedule: {
          select: {
            workingDays: true,
            morningStartTime: true,
            morningEndTime: true,
            eveningStartTime: true,
            eveningEndTime: true,
          },
        },
        leaves: {
          where: {
            leaveDate: {
              gte: new Date(new Date(selectedDate).setUTCHours(0, 0, 0, 0)),
              lte: new Date(new Date(selectedDate).setUTCHours(23, 59, 59, 999)),
            },
          },
          select: {
            leaveDate: true,
            leaveStartTime: true,
            leaveEndTime: true,
          },
        },
      },
    });

    if (!doctor) throw new NotFoundError('Doctor not found');

    const schedule = doctor.schedule[0];
    if (!schedule) return [];

    const slotDuration = doctor.slotDuration; // in minutes

    // Reparse date cleanly to avoid mutation issues
    const targetDate = new Date(date);
    const clinicTimeZone = 'Asia/Kolkata';
    const formatClinicParts = (value: Date | string | null | undefined) => {
      if (!value) return { hour: 0, minute: 0 };
      const d = value instanceof Date ? value : new Date(value);
      const formatter = new Intl.DateTimeFormat('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: clinicTimeZone,
      });
      const parts = formatter.formatToParts(d);
      const hour = Number(parts.find((p) => p.type === 'hour')?.value || '0');
      const minute = Number(parts.find((p) => p.type === 'minute')?.value || '0');
      return { hour, minute };
    };
    const buildClinicDate = (baseDate: Date, hour: number, minute: number) => {
      const yyyy = baseDate.getFullYear();
      const mm = String(baseDate.getMonth() + 1).padStart(2, '0');
      const dd = String(baseDate.getDate()).padStart(2, '0');
      return new Date(`${yyyy}-${mm}-${dd}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00+05:30`);
    };

    // Check working day
    const DAYS_MAP = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const dayName = DAYS_MAP[targetDate.getDay()] || '';
    const workingDays = schedule.workingDays?.split(',').map((d: string) => d.trim()) ?? [];
    if (!workingDays.includes(dayName)) return [];

    // Full-day leave?
    const hasFullDayLeave = doctor.leaves.some((l) => !l.leaveStartTime && !l.leaveEndTime);
    if (hasFullDayLeave) return [];

    // Build slot ranges from schedule
    const ranges: { start: Date; end: Date; period: 'MORNING' | 'EVENING' }[] = [];
    const buildRange = (startInput: any, endInput: any, period: 'MORNING' | 'EVENING') => {
      if (!startInput || !endInput) return;

      const startParts = formatClinicParts(startInput);
      const endParts = formatClinicParts(endInput);

      const s = buildClinicDate(targetDate, startParts.hour, startParts.minute);
      const e = buildClinicDate(targetDate, endParts.hour, endParts.minute);

      ranges.push({ start: s, end: e, period });
    };

    buildRange(schedule.morningStartTime, schedule.morningEndTime, 'MORNING');
    buildRange(schedule.eveningStartTime, schedule.eveningEndTime, 'EVENING');

    // Fetch booked appointments on that day
    const dayStart = new Date(targetDate);
    dayStart.setUTCHours(0, 0, 0, 0);
    const dayEnd = new Date(targetDate);
    dayEnd.setUTCHours(23, 59, 59, 999);

    const booked = await prisma.appointment.findMany({
      where: {
        doctorId: BigInt(doctorId),
        status: { not: 'CANCELLED' },
        appointmentDate: { gte: dayStart, lte: dayEnd },
      },
      select: { appointmentStartTime: true, appointmentEndTime: true },
    });

    // Generate all slots across all ranges
    const slots: { time: string; startTime: string; status: 'AVAILABLE' | 'BOOKED' | 'LEAVE'; period: 'MORNING' | 'EVENING'; timezone?: string }[] =
      [];

    const timezone = clinicTimeZone;

    const timeLabelFormatter = new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: timezone,
    });

    for (const range of ranges) {
      const cursor = new Date(range.start);
      while (cursor < range.end) {
        const slotStart = new Date(cursor);
        const slotEnd = new Date(cursor.getTime() + slotDuration * 60 * 1000);
        if (slotEnd > range.end) break;

        const timeLabel = timeLabelFormatter.format(slotStart).toLowerCase();
        const startParts = formatClinicParts(slotStart);
        const startTime = `${String(startParts.hour).padStart(2, '0')}:${String(startParts.minute).padStart(2, '0')}`;

        // Check leave overlap — all values are UTC Date objects; comparison is timezone-safe
        const onLeave = doctor.leaves.some((l) => {
          if (!l.leaveStartTime || !l.leaveEndTime) return false;
          return slotStart < new Date(l.leaveEndTime) && slotEnd > new Date(l.leaveStartTime);
        });

        // Check booking overlap — all values are UTC Date objects; comparison is timezone-safe
        const isBooked = booked.some(
          (b) => slotStart < new Date(b.appointmentEndTime) && slotEnd > new Date(b.appointmentStartTime),
        );

        slots.push({
          time: timeLabel,
          startTime: startTime,
          status: onLeave ? 'LEAVE' : isBooked ? 'BOOKED' : 'AVAILABLE',
          period: range.period,
          timezone: timezone,
        });

        cursor.setTime(cursor.getTime() + slotDuration * 60 * 1000);
      }
    }

    return slots;
  } catch (error) {
    if (error instanceof NotFoundError) throw new NotFoundError(error.message);
    if (error instanceof BadRequestError) throw new BadRequestError(error.message);
    console.error(error);
    throw new DatabaseError('Error while generating slots');
  }
};

export const registerPatientService = async (body: RegisterPatientInput) => {
  try {
    const existingEmail = await prisma.userCredential.findFirst({ where: { email: body.email } });
    if (existingEmail) {
      throw new BadRequestError('Email already in use');
    }

    const existingMobile = await prisma.userCredential.findFirst({ where: { mobile: body.mobile } });
    if (existingMobile) {
      throw new BadRequestError('Mobile number already in use');
    }

    const hashedPassword = await argon2.hash(body.password);

    const result = await prisma.$transaction(async (tx) => {
      const credential = await createCredential(tx, {
        email: body.email,
        mobile: body.mobile,
        hashedPassword,
        role: 'PATIENT',
      });

      const patient = await createPatient(tx, {
        firstName: body.firstName,
        ...(body.middleName ? { middleName: body.middleName } : {}),
        lastName: body.lastName,
        gender: body.gender as Gender,
        dateOfBirth: body.dateOfBirth,
        bloodGroup: body.bloodGroup as BloodGroup,
        credentialId: credential.id,
      });

      return { credential, patient };
    });

    return result;
  } catch (error: any) {
    if (error instanceof BadRequestError) throw error;
    console.error(error);
    throw new DatabaseError(error.message || 'Error registering patient');
  }
};

export const getPatientProfileService = async (patientId: bigint) => {
  try {
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: { credential: true },
    });

    if (!patient) throw new NotFoundError('Patient profile not found');

    return {
      id: patient.id.toString(),
      firstName: patient.firstName,
      middleName: patient.middleName ?? null,
      lastName: patient.lastName,
      profilePhoto: patient.profilePhoto ?? null,
      email: patient.credential.email,
      mobile: patient.credential.mobile,
      gender: patient.gender,
      dateOfBirth: patient.dateOfBirth,
      bloodGroup: patient.bloodGroup,
    };
  } catch (error: any) {
    if (error instanceof NotFoundError) throw error;
    console.error(error);
    throw new DatabaseError(error.message || 'Error fetching profile');
  }
};

export const updatePatientProfileService = async (
  patientId: bigint,
  body: UpdatePatientInput,
  file?: any
) => {
  try {
    const updateData: any = {};
    if (body.firstName) updateData.firstName = body.firstName;
    if (body.middleName !== undefined) updateData.middleName = body.middleName;
    if (body.lastName) updateData.lastName = body.lastName;
    if (body.gender) updateData.gender = body.gender as Gender;
    if (body.dateOfBirth) updateData.dateOfBirth = new Date(body.dateOfBirth);
    if (body.bloodGroup) updateData.bloodGroup = body.bloodGroup as BloodGroup;

    if (file) {
      const fileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}-${file.originalname}`;
      const uploadedImage = await uploadImage(
        file.buffer,
        fileName,
        "/uploads"
      );
      if (!uploadedImage) {
        throw new InternalServerError('Error while uploading profile photo');
      }
      updateData.profilePhoto = uploadedImage.url;
    } else if (body.profilePhoto) {
      updateData.profilePhoto = body.profilePhoto;
    }

    if (updateData.profilePhoto) {
      const existing = await prisma.patient.findUnique({ where: { id: patientId } });
      const existingPhoto = existing?.profilePhoto;
      if (existingPhoto && existingPhoto.startsWith('/uploads/')) {
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        const filePath = path.join(__dirname, '../../../../public', existingPhoto);
        await fs.promises.unlink(filePath).catch(() => {});
      }
    }

    const updated = await prisma.patient.update({
      where: { id: patientId },
      data: updateData,
    });

    return {
      id: updated.id.toString(),
      firstName: updated.firstName,
      middleName: updated.middleName ?? null,
      profilePhoto: updated.profilePhoto ?? null,
      lastName: updated.lastName,
      gender: updated.gender,
      dateOfBirth: updated.dateOfBirth,
      bloodGroup: updated.bloodGroup,
    };
  } catch (error: any) {
    console.error(error);
    if (error instanceof InternalServerError) throw error;
    throw new DatabaseError(error.message || 'Error updating profile');
  }
};

