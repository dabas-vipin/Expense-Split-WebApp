import { User } from "./user"

export interface AuthResponse {
  access_token: string
  user: User
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}  