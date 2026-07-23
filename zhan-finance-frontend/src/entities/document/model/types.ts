export interface DocumentDto {
  id: number;
  userId: number;
  clientName?: string;
  taskId?: number;
  fileName: string;
  contentType: string;
  fileSize: number;
  status: string;
  createdAt: string;
  confirmedAt?: string;
  confirmedIp?: string;
  folder?: string;
}

export interface DocumentUploadResponse {
  id: number;
  fileName: string;
}
