import 'dotenv/config';
import prisma from "../../../config/prisma.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const d = (dateStr: string) => new Date(dateStr);
const HASH = "$argon2id$v=19$m=65536,t=3,p=4$KB4X8tDIvFj0+OBSH9tpTA$kNxY49jpbgTNaEy/+fxVnXHbEHtIBi28EznVoE7+8qo"; // Password@123

async function main() {
  console.log("🌱 Starting HMS seed...\n");


  // ── Wipe existing data in FK-safe reverse order ────────────────────────────
  console.log("🗑️  Clearing existing data...");
  await prisma.paymentDetails.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.prescription.deleteMany();
  await prisma.meetingLogs.deleteMany();
  await prisma.meeting.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.leaves.deleteMany();
  await prisma.schedule.deleteMany();
  await prisma.speciality.deleteMany();
  await prisma.degree.deleteMany();
  await prisma.review.deleteMany();
  await prisma.staff.deleteMany();
  await prisma.doctor.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.admin.deleteMany();
  await prisma.address.deleteMany();
  await prisma.hospital.deleteMany();
  await prisma.hospitalGroup.deleteMany();
  await prisma.userCredential.deleteMany();
  await prisma.specialityList.deleteMany();
  await prisma.courseList.deleteMany();
  await prisma.bloodGroupList.deleteMany();
  console.log("✅ Cleared.\n");

  // ── 1. LOOKUP TABLES ──────────────────────────────────────────────────────
  console.log("📋 Seeding lookup tables...");

  await prisma.bloodGroupList.createMany({
    data: [
      { bloodGroupName: "A+" },
      { bloodGroupName: "A-" },
      { bloodGroupName: "B+" },
      { bloodGroupName: "B-" },
      { bloodGroupName: "O+" },
      { bloodGroupName: "O-" },
      { bloodGroupName: "AB+" },
      { bloodGroupName: "AB-" },
    ],
  });

  await prisma.courseList.createMany({
    data: [
      { courseName: "Bachelor of Medicine and Bachelor of Surgery", courseAbbrevation: "MBBS" },
      { courseName: "Doctor of Medicine",                           courseAbbrevation: "MD" },
      { courseName: "Master of Surgery",                            courseAbbrevation: "MS" },
      { courseName: "Doctor of Philosophy",                         courseAbbrevation: "PhD" },
      { courseName: "Diplomate of National Board",                  courseAbbrevation: "DNB" },
      { courseName: "Master of Chirurgiae",                         courseAbbrevation: "MCh" },
      { courseName: "Bachelor of Dental Surgery",                   courseAbbrevation: "BDS" },
      { courseName: "Master of Dental Surgery",                     courseAbbrevation: "MDS" },
      { courseName: "Fellowship of Royal College of Surgeons",      courseAbbrevation: "FRCS" },
    ],
  });

  await prisma.specialityList.createMany({
    data: [
      { specialityName: "Cardiology" },
      { specialityName: "Neurology" },
      { specialityName: "Orthopedics" },
      { specialityName: "Pediatrics" },
      { specialityName: "Dermatology" },
      { specialityName: "Gynecology" },
      { specialityName: "Ophthalmology" },
      { specialityName: "ENT" },
      { specialityName: "General Surgery" },
      { specialityName: "Psychiatry" },
      { specialityName: "Radiology" },
      { specialityName: "General Physician" },
    ],
  });

  console.log("✅ Lookup tables seeded.\n");

  // ── 2. CREDENTIALS ────────────────────────────────────────────────────────
  console.log("🔐 Seeding credentials...");

  const credentialData = [
    // id 1 — SUPER_ADMIN
    { email: "superadmin@hms.com",           mobile: "9000000001", role: "SUPER_ADMIN" as const },
    // id 2-3 — ADMIN
    { email: "admin@medicare.com",           mobile: "9000000002", role: "ADMIN" as const },
    { email: "admin@lifeline.com",           mobile: "9000000003", role: "ADMIN" as const },
    // id 4-11 — DOCTOR
    { email: "arjun.mehta@medicare.com",     mobile: "9100000001", role: "DOCTOR" as const },
    { email: "priya.sharma@medicare.com",    mobile: "9100000002", role: "DOCTOR" as const },
    { email: "ravi.patel@medicare.com",      mobile: "9100000003", role: "DOCTOR" as const },
    { email: "sneha.iyer@lifeline.com",      mobile: "9100000004", role: "DOCTOR" as const },
    { email: "karan.verma@lifeline.com",     mobile: "9100000005", role: "DOCTOR" as const },
    { email: "meera.nair@medicare.com",      mobile: "9100000006", role: "DOCTOR" as const },
    { email: "sanjay.gupta@lifeline.com",    mobile: "9100000007", role: "DOCTOR" as const },
    { email: "pooja.desai@medicare.com",     mobile: "9100000008", role: "DOCTOR" as const },
    // id 12-14 — STAFF
    { email: "rahul.singh@medicare.com",     mobile: "9200000001", role: "STAFF" as const },
    { email: "anjali.kulkarni@medicare.com", mobile: "9200000002", role: "STAFF" as const },
    { email: "deepak.joshi@lifeline.com",    mobile: "9200000003", role: "STAFF" as const },
    // id 15-20 — PATIENT
    { email: "amit.shah@gmail.com",          mobile: "9300000001", role: "PATIENT" as const },
    { email: "nisha.patel@gmail.com",        mobile: "9300000002", role: "PATIENT" as const },
    { email: "rohan.jain@gmail.com",         mobile: "9300000003", role: "PATIENT" as const },
    { email: "kavya.reddy@gmail.com",        mobile: "9300000004", role: "PATIENT" as const },
    { email: "suresh.kumar@gmail.com",       mobile: "9300000005", role: "PATIENT" as const },
    { email: "divya.mehta@gmail.com",        mobile: "9300000006", role: "PATIENT" as const },
  ];

  // Create credentials one-by-one to get back IDs in order
  const createdCreds: bigint[] = [];
  for (const c of credentialData) {
    const cred = await prisma.userCredential.create({
      data: {
        email:          c.email,
        mobile:         c.mobile,
        hashedPassword: HASH,
        role:           c.role,
        isActive:       true,
      },
    });
    createdCreds.push(cred.id);
  }

  // Named references (index = position in credentialData array)
  const [
    _credSuperAdmin,
    credAdminMedicare, credAdminLifeline,
    credDrArjun, credDrPriya, credDrRavi, credDrSneha, credDrKaran,
    credDrMeera, credDrSanjay, credDrPooja,
    credStaffRahul, credStaffAnjali, credStaffDeepak,
    credPatAmit, credPatNisha, credPatRohan,
    credPatKavya, credPatSuresh, credPatDivya,
  ] = createdCreds;

  console.log("✅ Credentials seeded.\n");

  // ── 3. HOSPITAL GROUPS ────────────────────────────────────────────────────
  console.log("🏥 Seeding hospital groups...");

  const groupMedicare = await prisma.hospitalGroup.create({
    data: {
      name:     "MediCare Hospitals",
      logo:     "https://storage.hms.com/logos/medicare.png",
      isActive: true,
    },
  });

  const groupLifeline = await prisma.hospitalGroup.create({
    data: {
      name:     "Lifeline Healthcare",
      logo:     "https://storage.hms.com/logos/lifeline.png",
      isActive: true,
    },
  });

  console.log("✅ Hospital groups seeded.\n");

  // ── 4. HOSPITALS ──────────────────────────────────────────────────────────
  console.log("🏨 Seeding hospitals...");

  const hospMcAhm = await prisma.hospital.create({
    data: {
      branchName:       "MediCare Ahmedabad",
      photo:             "https://storage.hms.com/hospitals/mc_ahm.jpg",
      isActive:          true,
      hospitalGroupId: groupMedicare.id,
    },
  });

  const hospMcMum = await prisma.hospital.create({
    data: {
      branchName:       "MediCare Mumbai",
      photo:             "https://storage.hms.com/hospitals/mc_mum.jpg",
      isActive:          true,
      hospitalGroupId: groupMedicare.id,
    },
  });

  const hospLlSrt = await prisma.hospital.create({
    data: {
      branchName:       "Lifeline Surat",
      photo:             "https://storage.hms.com/hospitals/ll_srt.jpg",
      isActive:          true,
      hospitalGroupId: groupLifeline.id,
    },
  });

  const hospLlVdr = await prisma.hospital.create({
    data: {
      branchName:       "Lifeline Vadodara",
      photo:             "https://storage.hms.com/hospitals/ll_vdr.jpg",
      isActive:          true,
      hospitalGroupId: groupLifeline.id,
    },
  });

  console.log("✅ Hospitals seeded.\n");

  // ── 5. ADDRESSES ──────────────────────────────────────────────────────────
  console.log("📍 Seeding addresses...");

  await prisma.address.createMany({
    data: [
      {
        addressLine1: "12, Satellite Road",
        addressLine2: "Near Jodhpur Cross Roads",
        city:           "Ahmedabad",
        state:          "Gujarat",
        country:        "India",
        pincode:        "380015",
        hospitalId:    hospMcAhm.id,
      },
      {
        addressLine1: "48, Andheri East",
        addressLine2: "Near WEH Metro Station",
        city:           "Mumbai",
        state:          "Maharashtra",
        country:        "India",
        pincode:        "400069",
        hospitalId:    hospMcMum.id,
      },
      {
        addressLine1: "7, Ring Road",
        addressLine2: "Adajan",
        city:           "Surat",
        state:          "Gujarat",
        country:        "India",
        pincode:        "395009",
        hospitalId:    hospLlSrt.id,
      },
      {
        addressLine1: "22, Alkapuri",
        addressLine2: "Near Race Course",
        city:           "Vadodara",
        state:          "Gujarat",
        country:        "India",
        pincode:        "390007",
        hospitalId:    hospLlVdr.id,
      },
    ],
  });

  console.log("✅ Addresses seeded.\n");

  // ── 6. ADMINS ─────────────────────────────────────────────────────────────
  console.log("👤 Seeding admins...");

  await prisma.admin.createMany({
    data: [
      { firstName: "Vikram", lastName: "Malhotra", hospitalGroupId: groupMedicare.id, credentialId: BigInt(Number(credAdminMedicare)) },
      { firstName: "Sunita", lastName: "Rao",      hospitalGroupId: groupLifeline.id, credentialId: BigInt(Number(credAdminLifeline)) },
    ],
  });

  console.log("✅ Admins seeded.\n");

  // ── 7. DOCTORS ────────────────────────────────────────────────────────────
  console.log("👨‍⚕️ Seeding doctors...");

const doctorData = [
  {
    firstName: "Arjun",
    middleName: null,
    lastName: "Mehta",
    profilePhoto: "https://storage.hms.com/doctors/arjun.jpg",
    gender: "MALE" as const,
    dateOfBirth: d("1978-04-12"),
    preferedLanguages: "English,Hindi,Gujarati",
    expereince: 18,
    charges: 1500,
    slotDuration: 15,
    credentialId: BigInt(Number(credDrArjun)),
    hospitalId: hospMcAhm.id,
  },
  {
    firstName: "Priya",
    middleName: null,
    lastName: "Sharma",
    profilePhoto: "https://storage.hms.com/doctors/priya.jpg",
    gender: "FEMALE" as const,
    dateOfBirth: d("1983-09-25"),
    preferedLanguages: "English,Hindi",
    expereince: 13,
    charges: 1200,
    slotDuration: 20,
    credentialId: BigInt(Number(credDrPriya)),
    hospitalId: hospMcAhm.id,
  },
  {
    firstName: "Ravi",
    middleName: "Kumar",
    lastName: "Patel",
    profilePhoto: "https://storage.hms.com/doctors/ravi.jpg",
    gender: "MALE" as const,
    dateOfBirth: d("1975-01-30"),
    preferedLanguages: "English,Gujarati",
    expereince: 21,
    charges: 1800,
    slotDuration: 15,
    credentialId: BigInt(Number(credDrRavi)),
    hospitalId: hospMcAhm.id,
  },
  {
    firstName: "Meera",
    middleName: null,
    lastName: "Nair",
    profilePhoto: "https://storage.hms.com/doctors/meera.jpg",
    gender: "FEMALE" as const,
    dateOfBirth: d("1988-06-17"),
    preferedLanguages: "English,Hindi,Malayalam",
    expereince: 8,
    charges: 1000,
    slotDuration: 15,
    credentialId: BigInt(Number(credDrMeera)),
    hospitalId: hospMcAhm.id,
  },
  {
    firstName: "Pooja",
    middleName: null,
    lastName: "Desai",
    profilePhoto: "https://storage.hms.com/doctors/pooja.jpg",
    gender: "FEMALE" as const,
    dateOfBirth: d("1985-11-03"),
    preferedLanguages: "English,Gujarati",
    expereince: 11,
    charges: 1100,
    slotDuration: 20,
    credentialId: BigInt(Number(credDrPooja)),
    hospitalId: hospMcAhm.id,
  },
  {
    firstName: "Sneha",
    middleName: null,
    lastName: "Iyer",
    profilePhoto: "https://storage.hms.com/doctors/sneha.jpg",
    gender: "FEMALE" as const,
    dateOfBirth: d("1980-07-22"),
    preferedLanguages: "English,Tamil,Hindi",
    expereince: 16,
    charges: 1400,
    slotDuration: 15,
    credentialId: BigInt(Number(credDrSneha)),
    hospitalId: hospLlSrt.id,
  },
  {
    firstName: "Karan",
    middleName: "Dev",
    lastName: "Verma",
    profilePhoto: "https://storage.hms.com/doctors/karan.jpg",
    gender: "MALE" as const,
    dateOfBirth: d("1982-03-14"),
    preferedLanguages: "English,Hindi",
    expereince: 14,
    charges: 1300,
    slotDuration: 15,
    credentialId: BigInt(Number(credDrKaran)),
    hospitalId: hospLlSrt.id,
  },
  {
    firstName: "Sanjay",
    middleName: null,
    lastName: "Gupta",
    profilePhoto: "https://storage.hms.com/doctors/sanjay.jpg",
    gender: "MALE" as const,
    dateOfBirth: d("1973-12-08"),
    preferedLanguages: "English,Hindi",
    expereince: 25,
    charges: 2000,
    slotDuration: 20,
    credentialId: BigInt(Number(credDrSanjay)),
    hospitalId: hospLlSrt.id,
  },
];

  const createdDoctors: bigint[] = [];
  for (const doc of doctorData) {
    const dr = await prisma.doctor.create({ data: doc });
    createdDoctors.push(BigInt(Number(dr.id)));
  }

  const [drArjun, drPriya, drRavi, drMeera, drPooja, drSneha, drKaran, drSanjay] = createdDoctors;

  console.log("✅ Doctors seeded.\n");

  // ── 8. STAFFS ─────────────────────────────────────────────────────────────
  console.log("🧑‍💼 Seeding staff...");

  await prisma.staff.createMany({
    data: [
      {
        firstName: "Rahul",  middleName: null,  lastName: "Singh",
        profilePhoto: "https://storage.hms.com/staff/rahul.jpg",
        gender: "MALE",   dateOfBirth: d("1995-08-20"),
        credentialId: BigInt(Number(credStaffRahul)),  hospitalId: hospMcAhm.id,
      },
      {
        firstName: "Anjali", middleName: null,  lastName: "Kulkarni",
        profilePhoto: "https://storage.hms.com/staff/anjali.jpg",
        gender: "FEMALE", dateOfBirth: d("1997-02-11"),
        credentialId: BigInt(Number(credStaffAnjali)), hospitalId: hospMcMum.id,
      },
      {
        firstName: "Deepak", middleName: "Raj", lastName: "Joshi",
        profilePhoto: "https://storage.hms.com/staff/deepak.jpg",
        gender: "MALE",   dateOfBirth: d("1993-05-30"),
        credentialId: BigInt(Number(credStaffDeepak)), hospitalId: hospLlSrt.id,
      },
    ],
  });

  console.log("✅ Staff seeded.\n");

  // ── 9. PATIENTS ───────────────────────────────────────────────────────────
  console.log("🧑‍🤝‍🧑 Seeding patients...");

  const patientData = [
  {
    firstName: "Amit",
    middleName: null,
    lastName: "Shah",
    profilePhoto: "https://storage.hms.com/patients/amit.jpg",
    gender: "MALE" as const,
    dateOfBirth: d("1990-05-15"),
    bloodGroup: "B_POSITIVE" as const,
    credentialId: BigInt(Number(credPatAmit)),
  },
  {
    firstName: "Nisha",
    middleName: null,
    lastName: "Patel",
    profilePhoto: "https://storage.hms.com/patients/nisha.jpg",
    gender: "FEMALE" as const,
    dateOfBirth: d("1995-11-22"),
    bloodGroup: "O_POSITIVE" as const,
    credentialId: BigInt(Number(credPatNisha)),
  },
  {
    firstName: "Rohan",
    middleName: "Raj",
    lastName: "Jain",
    profilePhoto: "https://storage.hms.com/patients/rohan.jpg",
    gender: "MALE" as const,
    dateOfBirth: d("1988-03-07"),
    bloodGroup: "A_POSITIVE" as const,
    credentialId: BigInt(Number(credPatRohan)),
  },
  {
    firstName: "Kavya",
    middleName: null,
    lastName: "Reddy",
    profilePhoto: "https://storage.hms.com/patients/kavya.jpg",
    gender: "FEMALE" as const,
    dateOfBirth: d("1998-09-30"),
    bloodGroup: "AB_POSITIVE" as const,
    credentialId: BigInt(Number(credPatKavya)),
  },
  {
    firstName: "Suresh",
    middleName: "Lal",
    lastName: "Kumar",
    profilePhoto: null,
    gender: "MALE" as const,
    dateOfBirth: d("1975-01-18"),
    bloodGroup: "O_NEGATIVE" as const,
    credentialId: BigInt(Number(credPatSuresh)),
  },
  {
    firstName: "Divya",
    middleName: null,
    lastName: "Mehta",
    profilePhoto: "https://storage.hms.com/patients/divya.jpg",
    gender: "FEMALE" as const,
    dateOfBirth: d("2001-07-04"),
    bloodGroup: "A_NEGATIVE" as const,
    credentialId: BigInt(Number(credPatDivya)),
  },
];

  const createdPatients: bigint[] = [];
  for (const pat of patientData) {
    const p = await prisma.patient.create({ data: pat });
    createdPatients.push(p.id);
  }

  const [patAmit, patNisha, patRohan, patKavya, patSuresh, patDivya] = createdPatients;

  console.log("✅ Patients seeded.\n");

  // ── 10. DOCTOR DEGREES ────────────────────────────────────────────────────
  console.log("🎓 Seeding doctor degrees...");

  await prisma.degree.createMany({
    data: [
      // Dr. Arjun Mehta — Cardiologist
      { courseName: "Bachelor of Medicine and Bachelor of Surgery", abbreviation: "MBBS", institution: "B.J. Medical College, Ahmedabad",     passingYear: 2002, doctorId: BigInt(Number(drArjun)) },
      { courseName: "Doctor of Medicine",                           abbreviation: "MD",   institution: "AIIMS, New Delhi",                    passingYear: 2006, doctorId: BigInt(Number(drArjun)) },
      // Dr. Priya Sharma — Neurologist
      { courseName: "Bachelor of Medicine and Bachelor of Surgery", abbreviation: "MBBS", institution: "Grant Medical College, Mumbai",        passingYear: 2007, doctorId: BigInt(Number(drPriya)) },
      { courseName: "Doctor of Medicine",                           abbreviation: "MD",   institution: "PGI Chandigarh",                       passingYear: 2011, doctorId: BigInt(Number(drPriya)) },
      // Dr. Ravi Patel — Orthopedic
      { courseName: "Bachelor of Medicine and Bachelor of Surgery", abbreviation: "MBBS", institution: "M.S. University, Vadodara",            passingYear: 1999, doctorId: BigInt(Number(drRavi ))},
      { courseName: "Master of Surgery",                            abbreviation: "MS",   institution: "AIIMS, New Delhi",                    passingYear: 2004, doctorId: BigInt(Number(drRavi ))},
      { courseName: "Fellowship of Royal College of Surgeons",      abbreviation: "FRCS", institution: "Royal College of Surgeons, London",   passingYear: 2008, doctorId: BigInt(Number(drRavi ))},
      // Dr. Meera Nair — Dermatologist
      { courseName: "Bachelor of Medicine and Bachelor of Surgery", abbreviation: "MBBS", institution: "Kasturba Medical College, Manipal",   passingYear: 2012, doctorId: BigInt(Number(drMeera)) },
      { courseName: "Diplomate of National Board",                  abbreviation: "DNB",  institution: "National Board of Examinations",      passingYear: 2016, doctorId: BigInt(Number(drMeera)) },
      // Dr. Pooja Desai — Psychiatrist
      { courseName: "Bachelor of Medicine and Bachelor of Surgery", abbreviation: "MBBS", institution: "NHL Municipal Medical College, Ahm.", passingYear: 2010, doctorId: BigInt(Number(drPooja)) },
      { courseName: "Doctor of Medicine",                           abbreviation: "MD",   institution: "NIMHANS, Bangalore",                  passingYear: 2014, doctorId: BigInt(Number(drPooja)) },
      // Dr. Sneha Iyer — Gynecologist
      { courseName: "Bachelor of Medicine and Bachelor of Surgery", abbreviation: "MBBS", institution: "Madras Medical College, Chennai",     passingYear: 2004, doctorId: BigInt(Number(drSneha)) },
      { courseName: "Master of Surgery",                            abbreviation: "MS",   institution: "JIPMER, Puducherry",                  passingYear: 2008, doctorId: BigInt(Number(drSneha)) },
      // Dr. Karan Verma — Pediatrician
      { courseName: "Bachelor of Medicine and Bachelor of Surgery", abbreviation: "MBBS", institution: "King George Medical College, Lucknow", passingYear: 2006, doctorId: BigInt(Number(drKaran)) },
      { courseName: "Doctor of Medicine",                           abbreviation: "MD",   institution: "SGPGI, Lucknow",                      passingYear: 2010, doctorId: BigInt(Number(drKaran)) },
      // Dr. Sanjay Gupta — General Surgeon
      { courseName: "Bachelor of Medicine and Bachelor of Surgery", abbreviation: "MBBS", institution: "Maulana Azad Medical College, Delhi", passingYear: 1995, doctorId: BigInt(Number(drSanjay)) },
      { courseName: "Master of Surgery",                            abbreviation: "MS",   institution: "AIIMS, New Delhi",                    passingYear: 2000, doctorId: BigInt(Number(drSanjay)) },
      { courseName: "Master of Chirurgiae",                         abbreviation: "MCh",  institution: "AIIMS, New Delhi",                    passingYear: 2004, doctorId: BigInt(Number(drSanjay)) },
    ],
  });

  console.log("✅ Doctor degrees seeded.\n");

  // ── 11. DOCTOR SPECIALITIES ───────────────────────────────────────────────
  console.log("🩺 Seeding doctor specialities...");

  await prisma.speciality.createMany({
    data: [
  { name: "Cardiology",                 doctorId: BigInt(Number(drArjun)) },
  { name: "Interventional Cardiology",  doctorId: BigInt(Number(drArjun)) },

  { name: "Neurology",                  doctorId: BigInt(Number(drPriya)) },
  { name: "Epileptology",               doctorId: BigInt(Number(drPriya)) },

  { name: "Orthopedics",                doctorId: BigInt(Number(drRavi)) },
  { name: "Joint Replacement",          doctorId: BigInt(Number(drRavi)) },
  { name: "Sports Medicine",            doctorId: BigInt(Number(drRavi)) },

  { name: "Dermatology",                doctorId: BigInt(Number(drMeera)) },
  { name: "Cosmetology",                doctorId: BigInt(Number(drMeera)) },

  { name: "Psychiatry",                 doctorId: BigInt(Number(drPooja)) },
  { name: "Cognitive Therapy",          doctorId: BigInt(Number(drPooja)) },

  { name: "Gynecology",                 doctorId: BigInt(Number(drSneha)) },
  { name: "Obstetrics",                 doctorId: BigInt(Number(drSneha)) },

  { name: "Pediatrics",                 doctorId: BigInt(Number(drKaran)) },
  { name: "Neonatology",                doctorId: BigInt(Number(drKaran)) },

  { name: "General Surgery",            doctorId: BigInt(Number(drSanjay)) },
  { name: "Laparoscopic Surgery",       doctorId: BigInt(Number(drSanjay)) },
]
  });

  console.log("✅ Doctor specialities seeded.\n");

  // ── 12. DOCTOR SCHEDULES ──────────────────────────────────────────────────
  console.log("📅 Seeding doctor schedules...");

  await prisma.schedule.createMany({
data: [
  {
    morningStartTime: d("2024-01-01T09:00:00"),
    morningEndTime: d("2024-01-01T13:00:00"),
    eveningStartTime: d("2024-01-01T17:00:00"),
    eveningEndTime: d("2024-01-01T20:00:00"),
    workingDays: "MONDAY,TUESDAY,WEDNESDAY,THURSDAY,FRIDAY",
    doctorId: BigInt(Number(drArjun)),
  },
  {
    morningStartTime: d("2024-01-01T10:00:00"),
    morningEndTime: d("2024-01-01T13:00:00"),
    eveningStartTime: d("2024-01-01T16:00:00"),
    eveningEndTime: d("2024-01-01T19:00:00"),
    workingDays: "MONDAY,WEDNESDAY,FRIDAY,SATURDAY",
    doctorId: BigInt(Number(drPriya)),
  },
  {
    morningStartTime: d("2024-01-01T08:30:00"),
    morningEndTime: d("2024-01-01T12:30:00"),
    eveningStartTime: d("2024-01-01T15:00:00"),
    eveningEndTime: d("2024-01-01T19:00:00"),
    workingDays: "MONDAY,TUESDAY,WEDNESDAY,THURSDAY,FRIDAY,SATURDAY",
    doctorId: BigInt(Number(drRavi)),
  },
  {
    morningStartTime: d("2024-01-01T11:00:00"),
    morningEndTime: d("2024-01-01T14:00:00"),
    eveningStartTime: null,
    eveningEndTime: null,
    workingDays: "TUESDAY,THURSDAY,SATURDAY",
    doctorId: BigInt(Number(drMeera)),
  },
  {
    morningStartTime: d("2024-01-01T09:00:00"),
    morningEndTime: d("2024-01-01T13:00:00"),
    eveningStartTime: d("2024-01-01T18:00:00"),
    eveningEndTime: d("2024-01-01T21:00:00"),
    workingDays: "MONDAY,TUESDAY,WEDNESDAY,THURSDAY,FRIDAY",
    doctorId: BigInt(Number(drPooja)),
  },
  {
    morningStartTime: d("2024-01-01T09:00:00"),
    morningEndTime: d("2024-01-01T13:00:00"),
    eveningStartTime: d("2024-01-01T17:00:00"),
    eveningEndTime: d("2024-01-01T20:00:00"),
    workingDays: "MONDAY,TUESDAY,WEDNESDAY,THURSDAY,FRIDAY",
    doctorId: BigInt(Number(drSneha)),
  },
  {
    morningStartTime: d("2024-01-01T10:00:00"),
    morningEndTime: d("2024-01-01T14:00:00"),
    eveningStartTime: d("2024-01-01T16:00:00"),
    eveningEndTime: d("2024-01-01T20:00:00"),
    workingDays: "MONDAY,WEDNESDAY,THURSDAY,FRIDAY,SATURDAY",
    doctorId: BigInt(Number(drKaran)),
  },
  {
    morningStartTime: d("2024-01-01T08:00:00"),
    morningEndTime: d("2024-01-01T12:00:00"),
    eveningStartTime: d("2024-01-01T15:00:00"),
    eveningEndTime: d("2024-01-01T18:00:00"),
    workingDays: "TUESDAY,WEDNESDAY,THURSDAY,FRIDAY",
    doctorId: BigInt(Number(drSanjay)),
  },
]
  });

  console.log("✅ Doctor schedules seeded.\n");

  // ── 13. DOCTOR LEAVES ─────────────────────────────────────────────────────
  console.log("🏖️  Seeding doctor leaves...");

  await prisma.leaves.createMany({
    data: [
      { leaveDate: d("2025-08-15"), leaveStartTime: null,                     leaveEndTime: null,                     doctorId: BigInt(Number(drArjun))  },
      { leaveDate: d("2025-10-02"), leaveStartTime: null,                     leaveEndTime: null,                     doctorId: BigInt(Number(drPriya))  },
      { leaveDate: d("2025-11-01"), leaveStartTime: null,                     leaveEndTime: null,                     doctorId: BigInt(Number(drRavi ))  },
      { leaveDate: d("2025-12-25"), leaveStartTime: null,                     leaveEndTime: null,                     doctorId: BigInt(Number(drMeera))  },
      { leaveDate: d("2025-09-10"), leaveStartTime: d("2025-09-10T13:00:00"), leaveEndTime: d("2025-09-10T21:00:00"), doctorId: BigInt(Number(drArjun))  },
      { leaveDate: d("2025-10-20"), leaveStartTime: d("2025-10-20T09:00:00"), leaveEndTime: d("2025-10-20T13:00:00"), doctorId: BigInt(Number(drPooja))  },
    ],
  });

  console.log("✅ Doctor leaves seeded.\n");

  // ── 14. PATIENT APPOINTMENTS ──────────────────────────────────────────────
  console.log("📋 Seeding patient appointments...");

  // Helper to create one appointment and return its id
  const mkAppt = async (data: Parameters<typeof prisma.appointment.create>[0]["data"]) => {
    const a = await prisma.appointment.create({ data });
    return a.id;
  };

  // ── Future / active appointments (6 BOOKED, 2 ON_GOING, 2 CANCELLED, 1 NO_SHOW)
  const apptIds: Record<string, bigint> = {};

  apptIds.booked2 = await mkAppt({
  appointmentDate: d("2025-09-05"),
  appointmentStartTime: d("2025-09-05T10:00:00"),
  appointmentEndTime: d("2025-09-05T10:20:00"),
  referenceNumber: 'C4U-A7K2P9XM',
  type: 'IN_PERSON',
  status: "BOOKED",
  bookedBy: "SELF",
  cancelledBy: null,
  patientId: BigInt(Number(patNisha)),
  doctorId: BigInt(Number(drPriya)),
  hospitalId: hospMcAhm.id,
});

apptIds.booked3 = await mkAppt({
  appointmentDate: d("2025-09-06"),
  appointmentStartTime: d("2025-09-06T08:30:00"),
  appointmentEndTime: d("2025-09-06T08:45:00"),
  referenceNumber: 'C4U-A7K2P9XN',
  status: "BOOKED",
  type: 'IN_PERSON',
  bookedBy: "STAFF",
  cancelledBy: null,
  patientId: BigInt(Number(patRohan)),
  doctorId: BigInt(Number(drRavi)),
  hospitalId: hospMcAhm.id,
});

apptIds.ongoing1 = await mkAppt({
  appointmentDate: d("2025-09-04"),
  appointmentStartTime: d("2025-09-04T09:00:00"),
  appointmentEndTime: d("2025-09-04T09:15:00"),
  referenceNumber: 'C4U-A7K2P9XO',
  status: "ON_GOING",
  type: 'IN_PERSON',
  bookedBy: "SELF",
  cancelledBy: null,
  patientId: BigInt(Number(patKavya)),
  doctorId: BigInt(Number(drSneha)),
  hospitalId: hospLlSrt.id,
});

apptIds.cancelled1 = await mkAppt({
  appointmentDate: d("2025-09-04"),
  appointmentStartTime: d("2025-09-04T10:00:00"),
  appointmentEndTime: d("2025-09-04T10:15:00"),
  referenceNumber: 'C4U-A7K2P9XP',
  status: "CANCELLED",
  type: 'IN_PERSON',
  bookedBy: "SELF",
  cancelledBy: "SELF",
  patientId: BigInt(Number(patSuresh)),
  doctorId: BigInt(Number(drKaran)),
  hospitalId: hospLlSrt.id,
});

apptIds.noshow1 = await mkAppt({
  appointmentDate: d("2025-09-03"),
  appointmentStartTime: d("2025-09-03T09:00:00"),
  appointmentEndTime: d("2025-09-03T09:15:00"),
  referenceNumber: 'C4U-A7K2P9XQ',
  status: "NO_SHOW",
  type: 'IN_PERSON',
  bookedBy: "SELF",
  cancelledBy: null,
  patientId: BigInt(Number(patDivya)),
  doctorId: BigInt(Number(drArjun)),
  hospitalId: hospMcAhm.id,
});

apptIds.booked4 = await mkAppt({
  appointmentDate: d("2025-09-08"),
  appointmentStartTime: d("2025-09-08T11:00:00"),
  appointmentEndTime: d("2025-09-08T11:15:00"),
  referenceNumber: 'C4U-A7K2P9XR',
  status: "BOOKED",
  type: 'ONLINE',
  bookedBy: "SELF",
  cancelledBy: null,
  patientId: BigInt(Number(patAmit)),
  doctorId: BigInt(Number(drMeera)),
  hospitalId: hospMcAhm.id,
});

apptIds.booked5 = await mkAppt({
  appointmentDate: d("2025-09-08"),
  appointmentStartTime: d("2025-09-08T09:00:00"),
  appointmentEndTime: d("2025-09-08T09:20:00"),
  referenceNumber: 'C4U-A7K2P9XS',
  status: "BOOKED",
  type: 'ONLINE',
  bookedBy: "SELF",
  cancelledBy: null,
  patientId: BigInt(Number(patNisha)),
  doctorId: BigInt(Number(drPooja)),
  hospitalId: hospMcAhm.id,
});

apptIds.booked6 = await mkAppt({
  appointmentDate: d("2025-09-09"),
  appointmentStartTime: d("2025-09-09T10:00:00"),
  appointmentEndTime: d("2025-09-09T10:20:00"),
  referenceNumber: 'C4U-A7K2P9XT',
  status: "BOOKED",
  type: 'IN_PERSON',
  bookedBy: "STAFF",
  cancelledBy: null,
  patientId: BigInt(Number(patRohan)),
  doctorId: BigInt(Number(drSanjay)),
  hospitalId: hospLlSrt.id,
});

apptIds.booked7 = await mkAppt({
  appointmentDate: d("2025-09-10"),
  appointmentStartTime: d("2025-09-10T16:00:00"),
  appointmentEndTime: d("2025-09-10T16:15:00"),
  referenceNumber: 'C4U-A7K2P9XU',
  status: "BOOKED",
  type: 'ONLINE',
  bookedBy: "SELF",
  cancelledBy: null,
  patientId: BigInt(Number(patKavya)),
  doctorId: BigInt(Number(drKaran)),
  hospitalId: hospLlSrt.id,
});

apptIds.ongoing2 = await mkAppt({
  appointmentDate: d("2025-09-04"),
  appointmentStartTime: d("2025-09-04T10:00:00"),
  appointmentEndTime: d("2025-09-04T10:20:00"),
  referenceNumber: 'C4U-A7K2P9XV',
  status: "ON_GOING",
  type: 'ONLINE',
  bookedBy: "SELF",
  cancelledBy: null,
  patientId: BigInt(Number(patSuresh)),
  doctorId: BigInt(Number(drPriya)),
  hospitalId: hospMcAhm.id,
});

apptIds.cancelled2 = await mkAppt({
  appointmentDate: d("2025-09-02"),
  appointmentStartTime: d("2025-09-02T08:30:00"),
  appointmentEndTime: d("2025-09-02T08:45:00"),
  referenceNumber: 'C4U-A7K2P9XW',
  status: "CANCELLED",
  type: 'IN_PERSON',
  bookedBy: "STAFF",
  cancelledBy: "STAFF",
  patientId: BigInt(Number(patDivya)),
  doctorId: BigInt(Number(drRavi)),
  hospitalId: hospMcAhm.id,
});

apptIds.past1 = await mkAppt({
  appointmentDate: d("2025-08-10"),
  appointmentStartTime: d("2025-08-10T09:00:00"),
  appointmentEndTime: d("2025-08-10T09:15:00"),
  referenceNumber: 'C4U-A7K2P9XX',
  status: "BOOKED",
  type: 'ONLINE',
  bookedBy: "SELF",
  cancelledBy: null,
  patientId: BigInt(Number(patAmit)),
  doctorId: BigInt(Number(drArjun)),
  hospitalId: hospMcAhm.id,
});

  apptIds.past2 = await mkAppt({
  appointmentDate: d("2025-08-12"),
  appointmentStartTime: d("2025-08-12T09:00:00"),
  appointmentEndTime: d("2025-08-12T09:15:00"),
  referenceNumber: 'C4U-A7K2P9XY',
  status: "BOOKED",
  type: 'IN_PERSON',
  bookedBy: "SELF",
  cancelledBy: null,
  patientId: BigInt(Number(patNisha)),
  doctorId: BigInt(Number(drSneha)),
  hospitalId: hospLlSrt.id,
});

apptIds.past3 = await mkAppt({
  appointmentDate: d("2025-08-14"),
  appointmentStartTime: d("2025-08-14T10:00:00"),
  appointmentEndTime: d("2025-08-14T10:15:00"),
  referenceNumber: 'C4U-A7K2P9XZ',
  status: "BOOKED",
  type: 'ONLINE',
  bookedBy: "STAFF",
  cancelledBy: null,
  patientId: BigInt(Number(patRohan)),
  doctorId: BigInt(Number(drKaran)),
  hospitalId: hospLlSrt.id,
});

apptIds.past4 = await mkAppt({
  appointmentDate: d("2025-08-18"),
  appointmentStartTime: d("2025-08-18T10:00:00"),
  appointmentEndTime: d("2025-08-18T10:20:00"),
  referenceNumber: 'C4U-A7K2P9XA',
  status: "BOOKED",
  type: 'IN_PERSON',
  bookedBy: "SELF",
  cancelledBy: null,
  patientId: BigInt(Number(patKavya)),
  doctorId: BigInt(Number(drPriya)),
  hospitalId: hospMcAhm.id,
});

apptIds.past5 = await mkAppt({
  appointmentDate: d("2025-08-20"),
  appointmentStartTime: d("2025-08-20T08:00:00"),
  appointmentEndTime: d("2025-08-20T08:20:00"),
  referenceNumber: 'C4U-A7K2P9XB',
  status: "BOOKED",
  type: 'IN_PERSON',
  bookedBy: "SELF",
  cancelledBy: null,
  patientId: BigInt(Number(patSuresh)),
  doctorId: BigInt(Number(drSanjay)),
  hospitalId: hospLlSrt.id,
});

apptIds.past6 = await mkAppt({
  appointmentDate: d("2025-08-22"),
  appointmentStartTime: d("2025-08-22T11:00:00"),
  appointmentEndTime: d("2025-08-22T11:15:00"),
  referenceNumber: 'C4U-A7K2P9XC',
  status: "BOOKED",
  type: 'ONLINE',
  bookedBy: "SELF",
  cancelledBy: null,
  patientId: BigInt(Number(patDivya)),
  doctorId: BigInt(Number(drMeera)),
  hospitalId: hospMcAhm.id,
});

  console.log("✅ Patient appointments seeded.\n");

  // ── 15. MEETINGS ──────────────────────────────────────────────────────────
  console.log("💻 Seeding meetings...");

await prisma.meeting.create({
  data: {
    startTime: d("2025-09-04T09:00:00"),
    link: "https://zoom.us/j/81234567890",
    startUrl: "https://zoom.us/s/81234567890?zak=doctor-token-001",
    joinUrl: "https://zoom.us/j/81234567890",
    password: "123456",
    appointmentId: apptIds.ongoing1,
    doctorId: BigInt(Number(drSneha)),
    patientId: BigInt(Number(patKavya)),
  },
});

await prisma.meeting.create({
  data: {
    startTime: d("2025-09-04T10:00:00"),
    link: "https://zoom.us/j/82345678901",
    startUrl: "https://zoom.us/s/82345678901?zak=doctor-token-002",
    joinUrl: "https://zoom.us/j/82345678901",
    password: "234567",
    appointmentId: apptIds.ongoing2,
    doctorId: BigInt(Number(drPriya)),
    patientId: BigInt(Number(patSuresh)),
  },
});

const meeting3 = await prisma.meeting.create({
  data: {
    startTime: d("2025-08-10T09:00:00"),
    link: "https://zoom.us/j/83456789012",
    startUrl: "https://zoom.us/s/83456789012?zak=doctor-token-003",
    joinUrl: "https://zoom.us/j/83456789012",
    password: "345678",
    appointmentId: apptIds.past1,
    doctorId: BigInt(Number(drArjun)),
    patientId: BigInt(Number(patAmit)),
  },
});

const meeting4 = await prisma.meeting.create({
  data: {
    startTime: d("2025-08-12T09:00:00"),
    link: "https://zoom.us/j/84567890123",
    startUrl: "https://zoom.us/s/84567890123?zak=doctor-token-004",
    joinUrl: "https://zoom.us/j/84567890123",
    password: "456789",
    appointmentId: apptIds.past2,
    doctorId: BigInt(Number(drSneha)),
    patientId: BigInt(Number(patNisha)),
  },
});

  console.log("✅ Meetings seeded.\n");

  // ── 16. MEETING LOGS ──────────────────────────────────────────────────────
  console.log("📝 Seeding meeting logs...");

  await prisma.meetingLogs.createMany({
    data: [
      {
        logs: JSON.stringify({
          events: [
            { time: "09:00:05", event: "patient_joined" },
            { time: "09:00:18", event: "doctor_joined" },
            { time: "09:13:42", event: "patient_left" },
            { time: "09:14:02", event: "doctor_left" },
          ],
          duration_seconds: 838,
          quality: "HD",
        }),
        meetingId: meeting3.id,
      },
      {
        logs: JSON.stringify({
          events: [
            { time: "09:00:10", event: "patient_joined" },
            { time: "09:00:22", event: "doctor_joined" },
            { time: "09:14:55", event: "patient_left" },
            { time: "09:15:00", event: "doctor_left" },
          ],
          duration_seconds: 869,
          quality: "HD",
        }),
        meetingId: meeting4.id,
      },
    ],
  });

  console.log("✅ Meeting logs seeded.\n");

  // ── 17. PRESCRIPTIONS ─────────────────────────────────────────────────────
  console.log("💊 Seeding prescriptions...");

  const prescriptionPayloads = [
    {
      precautions:    "Take Tab. Atorvastatin 40mg at night. Tab. Aspirin 75mg in the morning. Avoid fatty foods, fried items. Daily 30-minute brisk walk mandatory. Follow up after 4 weeks with lipid profile test. No smoking or alcohol.",
      appointmentId: apptIds.past1,
    },
    {
      precautions:    "Tab. Levetiracetam 500mg twice daily — do not skip any dose. Avoid screen exposure for more than 2 hours continuously. Ensure 8 hours of sleep. Avoid stress. Report any episode of seizure immediately. Do not drive.",
      appointmentId: apptIds.past2,
    },
    {
      precautions:    "Knee brace to be worn during walking. Cap. Calcium + Vitamin D3 once daily with breakfast. Avoid climbing stairs for 3 weeks. Physiotherapy session 3 times per week. Apply cold pack to the knee for 15 min twice a day.",
      appointmentId: apptIds.past3,
    },
    {
      precautions:    "Apply Mometasone cream on affected area twice daily for 2 weeks. Tab. Cetirizine 10mg at night for 5 days. Avoid synthetic fabrics. Use fragrance-free soap. Keep skin moisturized. Return if rash persists beyond 2 weeks.",
      appointmentId: apptIds.past4,
    },
    {
      precautions:    "Tab. Amoxicillin 250mg three times a day for 5 days with food. Tab. Paracetamol 500mg for fever above 100F. Plenty of fluids and rest. No school/daycare for 3 days. Follow-up if fever persists beyond 3 days.",
      appointmentId: apptIds.past5,
    },
    {
      precautions:    "Tab. Fluoxetine 20mg every morning with food — may take 2-4 weeks to take effect. Maintain daily activity journal. Weekly CBT sessions recommended. Avoid alcohol completely. Emergency helpline: 9152987821. Follow-up in 3 weeks.",
      appointmentId: apptIds.past6,
    },
  ];

  const createdPrescriptions: bigint[] = [];
  for (const rx of prescriptionPayloads) {
    const p = await prisma.prescription.create({ data: rx });
    createdPrescriptions.push(p.id);
  }

  const [rx1, rx2, rx3, rx4, rx5, rx6] = createdPrescriptions;

  console.log("✅ Prescriptions seeded.\n");

  // ── 18. ATTACHMENTS ───────────────────────────────────────────────────────
  console.log("📎 Seeding attachments...");

  await prisma.attachment.createMany({
    data: [
      { url: "https://storage.hms.com/attachments/rx_001_lipid_report.pdf",  secretKey: "sk_001a", type: "REPORT",       prescriptionId: BigInt(Number(rx1)) },
      { url: "https://storage.hms.com/attachments/rx_001_prescription.pdf",  secretKey: "sk_001b", type: "PRESCRIPTION", prescriptionId: BigInt(Number(rx1)) },
      { url: "https://storage.hms.com/attachments/rx_002_eeg_report.pdf",    secretKey: "sk_002a", type: "REPORT",       prescriptionId: BigInt(Number(rx2)) },
      { url: "https://storage.hms.com/attachments/rx_002_prescription.pdf",  secretKey: "sk_002b", type: "PRESCRIPTION", prescriptionId: BigInt(Number(rx2)) },
      { url: "https://storage.hms.com/attachments/rx_003_xray_knee.pdf",     secretKey: "sk_003a", type: "REPORT",       prescriptionId: BigInt(Number(rx3)) },
      { url: "https://storage.hms.com/attachments/rx_003_prescription.pdf",  secretKey: "sk_003b", type: "PRESCRIPTION", prescriptionId: BigInt(Number(rx3)) },
      { url: "https://storage.hms.com/attachments/rx_004_prescription.pdf",  secretKey: "sk_004a", type: "PRESCRIPTION", prescriptionId: BigInt(Number(rx4)) },
      { url: "https://storage.hms.com/attachments/rx_005_prescription.pdf",  secretKey: "sk_005a", type: "PRESCRIPTION", prescriptionId: BigInt(Number(rx5)) },
      { url: "https://storage.hms.com/attachments/rx_006_prescription.pdf",  secretKey: "sk_006a", type: "PRESCRIPTION", prescriptionId: BigInt(Number(rx6)) },
    ],
  });

  console.log("✅ Attachments seeded.\n");

  // ── 19. BILLINGS ──────────────────────────────────────────────────────────
  console.log("🧾 Seeding billings...");

const billingPayloads = [
  {
    consultationFees: 1500,
    taxRate: 18,
    taxCharges: 270,
    totalAmount: 1770,
    paidBy: "self",
    appointmentId: apptIds.past1,
  },
  {
    consultationFees: 1400,
    taxRate: 18,
    taxCharges: 252,
    totalAmount: 1652,
    paidBy: "self",
    appointmentId: apptIds.past2,
  },
  {
    consultationFees: 1800,
    taxRate: 18,
    taxCharges: 324,
    totalAmount: 2124,
    paidBy: "self",
    appointmentId: apptIds.past3,
  },
  {
    consultationFees: 1000,
    taxRate: 18,
    taxCharges: 180,
    totalAmount: 1180,
    paidBy: "Star Health Insurance",
    appointmentId: apptIds.past4,
  },
  {
    consultationFees: 1300,
    taxRate: 18,
    taxCharges: 234,
    totalAmount: 1534,
    paidBy: "self",
    appointmentId: apptIds.past5,
  },
  {
    consultationFees: 1100,
    taxRate: 18,
    taxCharges: 198,
    totalAmount: 1298,
    paidBy: "HDFC Ergo Insurance",
    appointmentId: apptIds.past6,
  },
];

  const createdBillings: bigint[] = [];
  for (const b of billingPayloads) {
    const billing = await prisma.invoice.create({ data: b });
    createdBillings.push(billing.id);
  }

  const [bill1, bill2, bill3, bill4, bill5, bill6] = createdBillings;

  console.log("✅ Billings seeded.\n");

  // ── 20. PAYMENTS ──────────────────────────────────────────────────────────
  console.log("💳 Seeding payments...");

  const pay1 = await prisma.payment.create({ data: { amount: 1770, type: "UPI",         status: "SUCCESS", invoiceId: BigInt(Number(bill1)) } });
  const pay2 = await prisma.payment.create({ data: { amount: 1652, type: "CARD",        status: "SUCCESS", invoiceId: BigInt(Number(bill2)) } });
  const pay3 = await prisma.payment.create({ data: { amount: 2124, type: "NET_BANKING", status: "SUCCESS", invoiceId: BigInt(Number(bill3)) } });
  const pay4 = await prisma.payment.create({ data: { amount: 1180, type: "CASH",        status: "SUCCESS", invoiceId: BigInt(Number(bill4)) } });
  const pay5 = await prisma.payment.create({ data: { amount: 1534, type: "UPI",         status: "SUCCESS", invoiceId: BigInt(Number(bill5)) } });
  // billing 6: one failed attempt then a successful retry
  const pay6 = await prisma.payment.create({ data: { amount: 1298, type: "CARD",        status: "FAILED",  invoiceId: BigInt(Number(bill6)) } });
  const pay7 = await prisma.payment.create({ data: { amount: 1298, type: "UPI",         status: "SUCCESS", invoiceId: BigInt(Number(bill6)) } });

  console.log("✅ Payments seeded.\n");

  // ── 21. PAYMENT DETAILS ───────────────────────────────────────────────────
  console.log("🏦 Seeding payment details...");

  await prisma.paymentDetails.createMany({
    data: [
      { transcationId: "TXN2025081001", cardNumber: null,       upiId: "amit.shah@okicici",   paymentId: pay1.id },
      { transcationId: "TXN2025081201", cardNumber: "XXXX1234", upiId: null,                  paymentId: pay2.id },
      { transcationId: "TXN2025081401", cardNumber: null,       upiId: null,                  paymentId: pay3.id }, // net banking
      { transcationId: "TXN2025081801", cardNumber: null,       upiId: null,                  paymentId: pay4.id }, // cash
      { transcationId: "TXN2025082001", cardNumber: null,       upiId: "suresh.kumar@oksbi",  paymentId: pay5.id },
      { transcationId: null,            cardNumber: "XXXX5678", upiId: null,                  paymentId: pay6.id }, // failed card attempt
      { transcationId: "TXN2025082201", cardNumber: null,       upiId: "divya.mehta@okhdfc",  paymentId: pay7.id },
    ],
  });

  console.log("✅ Payment details seeded.\n");

  // ── 22. REVIEWS ───────────────────────────────────────────────────────────
  console.log("⭐ Seeding reviews...");

  await prisma.review.createMany({
    data: [
      // Doctor reviews
      { rating: 5, review: "Dr. Arjun Mehta explained everything very patiently. My cholesterol is under control now. Highly recommended!",              patientId: BigInt(Number(patAmit)),   doctorId: BigInt(Number(drArjun)),  hospitalId: null },
      { rating: 5, review: "Excellent neurologist. Dr. Priya Sharma diagnosed my condition accurately. Very empathetic.",                                patientId: BigInt(Number(patNisha)),  doctorId: BigInt(Number(drPriya)),  hospitalId: null },
      { rating: 4, review: "Dr. Ravi Patel is very experienced. My knee pain is much better after following his advice. Long waiting time though.",      patientId: BigInt(Number(patRohan)),  doctorId: BigInt(Number(drRavi)),   hospitalId: null },
      { rating: 5, review: "Dr. Meera Nair is amazing. She diagnosed my skin issue correctly in the first visit itself. Very professional.",             patientId: BigInt(Number(patKavya)),  doctorId: BigInt(Number(drMeera)),  hospitalId: null },
      { rating: 4, review: "Dr. Karan Verma treated my child very gently. He has a great bedside manner with kids. Will definitely visit again.",        patientId: BigInt(Number(patSuresh)), doctorId: BigInt(Number(drKaran)),  hospitalId: null },
      { rating: 3, review: "Dr. Sanjay Gupta is knowledgeable but the consultation was too short. Wish he spent more time explaining the procedure.",    patientId: BigInt(Number(patDivya)),  doctorId: BigInt(Number(drSanjay)), hospitalId: null },
      // Hospital reviews
      { rating: 5, review: "MediCare Ahmedabad has excellent facilities. Clean wards, helpful staff, and the OPD process is very smooth.",               patientId: BigInt(Number(patAmit)),   doctorId: null,     hospitalId: hospMcAhm.id },
      { rating: 4, review: "Lifeline Surat is well-maintained. Parking is a bit of an issue but the doctors are top-notch.",                             patientId: BigInt(Number(patNisha)),  doctorId: null,     hospitalId: hospLlSrt.id },
      { rating: 4, review: "Very professional hospital. The online appointment booking system works seamlessly. Staff were cooperative.",                 patientId: BigInt(Number(patRohan)),  doctorId: null,     hospitalId: hospMcAhm.id },
      { rating: 5, review: "Best hospital in Ahmedabad for cardiology. State-of-the-art equipment and friendly nursing staff.",                          patientId: BigInt(Number(patKavya)),  doctorId: null,     hospitalId: hospMcAhm.id },
    ],
  });

  console.log("✅ Reviews seeded.\n");

  // ── DONE ──────────────────────────────────────────────────────────────────
  console.log("═══════════════════════════════════════════════════════════");
  console.log("✅ HMS Seed complete! Summary:");
  console.log("   blooad_group_list    :  8 rows");
  console.log("   course_list          :  9 rows");
  console.log("   speciality_list      : 12 rows");
  console.log("   credentials          : 20 rows");
  console.log("   hospital_groups      :  2 rows");
  console.log("   hospitals            :  4 rows");
  console.log("   addresses            :  4 rows");
  console.log("   admins               :  2 rows");
  console.log("   doctors              :  8 rows");
  console.log("   staffs               :  3 rows");
  console.log("   patients             :  6 rows");
  console.log("   doctor_degrees       : 18 rows");
  console.log("   doctor_specialities  : 17 rows");
  console.log("   doctor_schedules     :  8 rows");
  console.log("   doctor_leaves        :  6 rows");
  console.log("   patient_appointments : 18 rows");
  console.log("   meetings             :  4 rows");
  console.log("   meeting_logs         :  2 rows");
  console.log("   prescriptions        :  6 rows");
  console.log("   attachments          :  9 rows");
  console.log("   billings             :  6 rows");
  console.log("   payments             :  7 rows");
  console.log("   payment_details      :  7 rows");
  console.log("   reviews              : 10 rows");
  console.log("═══════════════════════════════════════════════════════════");
  console.log("\n🔑 All accounts use password: Password@123");
  console.log("   SUPER_ADMIN → superadmin@hms.com");
  console.log("   ADMIN       → admin@medicare.com / admin@lifeline.com");
  console.log("   DOCTOR      → arjun.mehta@medicare.com  (Cardiology,  ₹1500)");
  console.log("                 priya.sharma@medicare.com (Neurology,   ₹1200)");
  console.log("                 ravi.patel@medicare.com   (Orthopedics, ₹1800)");
  console.log("                 meera.nair@medicare.com   (Dermatology, ₹1000)");
  console.log("                 pooja.desai@medicare.com  (Psychiatry,  ₹1100)");
  console.log("                 sneha.iyer@lifeline.com   (Gynecology,  ₹1400)");
  console.log("                 karan.verma@lifeline.com  (Pediatrics,  ₹1300)");
  console.log("                 sanjay.gupta@lifeline.com (Gen Surgery, ₹2000)");
  console.log("   STAFF       → rahul.singh@medicare.com");
  console.log("                 anjali.kulkarni@medicare.com");
  console.log("                 deepak.joshi@lifeline.com");
  console.log("   PATIENT     → amit.shah@gmail.com / nisha.patel@gmail.com");
  console.log("                 rohan.jain@gmail.com / kavya.reddy@gmail.com");
  console.log("                 suresh.kumar@gmail.com / divya.mehta@gmail.com");
 }

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });