export interface IRegisterDoctorDto {
  email: string;
  mobile: string;
  password: string;

  firstName: string;
  middleName?: string | undefined;
  lastName: string;
  profilePhoto?: string | undefined;

  gender: 'MALE' | 'FEMALE' | 'OTHER';

  dateOfBirth: string; // ISO date string

  preferedLanguages: string;
  expereince?: number | undefined;

  charges: number;
  slotDuration?: number | undefined;

  credentialId: bigint | number;
  hospitalId: bigint | number;

  specialities: IDoctorSpecialityDto[];
  degrees: IDoctorDegreeDto[];
}

export interface IDoctorSpecialityDto {
  name: string;
}

export interface IDoctorDegreeDto {
  courseName: string;
  abbreviation: string;
  institution: string;
  passingYear: number;
}

export interface IUpdationScheduleDto {
  morningStartTime: string;
  morningEndTime: string;
  eveningStartTime: string;
  eveningEndTime: string;
  workingDays: string;
}