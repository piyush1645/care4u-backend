import {
  BadRequestError,
  DatabaseError,
  InternalServerError,
  NotFoundError,
  ResourceAlreadyExistError,
} from '../../../common/handlers/error.handlers.js';
import prisma from '../../../config/prisma.js';
import { Role } from '../../../databases/generated/client.js';
import type { IAdminData, IUpdateAdminProfile } from '../interface/admin.interface.js';
import { createCredential } from '../../auth/service/auth.service.js';
import type { ICreateCredential } from '../../auth/interface/auth.interface.js';

export const isAlreadyAdmin = async (email: string) => {
  try {
    if (!email) {
      throw new InternalServerError('Error while fetching user as email is not available');
    }
    const user = await prisma.userCredential.findUnique({
      where: {
        email,
        role: Role.ADMIN,
      },
    });
    if (user) {
      throw new ResourceAlreadyExistError('Already Admin with this email.');
    }
    return false;
  } catch (error) {
    if (error instanceof InternalServerError) {
      throw new InternalServerError(error.message);
    }
    if (error instanceof ResourceAlreadyExistError) {
      throw new ResourceAlreadyExistError(error.message);
    }
    throw new InternalServerError('Error while checking isAlreadyAdmin');
  }
};

export const getCounts = async (hospitalGroupId: bigint) => {
  try {
    if (!hospitalGroupId) {
      throw new InternalServerError(
        'Error while fetching count as hospital group Id is not present',
      );
    }

    const [doctorCount, availableDoctorCount, staffCount, appointmentsCount] = await Promise.all([
      await prisma.doctor.count({
        where: {
          hospital: {
            hospitalGroupId: hospitalGroupId,
          },
        },
      }),

      await prisma.doctor.count({
        where: {
          hospital: {
            hospitalGroupId: hospitalGroupId,
          },
          leaves: {
            none: {
              leaveDate: new Date(),
            },
          },
        },
      }),

      await prisma.staff.count({
        where: {
          hospital: {
            hospitalGroupId: hospitalGroupId,
          },
        },
      }),

      await prisma.appointment.count({
        where: {
          hospital: {
            hospitalGroupId: hospitalGroupId,
          },
          appointmentDate: new Date(),
        },
      }),
    ]);
    const allCounts = {
      doctorCount,
      availableDoctorCount,
      staffCount,
      appointmentsCount,
    };

    return allCounts;
  } catch (error) {
    console.log(error);
    throw new InternalServerError('Error while fetching counts for doctor dashboard');
  }
};

export const getAppointments = async (hospitalGroupId: bigint, searchString: string = '') => {
  try {
    if (!hospitalGroupId) {
      throw new InternalServerError(
        'Error while fetching appointments as hospital group Id is not present',
      );
    }

    let whereClause: any = {
      hospital: {
        hospitalGroupId: hospitalGroupId,
      },
    };

    if (searchString !== '') {
      whereClause.OR = [
        {
          patient: {
            firstName: {
              contains: searchString,
            },
          },
        },
        {
          patient: {
            lastName: {
              contains: searchString,
            },
          },
        },
        {
          doctor: {
            firstName: {
              contains: searchString,
            },
          },
        },
        {
          doctor: {
            lastName: {
              contains: searchString,
            },
          },
        },
      ];
    }

    const appointments = await prisma.appointment.findMany({
      where: whereClause,
      include: {
        patient: true,
        doctor: true,
      },
      orderBy: {
        appointmentDate: 'desc',
      },
    });

    return appointments;
  } catch (error) {
    console.log(error);
    throw new InternalServerError('Error while fetching appointments for admin dashboard');
  }
};

export const getAdminHospitalId = async (userId: bigint) => {
  try {
    const adminHospitalId = await prisma.admin.findUnique({
      where: {
        id: userId,
      },
      select: {
        hospitalGroupId: true,
      },
    });
    if (!adminHospitalId)
      throw new NotFoundError('Error in getAdminHospitalId : hosipital not found');
    return adminHospitalId;
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw new NotFoundError(error.message);
    }
    throw new InternalServerError('Error while fetching getAdminHospitalId');
  }
};

export const getStaffDetails = async (hospitalGroupId: bigint, searchString: string = '') => {
  try {
    if (searchString === '') {
      const staffData = await prisma.staff.findMany({
        where: {
          hospital: {
            hospitalGroupId: hospitalGroupId,
          },
        },
        include: {
          credential: true,
        },
      });

      return staffData;
    } else {
      const staffData = await prisma.staff.findMany({
        where: {
          hospital: {
            hospitalGroupId: hospitalGroupId,
          },
          OR: [
            {
              firstName: {
                contains: searchString,
              },
              lastName: {
                contains: searchString,
              },
            },
          ],
        },
        include: {
          credential: true,
        },
      });

      return staffData;
    }
  } catch (error) {
    if (error instanceof InternalServerError) {
      throw new InternalServerError(error.message);
    }
    if (error instanceof NotFoundError) {
      throw new ResourceAlreadyExistError(error.message);
    }
    throw new InternalServerError('Error while fetching staff details');
  }
};

