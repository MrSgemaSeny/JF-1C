export interface NotificationDto {
  id: number;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  createdAt: string;
}
