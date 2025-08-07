export interface HelpQueryEntity {
  id: string;
  query: string;
  userEmail?: string | null;
  createdAt: Date;
}
