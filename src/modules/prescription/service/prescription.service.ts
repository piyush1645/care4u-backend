import { DatabaseError, NotFoundError } from "../../../common/handlers/error.handlers.js";
import prisma from "../../../config/prisma.js";
import type { IPrescription } from "../interface/prescription.interface.js";

export const create = async (data: IPrescription,tx: any) => {
    try {
        const newPresciption = await tx.prescription.create({
            data
        });
        return newPresciption;
    } catch (error) {
        console.error(error);
        throw new DatabaseError('Error while inserting prescription');
    }
}

export const findById = async (id: number) => {
    try {
        const prescription = await prisma.prescription.findUnique({
            where: {
                id
            },
            include: {
                attachment: {
                    select: {
                        id: true,
                        url: true,
                        type: true,
                        secretKey: true,
                        createdAt: true,
                        updatedAt: true
                    }
                }
            }
        });
        return prescription;
    } catch (error) {
        console.error(error);
        throw new DatabaseError('Error while finding prescription');
    }
}

export const findByAppointmentId = async (id: number) => {
    try {
        const prescription = await prisma.prescription.findMany({
            where: {
                appointmentId: id
            },
            include: {
                attachment: {
                    select: {
                        id: true,
                        url: true,
                        type: true,
                        secretKey: true,
                        createdAt: true,
                        updatedAt: true
                    }
                },
                appointment: {
                    select: {
                        appointmentDate: true,
                        appointmentStartTime: true,
                        doctor: {
                            select: {
                                firstName: true,
                                middleName: true,
                                lastName: true
                            }
                        },
                        patient: {
                            select: {
                                firstName: true,
                                middleName: true,
                                lastName: true
                            }
                        },
                        hospital: {
                            select: {
                                branchName: true,
                                address: {
                                    select: {
                                        addressLine1: true,
                                        addressLine2: true,
                                        city: true,
                                        state: true,
                                        country: true,
                                        pincode: true
                                    }
                                },
                                hospitalGroup: {
                                    select: {
                                        name: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });
        return prescription;
    } catch (error) {
        console.error(error);
        throw new DatabaseError('Error while finding prescription');
    }
}

export const update = async (data: IPrescription,id: number) => {
    try {
        const updatedPrescription = await prisma.prescription.update({
            where: {
                id
            },
            data
        });
        return updatedPrescription;
    } catch (error) {
        console.error(error);
        throw new DatabaseError('Error while updating prescription');
    }
}

export const findByPatientId = async (patientId: bigint) => {
    try {
        const prescription = await prisma.prescription.findMany({
            where: {
                appointment: {
                    patientId: patientId
                }
            },
            include: {
                attachment: {
                    select: {
                        createdAt: true,
                        id: true,
                        secretKey: true,
                        type: true,
                        updatedAt: true,
                        url: true
                    }                   
                }
            }
        });
        return prescription;
    } catch (error) {
        console.error(error);
        throw new DatabaseError('Error while finding prescriptions');
    }
}

export const findByDoctorId = async (doctorId: bigint) => {
    try {
        const prescription = await prisma.prescription.findMany({
            where: {
                appointment: {
                    doctorId: doctorId
                }
            },
            include: {
                attachment: true,
                appointment: {
                    include: {
                        patient: {
                            select: {
                                firstName: true,
                                id: true,
                                lastName: true,
                                profilePhoto: true
                            }
                        }
                    }
                }
            }
        });
        return prescription;
    } catch (error) {
        console.error(error);
        throw new DatabaseError('Error while finding prescriptions');
    }
}

export const findByPatientIdDoctorId = async (patientId: bigint, doctorId: bigint) => {
    try {
        const prescription = await prisma.prescription.findMany({
            where: {
                appointment: {
                    patientId: patientId,
                    doctorId: doctorId
                }
            },
            include: {
                attachment: {
                    select: {
                        createdAt: true,
                        id: true,
                        secretKey: true,
                        type: true,
                        updatedAt: true,
                        url: true
                    }                   
                },
                appointment: {
                    include: {
                        doctor: {
                            select: {
                                firstName: true,
                                id: true,
                                lastName: true,
                                profilePhoto: true
                            }
                        }
                    }
                }
            }
        });
        return prescription;
    } catch (error) {
        console.error(error);
        throw new DatabaseError('Error while finding prescriptions');
    }
}

export const remove = async (id: bigint) => {
    try {
        const deletedPrescription = await prisma.prescription.delete({
            where: {
                id
            }
        });
        if(!deletedPrescription) {
            throw new NotFoundError('Prescription with given id not found');
        }
        return deletedPrescription
    } catch (error) {
        console.error(error);
        throw new DatabaseError('Error while deleting data');
    }
}