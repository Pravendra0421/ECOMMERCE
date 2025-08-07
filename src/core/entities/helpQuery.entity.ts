export interface HelpQueryEntity {
  id: number;
  query: string;
  userEmail?: string | null;
  createdAt: Date;
}
