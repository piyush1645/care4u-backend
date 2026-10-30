import 'dotenv/config';
import * as invoiceService from './modules/invoice/service/invoice.service.js';

async function main() {
  const doctorId = 18n; // Dr. Arjun Mehta
  const invoices = await invoiceService.findByDoctorId(doctorId);

  console.log(`Fetched ${invoices.length} invoices from backend service.`);

  // Let's serialize and deserialize to simulate JSON transport
  const invoicesData = JSON.parse(JSON.stringify(invoices, (key, value) => {
    if (typeof value === 'bigint') return value.toString();
    return value;
  }));

  const monthsMap: any = {};
  let totalEarnings = 0;
  let totalTax = 0;
  let totalAmount = 0;
  const formattedInvoices: any[] = [];

  invoicesData.forEach((inv: any) => {
    console.log(`\nChecking invoice ID: ${inv.id}`);
    console.log(`Appointment status in DB: ${inv.appointment?.status}`);
    console.log(`Appointment endTime in DB: ${inv.appointment?.appointmentEndTime}`);

    const isCompleted = inv.appointment && (
        inv.appointment.status === 'COMPLETED' ||
        (['BOOKED', 'ON_GOING', 'RESCHEDULED'].includes(inv.appointment.status) && new Date() > new Date(inv.appointment.appointmentEndTime))
    );

    console.log(`isCompleted evaluated to: ${isCompleted}`);

    if (!isCompleted) {
      console.log(`Skipping invoice ID ${inv.id} because isCompleted is false.`);
      return;
    }

    const date = new Date(inv.createdAt);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const monthLabel = date.toLocaleString('default', { month: 'long', year: 'numeric' });
    monthsMap[monthKey] = monthLabel;

    const fee = Number(inv.consultationFees || 0);
    const tax = Number(inv.taxCharges || 0);
    const tot = Number(inv.totalAmount || 0);

    totalEarnings += fee;
    totalTax += tax;
    totalAmount += tot;

    formattedInvoices.push({
        id: inv.id.toString(),
        date: date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
        monthKey,
        patientName: inv.appointment?.patient ? `${inv.appointment.patient.firstName} ${inv.appointment.patient.lastName}` : 'N/A',
        consultationFees: fee.toFixed(2),
        taxCharges: tax.toFixed(2),
        totalAmount: tot.toFixed(2),
        paidBy: inv.paidBy || 'SELF'
    });
  });

  console.log(`\nFinal Formatted Invoices:`, formattedInvoices);
  console.log(`totalEarnings: ${totalEarnings}`);
}

main().catch(console.error);
