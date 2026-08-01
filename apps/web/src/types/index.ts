export type Person = {
  id: string;
  fullName: string;
  state: "Rivers" | "Imo" | "Anambra";
  community: string;
  clan: string;
  family: string;
  phoneNumber: string;
  email: string;
  gender: "female" | "male";
};

export type VerificationStatus = "Unrelated" | "Distantly Related" | "Closely Related";

export type KinshipResult = {
  status: VerificationStatus;
  degree: number | null;
  path: string[];
  message: string;
};

export type AppView = "dashboard" | "register" | "tree" | "verify" | "evaluation";
