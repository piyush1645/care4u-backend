import 'dotenv/config';
import prisma from './config/prisma.js';

async function main() {
  const doctors = await prisma.doctor.findMany();
  console.log("Doctors in DB:");
  doctors.forEach(dr => {
    console.log({ id: dr.id.toString(), name: `Dr. ${dr.firstName} ${dr.lastName}`, credentialId: dr.credentialId.toString() });
  });

  const invoices = await prisma.invoice.findMany({
    include: {
      appointment: true
    }
  });
  console.log("\nInvoices in DB:");
  invoices.forEach(inv => {
    console.log({
      id: inv.id.toString(),
      appointmentId: inv.appointmentId.toString(),
      doctorId: inv.appointment?.doctorId.toString(),
      patientId: inv.appointment?.patientId.toString()
    });
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
