import type { IPayment } from "../../payment/interface/payment.interface.js";

export type RescheduleAppointmentDto = {
  newAppointmentDate: Date;
  newStartTime: Date;
  newEndTime: Date;
};

export interface ICreateAppointment {
  doctorId: bigint;
  patientId: bigint;
  hospitalId: bigint;
  appointmentDate: Date;
  appointmentStartTime: Date;
  appointmentEndTime: Date;
  referenceNumber: string;
  type: 'IN_PERSON' | 'ONLINE'
  status: string;
  bookedBy: 'SELF' | 'STAFF';
  payment?: IPayment
}