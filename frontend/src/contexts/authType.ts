export type TUser = {
  _id: string;
  auth: "owner" | "admin" | "manager" | "member";
  userId: string;
  userName: string;
  schools: {
    school: string;
    schoolId: string;
    schoolName: string;
  }[];
  tel?: string;
  email?: string;
  snsId?: { google: string };
  profile?: string;
  academyId: string;
  academyName: string;
  //____________________//
  registrations: TRegistration[];
};

export type TSchool = {
  _id: string;
  school: string;
  schoolId: string;
  schoolName: string;
  formArchive: {
    label: string;
    dataType: "array" | "object";
    fields: any[];
    authTeacher: "undefined" | "viewAndEditStudents" | "viewAndEditMyStudents";
    authStudent: "undefined" | "view";
  }[];
  links: {
    url: string;
    title: string;
  }[];
};

export type TRegistration = {
  _id: string;
  school: string;
  season: string;
  period?: {
    start: string;
    end: string;
  };
  year: string;
  term: string;
  isActivated: boolean;
  role: "teacher" | "student";
  memos: any[];
};

export type TSeason = {
  _id: string;
  classrooms: string[];
  subjects: {
    label: string[];
    data: string[][];
  };
  year: string;
  term: string;
  permissionSyllabus: [[]];
  permissionEnrollment: [[]];
  permissionEvaluation: [[]];
  formTimetable: any;
  formSyllabus: any;
  formEvaluation: any[];
  isActivated: boolean;
  //____________________//
  registrations: TRegistration[];
};