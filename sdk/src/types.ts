export interface Options {
  userId: string;
  limit?: number;
}

export interface JobData {
  jobId: string;
  status: string;
}

export interface ProcessResult {
  jobId: string;
  id: string;
  object: string;
  provider: string;
  model: string;
  createdAt: number;
  result: string;
  reasoning: string;
  refusal: string;
}
export interface MyData {
  id: string;
  value: string;
}
