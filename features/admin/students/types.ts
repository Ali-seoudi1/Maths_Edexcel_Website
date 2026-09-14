export type StudentStatus = "active" | "inactive";

export type Student = {
  uid: string;
  fullName: string;
  email: string;
  studentCode: string;
  yearGroup: string;
  mathTrack: string;
  role: "student";
  active: boolean;
  isTestAccount?: boolean;
  createdAt: string | null;
};

export type CreateStudentResponse = {
  student: Student;
  invitationEmailSent: boolean;
};

export type DeleteStudentResponse = {
  deletedStudentId: string;
};
