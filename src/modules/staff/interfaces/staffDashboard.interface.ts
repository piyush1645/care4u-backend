export interface RegisterPatientByStaffDto {
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  mobile: string;
  password: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  dateOfBirth: string;
  bloodGroup:
    | 'A_POSITIVE'
    | 'A_NEGATIVE'
    | 'B_POSITIVE'
    | 'B_NEGATIVE'
    | 'O_POSITIVE'
    | 'O_NEGATIVE'
    | 'AB_POSITIVE'
    | 'AB_NEGATIVE';
}

export interface BookAppointmentByStaffDto {
  doctorId: string;
  patientId: string;
  appointmentTime: string; // ISO datetime string

  // ── Billing ────────────────────────────────────────────────
  consultationFees: number;
  taxCharges: number;
  totalAmount: number;
  taxRate: number;
  paidBy: string; // e.g. "self", patient name, insurance company

  // ── Payment ────────────────────────────────────────────────
  paymentType: 'CARD' | 'UPI' | 'NET_BANKING' | 'CASH' | 'ADVANCE';
  paymentStatus: 'SUCCESS' | 'FAILED' | 'PENDING';
  collectedBy?: string;

  // ── Payment details (conditional on paymentType) ───────────
  transactionId?: string; // CARD / UPI / NET_BANKING
  cardNumber?: string;    // CARD only
  upiId?: string;         // UPI only

}

export interface GetAvailableSlotsDto {
  doctorId: string;
  date: string; // YYYY-MM-DD
}

export interface GetHospitalAppointmentsDto {
  date?: string;     // YYYY-MM-DD
  doctorId?: string;
  status?: string;   // BOOKED | CANCELLED | ON_GOING | NO_SHOW
}
