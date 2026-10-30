export interface CreateStaffDto {
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  mobile: string;
  password: string;
  gender: 'MALE' | 'FEMALE';
  profilePhoto?: string;
  dateOfBirth: string | Date;
  hospitalId: string; // specific branch within the hospital group
}

export interface UpdateStaffDto {
  firstName?: string;
  middleName?: string;
  lastName?: string;
  email?: string;
  mobile?: string;
  gender?: 'MALE' | 'FEMALE';
  profilePhoto?: string;
  dateOfBirth?: string | Date;
  hospitalId?: string | bigint;
}
