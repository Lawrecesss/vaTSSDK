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
    console.log(`[SDK Debug] uploadVideo called with file: ${file.name}, size: ${file.size} bytes`);
    console.log(`[SDK Debug] metadata:`, metadata);

    const formData = new FormData();
    formData.append("video", file);
    console.log("[SDK Debug] Uploading video with model:", this._model);
    if (metadata) {
      metadata.model = this._model;
      formData.append("metadata", JSON.stringify(metadata));
      console.log("[SDK Debug] Final metadata being sent:", metadata);
    }

    try {
      console.log(`[SDK Debug] Making upload POST request to: ${this._api.defaults.baseURL}/upload`);
      const response = await this._api.post("/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });
      console.log("[SDK Debug] Upload response received:", response);
      console.log("[SDK Debug] Upload response data:", response.data);

      return {
        jobId: response.data.job_id,
        modelId: response.data.model_id,
        metadata: response.data.metadata,
        video: response.data.video_filename,
        status: response.data.status
      };
    } catch (error) {
      console.error("[SDK Debug] Upload failed:", error);
      console.error("[SDK Debug] Upload error response:", (error as any)?.response?.data);
      throw error;
    }
  }

  private async _requestResult(jobId: string, endpoint: string): Promise<ProcessResult> {
    console.log(`[SDK Debug] _requestResult called with jobId: ${jobId}, endpoint: ${endpoint}`);
    console.log(`[SDK Debug] Making POST request to: ${this._api.defaults.baseURL}/get_result/${endpoint}`);
    console.log(`[SDK Debug] Request body:`, { jobId });

    try {
      const response = await this._api.post(`/get_result/${endpoint}`, { jobId });
      console.log(`[SDK Debug] POST response received:`, response);
      console.log(`[SDK Debug] Response status: ${response.status}`);
      console.log(`[SDK Debug] Response data:`, response.data);

      const resultReqId = response.data.job_id;
      console.log(`[SDK Debug] Extracted resultReqId: ${resultReqId}`);

      const wsUrl = `${this._api.defaults.baseURL?.replace(/^http/, "ws")}/result/${resultReqId}`;
      console.log(`[SDK Debug] Connecting to WebSocket: ${wsUrl}`);

      const ws = new WebSocket(wsUrl);

      return new Promise((resolve, reject) => {
        ws.onopen = () => console.log("[SDK Debug] WebSocket connection opened");

        ws.onmessage = (event) => {
          console.log("[SDK Debug] WebSocket message received:", event.data);
          try {
            const data = JSON.parse(event.data);
            console.log("[SDK Debug] Parsed WebSocket data:", data);
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
            console.log("[SDK Debug] Processed result:", res);
            resolve(res);
            ws.close();
          } catch (parseError) {
            console.error("[SDK Debug] Error parsing WebSocket data:", parseError);
            reject(parseError);
          }
        };

        ws.onerror = (err) => {
          console.error("[SDK Debug] WebSocket error:", err);
          reject(err);
        };

        ws.onclose = (event) => {
          console.log(`[SDK Debug] WebSocket closed with code: ${event.code}, reason: ${event.reason}`);
        };
      });
    } catch (error) {
      console.error(`[SDK Debug] POST request failed:`, error);
      console.error(`[SDK Debug] Error response:`, (error as any)?.response?.data);
      console.error(`[SDK Debug] Error status:`, (error as any)?.response?.status);
      throw error;
    }
  }

  async getCategories(jobId: string): Promise<ProcessResult> {
    console.log(`[SDK Debug] getCategories called with jobId: ${jobId}`);
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
