export type LiveMeeting = {
  id: string;
  url: string;
  active: boolean;
  createdBy: string;
  createdAt: string | null;
  updatedAt: string | null;
};

export type LiveMeetingFormValues = {
  url: string;
  active: boolean;
};
