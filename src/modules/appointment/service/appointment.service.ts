import {
  InternalServerError,
  NotFoundError,
  BadRequestError,
  DatabaseError,
} from '../../../common/handlers/error.handlers.js';
import prisma from '../../../config/prisma.js';
import type { ICreateAppointment, RescheduleAppointmentDto } from '../interface/appointment.interface.js';

export const mapAppointmentStatus = (appointment: any): any => {
  if (!appointment) return appointment;
  const now = new Date();
  const endTime = new Date(appointment.appointmentEndTime);
  if (
    now > endTime &&
    (appointment.status === 'BOOKED' ||
      appointment.status === 'ON_GOING' ||
      appointment.status === 'RESCHEDULED')
  ) {
    return {
      ...appointment,
      status: 'COMPLETED',
    };
  }
  return appointment;
};

export const findDoctorAppointments = async (
  type: 'user' | 'doctor',
  userID: string,
  date?: string,
) => {
  try {
    if (!userID) {
      throw new BadRequestError('userID is required');
    }

    const whereDate = date ? (() => {
      const selectedDate = new Date(date);
      const startOfTheDay = new Date(selectedDate);
      startOfTheDay.setHours(0, 0, 0, 0);
      const endOfTheDay = new Date(selectedDate);
      endOfTheDay.setHours(23, 59, 59, 999);
      return {
        appointmentDate: {
          gte: startOfTheDay,
          lte: endOfTheDay,
        }
      };
    })() : {};

    // Prisma stores IDs as BigInt — coerce the string from query params
    const idAsBigInt = BigInt(userID);
    const whereCondition =
      type === 'doctor'
        ? { doctorId: idAsBigInt }
        : { patientId: idAsBigInt };

    const appointments = await prisma.appointment.findMany({
      where: {
        ...whereCondition,
        ...whereDate,
      },

      include: {
        doctor: {
          include: {
            speciality: true
          }
        },
        patient: true,
        hospital: true,
        prescription : {
        select : {
           precautions : true
        }
        },
        billing:true
      },
      orderBy: {
        appointmentStartTime: 'asc',
      },
    });

    return (appointments ?? []).map(mapAppointmentStatus);
  } catch (error: any) {
    console.log(error);

    if (error instanceof BadRequestError) {
      throw error;
    }

    if (error instanceof NotFoundError) {
      throw error;
    }

    throw new InternalServerError(
      'Error while fetching appointments',
    );
  }
};

export const checkAppointmentTime = async (
  appointmentId: string,
): Promise<boolean> => {
  try {
    if (!appointmentId) {
      throw new BadRequestError(
        'appointmentId is required',
      );
    }

    const appointmentStatus =
      await prisma.appointment.findUnique({
        where: {
          id: appointmentId as any,
        },
      });

    if (!appointmentStatus) {
      throw new NotFoundError(
        'Appointment not found',
      );
    }

    const currentTime = new Date();

    const appointmentTime = new Date(
      appointmentStatus.appointmentStartTime,
    );

    const timeDifferenceInMilliseconds =
      appointmentTime.getTime() -
      currentTime.getTime();

    const diffInHours =
      timeDifferenceInMilliseconds /
      (1000 * 60 * 60);

    if (diffInHours < 4) {
      return false;
    }

    return true;
  } catch (error: any) {
    console.log(error);

    if (
      error instanceof BadRequestError ||
      error instanceof NotFoundError
    ) {
      throw error;
    }

    throw new InternalServerError(
      'Error while checking appointment time',
    );
  }
};

export const reschedule = async (data: RescheduleAppointmentDto,appointmentId: bigint) => {
  try {
    const rescheduledAppointment = await prisma.appointment.update({
      where: {
        id: appointmentId
      },
      data: {
        appointmentStartTime: data.newStartTime,
        appointmentEndTime: data.newEndTime,
        appointmentDate: data.newAppointmentDate,
        status: 'RESCHEDULED'
      }
    });
    return rescheduledAppointment
  } catch (error) {
    console.error(error);
    throw new DatabaseError('Error while rescheduling appointment');
  }
}

export const checkExistingAppointment = async (
  startTime: Date, 
  endTime: Date, 
  doctorId: bigint, 
  patientId?: bigint,
  excludeAppointmentId?: bigint
) => {
  try {
    const existingAppointment = await prisma.appointment.findFirst({
      where: {
        status: { not: 'CANCELLED' },
        ...(excludeAppointmentId ? { id: { not: BigInt(excludeAppointmentId) } } : {}),
        AND: [
          { appointmentStartTime: { lt: endTime } },
          { appointmentEndTime: { gt: startTime } },
        ],
        OR: [
          { doctorId: BigInt(doctorId) },
          ...(patientId ? [{ patientId: BigInt(patientId) }] : []),
        ],
      },
    });   
    return existingAppointment;
  } catch (error) {
    console.error(error);
    throw new DatabaseError('Error while finding existing appointment');
  }
}

export const create = async (data: ICreateAppointment,tx: any) => {
  try {
    const createdAppointment = await tx.appointment.create({
      data: {
        appointmentDate: data.appointmentDate,
        appointmentEndTime: data.appointmentEndTime,
        appointmentStartTime: data.appointmentStartTime,
        referenceNumber: data.referenceNumber,
        bookedBy: data.bookedBy,
        type: data.type,
        status: 'BOOKED',
        doctorId: data.doctorId,
        patientId: data.patientId,
        hospitalId: data.hospitalId
      }
    })
    return createdAppointment;
  } catch (error) {
    console.error(error);
    throw new DatabaseError('Error while creating appointment')
  }
}

export const findAppointmentById = async (appointmentId: bigint) => {
  try {
    const existingAppointment = await prisma.appointment.findUnique({
      where: {
        id: appointmentId,
      },
      include: {
        doctor: {
          include: {
            schedule: {
              select: {
                eveningEndTime: true,
                eveningStartTime: true,
                morningStartTime: true,
                morningEndTime: true,
                workingDays: true,
              }
            },
            leaves: {
              select: {
                leaveDate: true,
                leaveStartTime: true,
                leaveEndTime: true
              }
            }
          }
        }
      }
    });
    if(!existingAppointment) {
      throw new NotFoundError('Invalid appointment id');
    }
    if(existingAppointment.status == 'CANCELLED') {
      throw new BadRequestError('Cancelled Appointment Can not be rescheduled');
    }
    return existingAppointment;
  } catch (error) {
    if(error instanceof NotFoundError) {
      throw new NotFoundError(error.message)
    }
    if(error instanceof BadRequestError) {
      throw new BadRequestError(error.message)
    }
    console.error(error);
    throw new DatabaseError('Error while finding the appointment');
  }
}

export const findByReferenceNumber = async (referenceNumber: string) => {
  try {
    const appointment = await prisma.appointment.findUnique({
      where: {
        referenceNumber
      }
    });
    return appointment;
  } catch (error) {
    console.error(error);
    throw new DatabaseError('Error while checking refernce number')
  }
}

export const addGoogleEvent = async (eventId: string, appointmentId: bigint) => {
  try {
    const updatedAppointment = await prisma.appointment.update({
      where: {
        id: appointmentId
      },
      data: {
        googleCalendarEventId: eventId
      }
    })
    return updatedAppointment;
  } catch (error) {
    console.error(error);
  }
}