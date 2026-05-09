// User-related types.
// GoogleUser is populated from the Google OAuth token and stored in AuthContext.
// Employee represents a company staff member fetched from the Employees sheet,
// used in the update form's employee search and on the printed loan slip.

export interface GoogleUser {
  googleId: string;
  email: string;
  name: string;
  imageUrl: string;
  accessToken: string;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  department: string;
}