export interface JobData {
  jobId: string;
  video?: string;
  metadata?: VideoData;
  modelId: string;
  status: string;
}

export interface VideoData {
  model?: string;
  caption?: string;
  tags?: string[];
  prompt?: string;
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