export const getDoctorDetails = async (hospitalGroupId: bigint, searchString: string = '') => {
  try {
    if (searchString === '') {
      const doctorData = await prisma.doctor.findMany({
        where: {
          hospital: {
            hospitalGroupId: hospitalGroupId,
          },
        },
        include: {
          degree: true,
          leaves: true,
          schedule: true,
          speciality: true,
          review: true,
          credential: true,
        },
      });
      return doctorData;
    } else {
      const doctorData = await prisma.doctor.findMany({
        where: {
          hospital: {
            hospitalGroupId: hospitalGroupId,
          },
          OR: [
            {
              firstName: {
                contains: searchString,
              },
              lastName: {
                contains: searchString,
              },
              speciality: {
                some: {
                  name: {
                    contains: searchString,
                  },
                },
              },
            },
          ],
        },
        include: {
          degree: true,
          leaves: true,
          schedule: true,
          speciality: true,
          review: true,
          credential: true,
        },
      });
      return doctorData;
    }
  } catch (error) {
    if (error instanceof InternalServerError) {
      throw new InternalServerError(error.message);
    }
    if (error instanceof NotFoundError) {
      throw new ResourceAlreadyExistError(error.message);
    }
    throw new InternalServerError('Error while fetching Doctor Data');
  }
};

export const createAdmin = async (adminData: IAdminData) => {
  try {
    if (!adminData) throw new NotFoundError('Error in create admin ( Admin Data not found )');
    const data: ICreateCredential = {
      email: adminData.email,
      mobile: `${adminData.mobile}`,
      hashedPassword: adminData.hashedPassword,
      role: 'ADMIN',
    };
    const existingEmail = await prisma.userCredential.findFirst({
      where: { email: adminData.email },
    });
    if (existingEmail) {
      throw new BadRequestError('Email already in use');
    }

    const existingMobile = await prisma.userCredential.findFirst({
      where: { mobile: `${adminData.mobile}` },
    });
    if (existingMobile) {
      throw new BadRequestError('Mobile number already in use');
    }

    const newAdmin = prisma.$transaction(async (tx) => {
      const adminUserCredentails = await createCredential(tx, data);
      console.log(typeof adminUserCredentails.id);
      console.log(adminUserCredentails);

      const admin = await tx.admin.create({
        data: {
          firstName: adminData.firstName,
          lastName: adminData.lastName,
          hospitalGroupId: adminData.hospitalGroupId,
          credentialId: adminUserCredentails.id,
        },
      });

      return {
        adminUserCredentails,
        admin,
      };
    });

    return newAdmin;
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw new NotFoundError(error.message);
    }
    if (error instanceof BadRequestError) {
      throw new BadRequestError(error.message);
    }
    throw new InternalServerError('Error in Creating Admin');
  }
};

export const getAdminDetails = async (adminId: bigint) => {
  try {
    if (!adminId) throw new NotFoundError('Error in getting adminId in getAdminDetails');

    const adminData = await prisma.admin.findFirst({
      where: {
        id: adminId,
      },
      include: {
        credential: true,
        hospitalGroup: true,
      },
    });

    return adminData;
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw new ResourceAlreadyExistError(error.message);
    }
    throw new InternalServerError('Error while fetching Admin Deatils');
  }
};

export const updateAdminProfile = async (adminId: bigint, adminData: IUpdateAdminProfile) => {
  try {
    const updateAdminProfile = await prisma.admin.update({
      where: {
        id: adminId,
      },
      data: {
        firstName: adminData.firstName,
        lastName: adminData.lastName,
      },
    });
    return updateAdminProfile;
  } catch (error) {
    throw new InternalServerError('Error while fetching Update Admin');
  }
};

export const getAdminId = async (credentialId: bigint) => {
  try {
    if (!credentialId) throw new NotFoundError('Error in getadminId : Credentail Id not found.');
    const adminId = await prisma.admin.findUnique({
      where: {
        credentialId,
      },
      select: {
        id: true,
      },
    });
    if(!adminId) {
      throw new NotFoundError('Admin with this credential id not found');
    }
    return adminId.id;
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw new NotFoundError(error.message);
    }
    throw new DatabaseError('Error while finding admin id')
  }
};

