import type { Request, Response } from 'express';
import { findByAppointmentId } from '../service/invoice.service.js';
import { streamInvoicePdf } from '../service/invoicePdf.service.js';

export const downloadInvoice = async (req: Request, res: Response) => {
  try {
    const appointmentId = BigInt(Number(req.params.appointmentId));

    console.log('appointment download called!!');
    
    const invoice = await findByAppointmentId(appointmentId) as any;

    streamInvoicePdf(
      {
        id:               invoice.id,
        consultationFees: Number(invoice.consultationFees),
        taxCharges:       Number(invoice.taxCharges),
        taxRate:          Number(invoice.taxRate),
        totalAmount:      Number(invoice.totalAmount),
        paidBy:           invoice.paidBy,
        createdAt:        invoice.createdAt,
        appointment:      invoice.appointment
      },
      res
    );

  } catch (error: any) {
    console.error(error);
    const status = error.statusCode || 500;
    res.status(status).json({
      status,
      message: error.message || 'Internal Server Error',
      success: false
    });
  }
};