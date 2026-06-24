export interface DocumentDto {
  id: number;
  userId: number;
  fileName: string;
  contentType: string;
  fileSize: number;
  createdAt: string;
}

export interface DocumentUploadResponse {
  id: number;
  fileName: string;
}
