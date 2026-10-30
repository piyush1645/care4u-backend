import type { Gender, BloodGroup } from "../../../databases/generated/client.js";

export interface ICreatePatient {
  firstName: string;
  middleName?: string;
  lastName: string;
  gender: Gender;
  dateOfBirth: string;
  bloodGroup: BloodGroup;
  credentialId: bigint;
}

export interface IPatientProfile {
  id: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  fullName: string;
  profilePhoto: string | null;
  gender: Gender;
  dateOfBirth: Date;
  bloodGroup: BloodGroup;
  email: string;
  mobile: string;
  isActive: boolean;
}

export interface IUpdatePatient {
  firstName?: string;
  middleName?: string;
  lastName?: string;
  profilePhoto?: string;
  gender?: Gender;
  dateOfBirth?: string;
  bloodGroup?: BloodGroup;
}