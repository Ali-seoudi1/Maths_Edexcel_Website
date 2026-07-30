export type StudentStatus = "active" | "inactive";

export type Student = {
  uid: string;
  fullName: string;
  email: string;
  role: "student";
  active: boolean;
  createdAt: string | null;
};

export type CreateStudentResponse = {
  student: Student;
  temporaryPassword: string;
};
