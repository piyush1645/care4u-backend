import prisma from '../../../config/prisma.js';
import { mapAppointmentStatus } from '../../appointment/service/appointment.service.js';
import {
  BadRequestError,
  DatabaseError,
  InternalServerError,
  NotFoundError,
} from '../../../common/handlers/error.handlers.js';
import type {
  IDoctorDegreeDto,
  IDoctorSpecialityDto,
  IRegisterDoctorDto,
} from '../interface/doctor.interface.js';
import * as argon2 from 'argon2';
import { createCredential } from '../../auth/service/auth.service.js';

export const updateDoctor = async (doctorId: number, newDoctorValue: any) => {
  try {
    return await prisma.$transaction(async (tx) => {
      //update a doctor
      const doctor = await tx.doctor.update({
        where: { id: doctorId },
        data: {
          firstName: newDoctorValue.firstName,
          middleName: newDoctorValue.middleName ?? null,
          lastName: newDoctorValue.lastName,
          gender: newDoctorValue.gender,
          dateOfBirth: new Date(newDoctorValue.dateOfBirth),
          preferedLanguages: newDoctorValue.preferedLanguages,
          expereince: newDoctorValue.expereince ?? 0,
          charges: newDoctorValue.charges,
          slotDuration: newDoctorValue.slotDuration ?? 15,
        },
        include: { credential: true },
      });
      await tx.degree.deleteMany({
        where: { doctorId: doctor.id },
      });
      const new_doctor_degrees = await tx.degree.createMany({
        data: newDoctorValue.degrees.map((degree: IDoctorDegreeDto[]) => ({
          ...degree,
          doctorId: doctor.id,
        })),
      });

      // Same fix for specialities
      await tx.speciality.deleteMany({
        where: { doctorId: doctor.id },
      });

      const new_specialities = await tx.speciality.createMany({
        data: newDoctorValue.specialities.map((speciality: IDoctorSpecialityDto) => ({
          name: speciality.name,
          doctorId: doctor.id,
        })),
      });
      return { doctor, new_doctor_degrees, new_specialities };
    });
  } catch (error) {
    if (error instanceof InternalServerError) {
      throw new InternalServerError(error.message);
    }
    if (error instanceof NotFoundError) {
      throw new NotFoundError(error.message);
    }
    throw new InternalServerError('Error while fetching Doctor');
  }
};

export const getDoctorById = async (doctorId: number) => {
  try {
    if (!doctorId) {
      throw new InternalServerError('Doctor Id is require');
    }
    const doctor = await prisma.doctor.findUnique({
      where: {
        id: doctorId,
      },
      include: {
        credential: true,
        speciality: true,
        degree: true,
        hospital: {
          include: {
            address: true,
            hospitalGroup: true,
          }
        },
      },
    });
    return doctor ?? null;
  } catch (error) {
    if (error instanceof InternalServerError) {
      throw new InternalServerError(error.message);
    }
    if (error instanceof NotFoundError) {
      throw new NotFoundError(error.message);
    }
    throw new InternalServerError('Error while fetching Doctor');
  }
};

export const getDoctorId = async (credentialId: bigint) => {
  try {
    if (!credentialId) {
      throw new InternalServerError('Credential Id is require');
    }
    const doctor = await prisma.doctor.findUnique({
      where: {
        credentialId,
      },
    });
    if (!doctor || !doctor.id) {
      throw new NotFoundError('Doctor with this credential not found');
    }
    return doctor.id;
  } catch (error) {
    if (error instanceof InternalServerError) {
      throw new InternalServerError(error.message);
    }
    if (error instanceof NotFoundError) {
      throw new NotFoundError(error.message);
    }
    throw new InternalServerError('Error while fetching Doctor');
  }
};

export const getAllAppointment = async (doctorId: number) => {
  try {
    if (!doctorId) {
      throw new BadRequestError('Doctor id is required!');
    }
    const appointments = await prisma.appointment.findMany({
      where: {
        doctorId,
      },
      include: {
        patient: {
          include: {
            credential: {
              select: {
                email: true,
                mobile: true,
              },
            },
          },
        },
        hospital: {
          select: {
            id: true,
            branchName: true,
          },
        },
        prescription: true,
        billing: true,
        meeting: true,
      },
      orderBy: {
        appointmentDate: 'desc',
      },
    });

    return (appointments ?? []).map(mapAppointmentStatus);
  } catch (error) {
    console.error("Error in getAllAppointment Prisma query:", error);
    if (error instanceof InternalServerError) {
      throw new InternalServerError(error.message);
    }
    if (error instanceof NotFoundError) {
      throw new NotFoundError(error.message);
    }
    throw new InternalServerError('Error while fetching Doctor');
  }
};

