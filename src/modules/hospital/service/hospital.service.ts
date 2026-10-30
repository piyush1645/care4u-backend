import { DatabaseError, NotFoundError } from "../../../common/handlers/error.handlers.js";
import prisma from "../../../config/prisma.js";
import type { IHospital } from "../interface/hospital.interface.js";

export const register = async (data: IHospital,tx: any) => {
    try {
        const newHospital = await tx.hospital.create({
            data: {
                branchName: data.name,
                photo: data.photo,
                hospitalGroupId: data.hospitalGroupId
            }
        });
        return newHospital;
    } catch (error) {
        console.error(error);
        throw new DatabaseError('Error while registering hospital');
    }
}

export const findById = async (id: bigint) => {
    try {
        const exisitingHospital = await prisma.hospital.findUnique({
            where: {
                id,
                isActive: true
            },
            include: {
                review: true,
                address: {
                    select: {
                        addressLine1: true,
                        addressLine2: true,
                        city: true,
                        country: true,
                        pincode: true,
                        state: true
                    }
                },
                doctor: {
                    include: {
                        speciality: true,
                    }
                },
            }
        });
        if(!exisitingHospital) {
            throw new NotFoundError('Hospital with given id not found');
        }
        return exisitingHospital;
    } catch (error) {
        if(error instanceof NotFoundError) {
            throw new NotFoundError(error.message)
        }
        console.error(error);
        throw new DatabaseError('Error while finding the hospital');
    }
}

export const findByName = async (name: string) => {
    try {
        const exisitingHospital = await prisma.hospital.findMany({
            where: {
                branchName: {
                    contains: name,
                },
                isActive: true
            },
            include: {
                address: {
                    select: {
                        addressLine1: true,
                        addressLine2: true,
                        city: true,
                        country: true,
                        pincode: true,
                        state: true
                    }
                }
            }
        });
        return exisitingHospital;
    } catch (error) {
        console.error(error);
        throw new DatabaseError('Error while fetching hospitals')
    }
}

export const update = async (id: number,data: IHospital,tx: any) => {
    try {
        const updatedHospital = await tx.hospital.update({
            where: {
                id
            }, 
            data
        });
        return updatedHospital;
    } catch (error) {
        console.error(error);
        throw new DatabaseError('Error while updating hospital')
    }
}

export const deactivate = async (id: number) => {
    try {
        const deactivatedHospital = await prisma.hospital.update({
            where: {
                id
            },
            data: {
                isActive: false
            }
        });
        return deactivatedHospital
    } catch (error) {
        console.error(error);
        throw new DatabaseError('Error while deactivating hospital');
    }
}

export const findAll = async () => {
    try {
        const hospitalList = await prisma.hospital.findMany({
            where: {
                isActive: true
            },
            include: {
                address: {
                    select: {
                        addressLine1: true,
                        addressLine2: true,
                        city: true,
                        country: true,
                        pincode: true,
                        state: true
                    }
                }
            }
        });
        return hospitalList;
    } catch (error) {
        console.error(error);
        throw new DatabaseError('Error while deactivating hospital');
    }
}

export const findByGroupId = async (id: number) => {
    try {
        const hospitalList = await prisma.hospital.findMany({
            where: {
                hospitalGroupId: id,
                isActive: true
            },
            include: {
                address: true,
                doctor: {
                    include: {
                        speciality: { select: { name: true } },
                        credential: { select: { email: true, mobile: true, isActive: true } },
                    }
                },
                staff: {
                    include: {
                        credential: { select: { email: true, mobile: true, isActive: true } },
                    }
                },
            }
        });
        return hospitalList;
    } catch (error) {
        console.error(error);
        throw new DatabaseError('Error while finding hospitals by group id');
    }
}

export const getHospitalDetailById = async (hospitalId: bigint) => {
    try {
        const hospital = await prisma.hospital.findUnique({
            where: { id: hospitalId, isActive: true },
            include: {
                address: true,
                doctor: {
                    include: {
                        speciality: { select: { name: true } },
                        credential: { select: { email: true, mobile: true, isActive: true, role: true } },
                        leaves: { where: { leaveDate: { gte: new Date() } }, take: 5, orderBy: { leaveDate: 'asc' } },
                    },
                },
                staff: {
                    include: {
                        credential: { select: { email: true, mobile: true, isActive: true } },
                    },
                },
                review: true,
            },
        });
        if (!hospital) throw new NotFoundError('Hospital not found');

        // Count appointments by status
        const appointmentStats = await prisma.appointment.groupBy({
            by: ['status'],
            where: { hospitalId: hospitalId },
            _count: { id: true },
        });

        // Today's appointments
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const todayAppointments = await prisma.appointment.findMany({
            where: {
                hospitalId: hospitalId,
                appointmentDate: { gte: today, lt: tomorrow },
                status: { not: 'CANCELLED' },
            },
            include: {
                doctor: { select: { firstName: true, lastName: true } },
                patient: { select: { firstName: true, lastName: true } },
            },
            orderBy: { appointmentStartTime: 'asc' },
            take: 10,
        });

        return { hospital, appointmentStats, todayAppointments };
    } catch (error) {
        if (error instanceof NotFoundError) throw error;
        console.error(error);
        throw new DatabaseError('Error while fetching hospital detail');
    }
}

export const activate = async (id: bigint) => {
    try {
        const activate = await prisma.hospital.update({
            where: {
                id
            },
            data: {
                isActive: true
            }
        });
        if(!activate) {
            throw new NotFoundError('Hospital with this id not found');
        }
        return activate;
    } catch (error) {
        if(error instanceof NotFoundError) {
            throw new NotFoundError(error.message)
        }
        console.error(error);
        throw new DatabaseError('Error while activating database');
    }
}