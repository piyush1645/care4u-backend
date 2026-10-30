import PDFDocument from 'pdfkit';
import type { Response } from 'express';

interface PrescriptionPdfData {
  invoiceLikeId: bigint;            // prescription.id — used as reference
  precautions: string;
  createdAt: Date;
  attachments: { url: string; type: string }[];
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

export const streamPrescriptionPdf = (data: PrescriptionPdfData, res: Response) => {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="prescription-${data.invoiceLikeId}.pdf"`
  );

  doc.pipe(res);

  const { appointment } = data;
  const { hospital, doctor, patient } = appointment;

  //  HOSPITAL LETTERHEAD 
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
    .text('MEDICAL PRESCRIPTION', { align: 'center' });

  doc.moveDown(1);

  // PRESCRIPTION + DOCTOR + PATIENT INFO ROW 
  const infoTop = doc.y;

  doc
    .fontSize(10)
    .fillColor('#000000')
    .font('Helvetica-Bold')
    .text('Prescription Ref:', 50, infoTop)
    .font('Helvetica')
    .text(`RX-${data.invoiceLikeId}`, 160, infoTop);

  doc
    .font('Helvetica-Bold')
    .text('Date:', 350, infoTop)
    .font('Helvetica')
    .text(formatDate(data.createdAt), 410, infoTop);

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

  doc.moveDown(3);

  doc
    .moveTo(50, doc.y)
    .lineTo(545, doc.y)
    .strokeColor('#cccccc')
    .lineWidth(0.5)
    .stroke();

  doc.moveDown(1.5);

  // PRECAUTIONS / PRESCRIPTION CONTENT 
  doc
    .fontSize(12)
    .fillColor('#1a3c6e')
    .font('Helvetica-Bold')
    .text('Precautions & Instructions');

  doc.moveDown(0.5);

  doc
    .fontSize(11)
    .fillColor('#000000')
    .font('Helvetica')
    .text(data.precautions || 'No specific precautions recorded for this visit.', {
      align: 'left',
      lineGap: 4
    });

  doc.moveDown(1.5);

  // ATTACHMENTS LIST 
  if (data.attachments && data.attachments.length > 0) {
    doc
      .fontSize(12)
      .fillColor('#1a3c6e')
      .font('Helvetica-Bold')
      .text('Attached Reports');

    doc.moveDown(0.3);

    data.attachments.forEach((att, idx) => {
      doc
        .fontSize(10)
        .fillColor('#000000')
        .font('Helvetica')
        .text(`${idx + 1}. ${att.type} — ${att.url}`, { lineGap: 2 });
    });

    doc.moveDown(1);
  }

  // FOOTER / SIGNATURE AREA 
  const bottomY = 720;
  doc
    .moveTo(380, bottomY)
    .lineTo(545, bottomY)
    .strokeColor('#999999')
    .lineWidth(0.5)
    .stroke();

  doc
    .fontSize(9)
    .fillColor('#666666')
    .font('Helvetica')
    .text(`Dr. ${fullName(doctor.firstName, doctor.middleName, doctor.lastName)}`, 380, bottomY + 5, {
      width: 165,
      align: 'center'
    });

  doc
    .fontSize(8)
    .fillColor('#999999')
    .text(
      'This is a digitally generated prescription and does not require a physical signature.',
      50, 760,
      { align: 'center', width: 495 }
    );

  doc.end();
};