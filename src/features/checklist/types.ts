export type ChecklistItem = {
  _id: string;
  text: string;
  isCompleted: boolean;
  checkedBy: string;
  completedAt: string;
  createdAt: string;
  updatedAt: string;
};

export type ChecklistPageData = {
  tripId: string;
  tripName: string;
  isArchived: boolean;
  items: ChecklistItem[];
};
