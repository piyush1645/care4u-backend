export interface IRegisterAdmin {
  firstName: string;
  lastName: string;
  password: string;
  email: string;
  mobile: number;

  gender: 'MALE' | 'FEMALE' | 'OTHER';

  dateOfBirth: string; // ISO date string

  hospitalGroupId: bigint;
}

export interface IAdminData {
  firstName: string;
  lastName: string;
  hashedPassword: string;
  email: string;
  mobile: number;
  gender: 'MALE' | 'FEMALE' | 'OTHER';

  dateOfBirth: string; // ISO date string

  hospitalGroupId: bigint;
}

export interface IUpdateAdminProfile {
  firstName: string;
  lastName: string;
}