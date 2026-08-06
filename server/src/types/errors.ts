export type ApiErrorResponseBody = {
  code: string;
  message: string;
  targetInput?: string;
};

export interface ApiErrorResponse extends Error {
  status?: number;
  body?: ApiErrorResponseBody;
}

export interface DatabaseError extends Error {
  code: string;
  constraint: string;
}
