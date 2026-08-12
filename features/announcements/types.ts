export type Announcement = {
  id: string;
  title: string;
  message: string;
  published: boolean;
  createdBy: string;
  createdAt: string | null;
  updatedAt: string | null;
};

export type AnnouncementFormValues = {
  title: string;
  message: string;
  published: boolean;
};
