import { DatabaseError, NotFoundError } from "../../../common/handlers/error.handlers.js";
import prisma from "../../../config/prisma.js"
import type { IInvoice } from "../interface/invoice.interface.js"

export const create = async (data: IInvoice,tx: any) => {
    try {
        const invoice = await tx.invoice.create({
            data: {
                taxCharges: data.taxCharges,
                taxRate: data.taxRate,
                totalAmount: data.totalAmount,
                consultationFees: data.consultationFees,
                appointmentId: data.appointmentId,
                paidBy: data.paidBy,                
            }
        });
        if(!invoice || !invoice.id) {
            throw new DatabaseError('Error while creating invoice');
        }
        return invoice;
    } catch (error: any) {
        console.error(error);
        throw new DatabaseError(error.message);
    }
}

export const findbyId = async (id: bigint) => {
    try {
        const invoice = await prisma.invoice.findUnique({
            where: {
                id
            },
            include: {
                appointment: {
                    include: {
                        doctor: {
                            select: {
                                firstName: true,
                                lastName: true,
                                middleName: true
                            }
                        },
                        patient: {
                            select: {
                                firstName: true,
                                lastName: true,
                                middleName: true
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
                                        country: true,
                                        state: true,
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
        if(!invoice) {
            throw new NotFoundError('Invalid Invoice ID');
        }
        return invoice
    } catch (error) {
        console.error(error);
        throw new DatabaseError('Error while finding invoice');
    }
}

export const findByAppointmentId = async (appointmentId: bigint) => {
    try {
        const invoice = await prisma.invoice.findUnique({
            where: {
                appointmentId
            },
            include: {
                appointment: {
                    include: {
                        doctor: {
                            select: {
                                firstName: true,
                                lastName: true,
                                middleName: true
                            }
                        },
                        patient: {
                            select: {
                                firstName: true,
                                lastName: true,
                                middleName: true
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
                                        country: true,
                                        state: true,
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
        if(!invoice) {
            throw new NotFoundError('Invalid Invoice ID');
        }
        return invoice
    } catch (error) {
        console.error(error);
        throw new DatabaseError('Error while finding invoice');
    }
}

export const findByPatientId = async (patientId: bigint) => {
    try {
        const invoiceList = await prisma.invoice.findMany({
            where: {
                appointment: {
                    patientId: patientId
                }
            },
            include: {
                appointment: {
                    include: {
                        doctor: {
                            select: {
                                firstName: true,
                                lastName: true,
                                middleName: true
                            }
                        },
                        patient: {
                            select: {
                                firstName: true,
                                lastName: true,
                                middleName: true
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
                                        country: true,
                                        state: true,
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
        return invoiceList;
    } catch (error) {
        console.error(error);
        throw new DatabaseError('Error while finding invoice');
    }
}

export const findByDoctorId = async (doctorId: bigint) => {
    try {
        const invoiceList = await prisma.invoice.findMany({
            where: {
                appointment: {
                    doctorId: doctorId
                }
            },
            include: {
                appointment: {
                    include: {
                        doctor: {
                            select: {
                                firstName: true,
                                lastName: true,
                                middleName: true
                            }
                        },
                        patient: {
                            select: {
                                firstName: true,
                                lastName: true,
                                middleName: true
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
                                        country: true,
                                        state: true,
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
        return invoiceList;
    } catch (error) {
        console.error(error);
        throw new DatabaseError('Error while finding invoice');
    }
}

export const findByHospitalId = async (hospitalId: bigint) => {
    try {
        const invoiceList = await prisma.invoice.findMany({
            where: {
                appointment: {
                   hospitalId
                }
            },
            include: {
                appointment: {
                    include: {
                        doctor: {
                            select: {
                                firstName: true,
                                lastName: true,
                                middleName: true
                            }
                        },
                        patient: {
                            select: {
                                firstName: true,
                                lastName: true,
                                middleName: true
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
                                        country: true,
                                        state: true,
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
        return invoiceList;
    } catch (error) {
        console.error(error);
        throw new DatabaseError('Error while finding invoice');
    }
}

export const findByHospitalGroupId = async (hospitalGroupId: bigint) => {
    try {
        const invoiceList = await prisma.invoice.findMany({
            where: {
                appointment: {
                   hospital: {
                    hospitalGroupId
                   }
                }
            },
            include: {
                appointment: {
                    include: {
                        doctor: {
                            select: {
                                firstName: true,
                                lastName: true,
                                middleName: true
                            }
                        },
                        patient: {
                            select: {
                                firstName: true,
                                lastName: true,
                                middleName: true
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
                                        country: true,
                                        state: true,
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
        return invoiceList;
    } catch (error) {
        console.error(error);
        throw new DatabaseError('Error while finding invoice');
    }
}