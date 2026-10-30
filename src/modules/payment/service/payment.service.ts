import { DatabaseError } from "../../../common/handlers/error.handlers.js";
import prisma from "../../../config/prisma.js"
import type { ICreatePayment, ICreatePaymentDetails } from "../interface/payment.interface.js"

export const create = async (data: ICreatePayment,invoiceId: bigint,tx: any) => {
    try {
        const payment = await tx.payment.create({
            data: {
                amount: data.amount,
                status: data.status,
                type: data.type,
                invoiceId
            }
        });
        return payment
    } catch (error) {
        console.error(error);
        throw new DatabaseError('Error while creating payment');
    }
}

export const findByInvoiceId = async (invoiceId: bigint) => {
    try {
        const payment = await prisma.payment.findMany({
            where: {
                invoiceId
            },
            include: {
                paymentDetails: {
                    select: {
                        cardNumber: true,
                        transcationId: true,
                        upiId: true
                    }
                }
            }
        });
        return payment;
    } catch (error) {
        console.error(error);
        throw new DatabaseError('Error while fetching payments');
    }
}

export const findByPatientId = async (patientId: bigint) => {
    try {
        const payments = await prisma.payment.findMany({
            where: {
                invoice: {
                    appointment: {
                        patientId
                    }
                }
            },
            include: {
                paymentDetails: {
                    select: {
                        cardNumber: true,
                        transcationId: true,
                        upiId: true
                    }
                }
            }
        });
        return payments;
    } catch (error) {
        console.error(error);
        throw new DatabaseError('Error while fetching payments');
    }
}

export const createPaymentDetails = async (data: ICreatePaymentDetails, paymentId: bigint,tx: any) => {
    try {
        const paymentDetails = await tx.paymentDetails.create({
            data: {
                cardNumber: data.cardNumber || null,
                paymentId,
                transcationId: data.transactionId || null,
                upiId: data.upiId || null
            }
        })
        return paymentDetails;
    } catch (error) {
        console.error(error);
        throw new DatabaseError('Error while adding payment details');
    }
}