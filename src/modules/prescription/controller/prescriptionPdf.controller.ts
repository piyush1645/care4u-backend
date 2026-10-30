import type { Request, Response } from 'express';
import { NotFoundError } from '../../../common/handlers/error.handlers.js';
import { findByAppointmentId } from '../service/prescription.service.js';
import { streamPrescriptionPdf } from '../service/prescriptionPdf.service.js';

export const downloadPrescription = async (req: Request, res: Response) => {
  try {
    const appointmentId = Number(req.params.appointmentId);

    const prescriptions = await findByAppointmentId(appointmentId);

    if (!prescriptions || prescriptions.length === 0) {
      throw new NotFoundError('No prescription found for this appointment');
    }

    const prescription = prescriptions[0] as any;

    if (!prescription.appointment) {
      throw new NotFoundError('Appointment details not found for this prescription');
    }

    streamPrescriptionPdf(
      {
        invoiceLikeId: prescription.id,
        precautions:   prescription.precautions,
        createdAt:     prescription.createdAt,
        attachments:   prescription.attachment ?? [],
        appointment:   prescription.appointment
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