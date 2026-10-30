import { BadRequestError, InternalServerError } from '../../../common/handlers/error.handlers.js';
import type { IResponse } from '../../../common/handlers/response.handler.js'
import type { IInvoice } from '../interface/invoice.interface.js';
import * as invoiceService from '../service/invoice.service.js'
import * as doctorService from '../../doctor/service/doctor.service.js'
import * as taxService from '../../tax/service/tax.service.js'
import type { Request, Response } from 'express'
import { calculateTax } from '../../../common/helpers/taxCalculator.helper.js';
import type { ICreatePayment, ICreatePaymentDetails } from '../../payment/interface/payment.interface.js';
import * as paymentService from '../../payment/service/payment.service.js'

export const create = async (
    appointmentId: bigint,
    paidBy: string, 
    paymentData: ICreatePayment,
    paymentDetailsData: ICreatePaymentDetails | undefined,
    tx: any) => {
    try {
        if(!appointmentId ) {
            throw new BadRequestError('Appointment Id is required');
        }

        const doctor = await doctorService.findByAppointmentId(BigInt(Number(appointmentId)),tx);
        const hospitalCountry = doctor.hospital.address?.country;
        if(!hospitalCountry) {
            throw new InternalServerError('Hospital Address is invalid');
        }
        const tax = await taxService.findByCountry(hospitalCountry);
        const taxRate = tax.taxRate;

        const taxAmount = calculateTax(doctor.charges,Number(taxRate));
        const totalAmount = doctor.charges + taxAmount;
        const invoiceData: IInvoice = {
            appointmentId,
            consultationFees: doctor.charges,
            paidBy: paidBy ? paidBy: "SELF",
            taxCharges: taxAmount,
            taxRate: Number(taxRate),
            totalAmount: totalAmount,
        };

        const invoice = await invoiceService.create(invoiceData,tx);

        const payment = await paymentService.create(paymentData,invoice.id,tx);
        if(paymentDetailsData && paymentData.type != 'CASH') {
            await paymentService.createPaymentDetails(paymentDetailsData,payment.id,tx)
        }

       return invoice;
    } catch (error: any) {
        console.log(error);
        throw new InternalServerError(error.message)
    }
}

export const getById = async (req: Request, res: Response) => {
    let response: IResponse;
    try {
        const id = req.params.id;
        if(!id || Array.isArray(id)) {
            throw new BadRequestError('Invalid id');
        }
        const invoice = await invoiceService.findbyId(BigInt(Number(id)));
        response = {
            message: 'Invoice fetched successfully',
            status: 200,
            success: true,
            data: invoice
        }
        res.status(200).json(response);
    } catch (error: any) {
        console.log(error);
        response = {
            status: error.statusCode || 500,
            message: error.message || 'Internal Server Error',
            success: false,
            error,
        };
        res.status(response.status).json(response);
    }
}

export const getPatientInvocies = async (req: Request, res: Response) => {
    let response: IResponse;
    try {
        const id = req.params.id;
        if(!id || Array.isArray(id)) {
            throw new BadRequestError('Invalid id');
        }
        const invoice = await invoiceService.findByPatientId(BigInt(Number(id)));
        response = {
            message: 'Invoice fetched successfully',
            status: 200,
            success: true,
            data: invoice
        }
        res.status(200).json(response);
    } catch (error: any) {
        console.log(error);
        response = {
            status: error.statusCode || 500,
            message: error.message || 'Internal Server Error',
            success: false,
            error,
        };
        res.status(response.status).json(response);
    }
}

export const getAppointmentInvoice = async (req: Request, res: Response) => {
    let response: IResponse;
    try {
        const id = req.params.id;
        if(!id || Array.isArray(id)) {
            throw new BadRequestError('Invalid id');
        }
        const invoice = await invoiceService.findByAppointmentId(BigInt(Number(id)));
        response = {
            message: 'Invoice fetched successfully',
            status: 200,
            success: true,
            data: invoice
        }
        res.status(200).json(response);
    } catch (error: any) {
        console.log(error);
        response = {
            status: error.statusCode || 500,
            message: error.message || 'Internal Server Error',
            success: false,
            error,
        };
        res.status(response.status).json(response);
    }
}

export const getDoctorInvoices = async (req: Request, res: Response) => {
    let response: IResponse;
    try {
        const id = req.params.id;
        if(!id || Array.isArray(id)) {
            throw new BadRequestError('Invalid id');
        }
        const invoice = await invoiceService.findByDoctorId(BigInt(Number(id)));
        response = {
            message: 'Invoice fetched successfully',
            status: 200,
            success: true,
            data: invoice
        }
        res.status(200).json(response);
    } catch (error: any) {
        console.log(error);
        response = {
            status: error.statusCode || 500,
            message: error.message || 'Internal Server Error',
            success: false,
            error,
        };
        res.status(response.status).json(response);
    }
}

export const getHospitalInvoices = async (req: Request, res: Response) => {
    let response: IResponse;
    try {
        const id = req.params.id;
        if(!id || Array.isArray(id)) {
            throw new BadRequestError('Invalid id');
        }
        const invoice = await invoiceService.findByHospitalId(BigInt(Number(id)));
        response = {
            message: 'Invoice fetched successfully',
            status: 200,
            success: true,
            data: invoice
        }
        res.status(200).json(response);
    } catch (error: any) {
        console.log(error);
        response = {
            status: error.statusCode || 500,
            message: error.message || 'Internal Server Error',
            success: false,
            error,
        };
        res.status(response.status).json(response);
    }
}

export const getHospitalGroupInvoices = async (req: Request, res: Response) => {
    let response: IResponse;
    try {
        const id = req.params.id;
        if(!id || Array.isArray(id)) {
            throw new BadRequestError('Invalid id');
        }
        const invoice = await invoiceService.findByHospitalGroupId(BigInt(Number(id)));
        response = {
            message: 'Invoice fetched successfully',
            status: 200,
            success: true,
            data: invoice
        }
        res.status(200).json(response);
    } catch (error: any) {
        console.log(error);
        response = {
            status: error.statusCode || 500,
            message: error.message || 'Internal Server Error',
            success: false,
            error,
        };
        res.status(response.status).json(response);
    }
}