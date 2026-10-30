import { Role } from "../../../databases/generated/client.js";

export interface ICreateCredential {
  email: string;
  mobile: string;
  hashedPassword: string;
  role?: Role;
}

export interface ILoginInput {
  email?: string;
  mobile?: string;
  password: string;
}