export const getUpComingLeaves = async (doctorId: number) => {
  try {
    if (!doctorId) {
      throw new BadRequestError('Doctor id is required!');
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const leave = await prisma.leaves.findMany({
      where: {
        doctorId,
        leaveDate: {
          gte: today, // greater than or equal to today
        },
      },
      orderBy: {
        leaveDate: 'asc',
      },
    });
    return leave ?? null;
  } catch (error) {
    if (error instanceof InternalServerError) {
      throw new InternalServerError(error.message);
    }
    if (error instanceof NotFoundError) {
      throw new NotFoundError(error.message);
    }
    throw new InternalServerError('Error while fetching Doctor');
  }
};

export const createDoctor = async (doctorData: IRegisterDoctorDto) => {
  try {
    const hashedPassword = await argon2.hash(doctorData.password);
    return prisma.$transaction(async (tx) => {
      // 1. Insert into credential table
      const credential = await createCredential(tx, {
        email: doctorData.email,
        mobile: doctorData.mobile,
        hashedPassword,
        role: 'DOCTOR',
      });
      // 2. Insert into doctor table and use credential table
      const doctor = await tx.doctor.create({
        data: {
          firstName: doctorData.firstName,
          middleName: doctorData.middleName ?? null,
          lastName: doctorData.lastName,
          profilePhoto: doctorData.profilePhoto ?? null,

          gender: doctorData.gender,
          dateOfBirth: new Date(doctorData.dateOfBirth),

          preferedLanguages: doctorData.preferedLanguages,
          expereince: doctorData.expereince ?? 0,

          charges: doctorData.charges,
          slotDuration: doctorData.slotDuration ?? 15,

          credentialId: credential.id,
          hospitalId: doctorData.hospitalId,
        },
        include: {
          credential: true,
        },
      });

      // 3. Insert into doctor_degrees with docotr_specialities
      const doctor_degrees = await tx.degree.createMany({
        data: doctorData.degrees.map((degree) => ({
          ...degree,
          doctorId: doctor.id,
        })),
      });

      const doctor_specialities = await tx.speciality.createMany({
        data: doctorData.specialities.map((speciality) => ({
          ...speciality,
          doctorId: doctor.id,
        })),
      });

      return { doctor, doctor_degrees, doctor_specialities };
    });
  } catch (error: any) {
    if (error instanceof InternalServerError) {
      throw new InternalServerError(error.message);
    }
    if (error instanceof NotFoundError) {
      throw new NotFoundError(error.message);
    }
    console.log(error);
    throw new InternalServerError('Error while fetching Doctor');
  }
};

export const getSchedule = async (doctorId: bigint) => {
  try {
    const schedule = await prisma.schedule.findMany({
      where: {
        doctorId,
      },
      include: {
        doctor: true,
      },
    });
    return schedule;
  } catch (error: any) {
    if (error instanceof InternalServerError) {
      throw new InternalServerError(error.message);
    }
    if (error instanceof NotFoundError) {
      throw new NotFoundError(error.message);
    }
    console.log(error);
    throw new InternalServerError('Error while fetching Doctor');
  }
};

export const updateSchedule = async (doctorId: number, newTime: any) => {
  try {
    const schedule = await prisma.schedule.updateMany({
      where: {
        doctorId,
      },
      data: {
        morningStartTime: newTime.morningStartTime ? new Date(newTime.morningStartTime) : null,
        morningEndTime: newTime.morningEndTime ? new Date(newTime.morningEndTime) : null,
        eveningStartTime: newTime.eveningStartTime ? new Date(newTime.eveningStartTime) : null,
        eveningEndTime: newTime.eveningEndTime ? new Date(newTime.eveningEndTime) : null,
        workingDays: newTime.workingDays,
      },
    });
    return schedule;
  } catch (error: any) {
    if (error instanceof InternalServerError) {
      throw new InternalServerError(error.message);
    }
    if (error instanceof NotFoundError) {
      throw new NotFoundError(error.message);
    }
    console.log(error);
    throw new InternalServerError('Error while fetching Doctor');
  }
};

export const takeLeaves = async (doctorId: number, newTime: any) => {
  try {
    const leaves = await prisma.leaves.create({
      data: {
        doctorId,
        leaveDate: newTime.leaveDate,
        leaveStartTime: newTime.leaveStartTime || null,
        leaveEndTime: newTime.leaveEndTime || null,
      },
    });
    return leaves;
  } catch (error: any) {
    if (error instanceof InternalServerError) {
      throw new InternalServerError(error.message);
    }
    if (error instanceof NotFoundError) {
      throw new NotFoundError(error.message);
    }
    console.log(error);
    throw new InternalServerError('Error while fetching Doctor');
  }
};



export const checkDoctorAvailability = async (doctorId: bigint) => {
  try {
    const schedule = await prisma.doctor.findUnique({
      where: {
        id: doctorId
      },
      include: {
        schedule: {
          select: {
            workingDays: true,
            morningEndTime: true,
            morningStartTime: true,
            eveningStartTime: true,
            eveningEndTime: true
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
    });
    if(!schedule) {
      throw new NotFoundError('Doctor with this id not found');
    }
    return schedule;
  } catch (error) {
    console.error(error);
    throw new DatabaseError('Error while fetching schedule')
  }
} 

export const updateProfilePhoto = async (url: string, id: bigint) => {
  try {
    const updatedDoctor = await prisma.doctor.update({
      where: {
        id
      },
      data: {
        profilePhoto: url
      }
    });
    if(!updatedDoctor) {
      throw new NotFoundError('Doctor with this id not found');
    }
    return updatedDoctor;
  } catch (error) {
    if(error instanceof NotFoundError) {
      throw new NotFoundError(error.message)
    }
    console.error(error);
    throw new DatabaseError('Error while updating profile photo')
  }
}

export const findByAppointmentId = async (appointmentId: bigint,tx: any) => {
  try {
    const doctorCharges = await tx.doctor.findFirst({
      where: {
        appointment: {
          some: {
            id: appointmentId
          }       
        }
      },
      include: {
        hospital: {
          include: {
            address: true
          }
        }
      }
    });
    if(!doctorCharges) {
      throw new NotFoundError('Invalid Appointment Id');
    }
    return doctorCharges;
  } catch (error) {
    console.error(error);
    throw new DatabaseError('Error while fetching doctor charges')
  }
}