import PDFDocument from 'pdfkit';
import type { Response } from 'express';

interface InvoicePdfData {
  id: bigint;
  consultationFees: number;
  taxCharges: number;
  taxRate: number;
  totalAmount: number;
  paidBy: string;
  createdAt: Date;
  appointment: {
    appointmentDate: Date;
    appointmentStartTime: Date;
    doctor: {
      firstName: string;
      middleName: string | null;
      lastName: string;
    };
    patient: {
      firstName: string;
      middleName: string | null;
      lastName: string;
    };
    hospital: {
      branchName: string;
      address: {
        addressLine1: string;
        addressLine2: string | null;
        city: string;
        state: string;
        country: string;
        pincode: string;
      } | null;
      hospitalGroup: {
        name: string;
      };
    };
  };
}

const fullName = (first: string, middle: string | null, last: string) =>
  [first, middle, last].filter(Boolean).join(' ');

const formatDate = (d: Date) =>
  new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

const formatTime = (d: Date) =>
  new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

const formatCurrency = (amount: number) => `Rs. ${amount.toFixed(2)}`;
  
export const streamInvoicePdf = (data: InvoicePdfData, res: Response) => {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="invoice-${data.id}.pdf"`
  );

  doc.pipe(res);

  const { appointment } = data;
  const { hospital, doctor, patient } = appointment;

  // HOSPITAL LETTERHEAD 
  doc
    .fontSize(18)
    .fillColor('#1a3c6e')
    .font('Helvetica-Bold')
    .text(hospital.hospitalGroup.name, { align: 'center' });

  doc
    .fontSize(12)
    .fillColor('#444444')
    .font('Helvetica')
    .text(hospital.branchName, { align: 'center' });

  if (hospital.address) {
    const addr = hospital.address;
    const addressLine = [
      addr.addressLine1,
      addr.addressLine2,
      addr.city,
      addr.state,
      addr.pincode,
      addr.country
    ].filter(Boolean).join(', ');

    doc
      .fontSize(9)
      .fillColor('#666666')
      .text(addressLine, { align: 'center' });
  }

  doc.moveDown(0.5);
  doc
    .moveTo(50, doc.y)
    .lineTo(545, doc.y)
    .strokeColor('#1a3c6e')
    .lineWidth(1.5)
    .stroke();

  doc.moveDown(1);

  // TITLE 
  doc
    .fontSize(16)
    .fillColor('#1a3c6e')
    .font('Helvetica-Bold')
    .text('PAYMENT INVOICE', { align: 'center' });

  doc.moveDown(1);

  //  INVOICE META + PATIENT + DOCTOR INFO 
  const infoTop = doc.y;

  doc
    .fontSize(10)
    .fillColor('#000000')
    .font('Helvetica-Bold')
    .text('Invoice No:', 50, infoTop)
    .font('Helvetica')
    .text(`INV-${data.id}`, 160, infoTop);

  doc
    .font('Helvetica-Bold')
    .text('Invoice Date:', 350, infoTop)
    .font('Helvetica')
    .text(formatDate(data.createdAt), 420, infoTop);

  const row2 = infoTop + 20;
  doc
    .font('Helvetica-Bold')
    .text('Patient Name:', 50, row2)
    .font('Helvetica')
    .text(fullName(patient.firstName, patient.middleName, patient.lastName), 160, row2);

  doc
    .font('Helvetica-Bold')
    .text('Appointment:', 350, row2)
    .font('Helvetica')
    .text(
      `${formatDate(appointment.appointmentDate)}, ${formatTime(appointment.appointmentStartTime)}`,
      420, row2, { width: 130 }
    );

  const row3 = row2 + 20;
  doc
    .font('Helvetica-Bold')
    .text('Consulting Doctor:', 50, row3)
    .font('Helvetica')
    .text(`Dr. ${fullName(doctor.firstName, doctor.middleName, doctor.lastName)}`, 160, row3);

  doc
    .font('Helvetica-Bold')
    .text('Paid By:', 350, row3)
    .font('Helvetica')
    .text(data.paidBy, 420, row3);

  doc.moveDown(3);

  // FEE BREAKDOWN TABLE 
  const tableTop = doc.y;
  const colDesc = 50;
  const colAmount = 450;

  // header row
  doc
    .rect(50, tableTop, 495, 22)
    .fill('#1a3c6e');

  doc
    .fontSize(10)
    .fillColor('#ffffff')
    .font('Helvetica-Bold')
    .text('Description', colDesc + 8, tableTop + 6)
    .text('Amount', colAmount, tableTop + 6, { width: 85, align: 'right' });

  let rowY = tableTop + 22;

  const drawRow = (label: string, amount: string, bold = false) => {
    doc
      .fontSize(10)
      .fillColor('#000000')
      .font(bold ? 'Helvetica-Bold' : 'Helvetica')
      .text(label, colDesc + 8, rowY + 8)
      .text(amount, colAmount, rowY + 8, { width: 85, align: 'right' });

    doc
      .moveTo(50, rowY + 26)
      .lineTo(545, rowY + 26)
      .strokeColor('#dddddd')
      .lineWidth(0.5)
      .stroke();

    rowY += 26;
  };

  drawRow('Consultation Fees', formatCurrency(data.consultationFees));
  drawRow(`Tax (${Number(data.taxRate).toFixed(0)}%)`, formatCurrency(data.taxCharges));

  // total row — highlighted
  doc
    .rect(50, rowY, 495, 26)
    .fill('#f0f4fa');

  doc
    .fontSize(11)
    .fillColor('#1a3c6e')
    .font('Helvetica-Bold')
    .text('Total Amount', colDesc + 8, rowY + 8)
    .text(formatCurrency(data.totalAmount), colAmount, rowY + 8, { width: 85, align: 'right' });

  rowY += 26;

  doc.y = rowY + 30;

  // PAYMENT STATUS BADGE
  doc
    .fontSize(10)
    .fillColor('#2e7d32')
    .font('Helvetica-Bold')
    .text('PAYMENT STATUS: PAID', 50, doc.y);

  doc.moveDown(2);

  // FOOTER 
  doc
    .fontSize(8)
    .fillColor('#999999')
    .font('Helvetica')
    .text(
      'This is a system generated invoice and does not require a signature or stamp.',
      50, 760,
      { align: 'center', width: 495 }
    );

  doc.end();
};