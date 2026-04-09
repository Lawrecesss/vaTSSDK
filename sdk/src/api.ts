import axios, { AxiosInstance } from "axios";
import { JobData, ProcessResult, VideoData } from "./types";

export class VideoAnalyzer {
  private _api: AxiosInstance;
  private _model: string;
  private _prompt: string;

  private constructor(baseUrl: string, apiKey?: string, model?: string, prompt?: string) {
    this._api = axios.create({
      baseURL: baseUrl,
      headers: {
        Authorization: apiKey ? `Bearer ${apiKey}` : undefined
      }
    });
    this._model = model || "nvidia/nemotron-nano-12b-v2-vl:free";
    this._prompt = prompt || "";
  }

  static async create(baseUrl: string, apiKey?: string, model?: string, prompt?: string): Promise<VideoAnalyzer> {
    return new VideoAnalyzer(baseUrl, apiKey, model, prompt);
  }

  /** Upload a File object from browser */
  async uploadVideo(file: File, metadata?: VideoData): Promise<JobData> {

    const formData = new FormData();
    formData.append("video", file);
    console.log("Uploading video with model:", this._model);
    if (metadata) {
      metadata.model = this._model;
      formData.append("metadata", JSON.stringify(metadata));
    }

    const response = await this._api.post("/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }});
    return {
      jobId: response.data.job_id,
      modelId: response.data.model_id,
      metadata: response.data.metadata,
      video: response.data.video_filename,
      status: response.data.status
    };
  }

  private async _requestResult(jobId: string, endpoint: string): Promise<ProcessResult> {
    const response = await this._api.post(`/get_result/${endpoint}`, { jobId });
    const resultReqId = response.data.job_id;
    const ws = new WebSocket(`${this._api.defaults.baseURL?.replace(/^http/, "ws")}/result/${resultReqId}`);

    return new Promise((resolve, reject) => {
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log("Received data via WebSocket:", data);
        const res: ProcessResult = {
          jobId: jobId,
          id: data.id,
          object: data.object,
          provider: data.provider,
          model: data.model,
          createdAt: data.created,
          result: data.choices ? data.choices[0].message.content : undefined,
          reasoning: data.choices ? data.choices[0].message.reasoning : undefined,
          refusal: data.choices ? data.choices[0].message.refusal : undefined
        };
        resolve(res);
        ws.close();
      };

      ws.onerror = (err) => reject(err);
      ws.onclose = () => console.log("WebSocket closed");
    });
  }

  async getCategories(jobId: string): Promise<ProcessResult> {
    return this._requestResult(jobId, "categorize_only");
  }

  async getCategoriesWithExplanation(jobId: string): Promise<ProcessResult> {
    return this._requestResult(jobId, "categorize_with_explanation");
  }

  async getInsights(jobId: string): Promise<ProcessResult> {
    return this._requestResult(jobId, "get_insights");
  }

  async getTranscript(jobId: string): Promise<ProcessResult> {
    return this._requestResult(jobId, "get_transcript");
  }

  async getAll(jobId: string): Promise<ProcessResult> {
    return this._requestResult(jobId, "all");
  }
}
