import axios, { AxiosInstance } from "axios";
import { JobData, ProcessResult, VideoData } from "./types";

export class VideoAnalyzer {
  private _api: AxiosInstance;
  private _prompt: string;
  private _model: string;
  private _modelId?: string;

  private constructor(baseUrl: string, apiKey?: string, model?: string, prompt?: string) {
    this._api = axios.create({
      baseURL: baseUrl,
      headers: {
        Authorization: apiKey ? `Bearer ${apiKey}` : undefined
      }
    });
    this._model = model || "default-model";
    this._prompt = prompt || "Analyze the video and provide insights.";
  }

  /** Factory method to create and initialize the client */
  static async create(baseUrl: string, apiKey?: string, model?: string, prompt?: string): Promise<VideoAnalyzer> {
    const client = new VideoAnalyzer(baseUrl, apiKey, model, prompt);
    await client.init(); // automatically create model on backend
    return client;
  }

  /** Initialize backend model for this client */
  private async init() {
    const response = await this._api.post("/models", {
      model: this._model,
      prompt: this._prompt
    });
    this._modelId = response.data.model_id;
  }

  /** Upload a File object from browser */
  async uploadVideo(file: File, metadata?: VideoData): Promise<JobData> {
    if (!this._modelId) throw new Error("Client not initialized");

    const formData = new FormData();
    formData.append("video", file);
    console.log("Uploading video with model:", this._model);
    console.log("Using prompt:", this._prompt);
    console.log("Uploading video with model ID:", this._modelId);
    formData.append("model_id", this._modelId);
    if (metadata) {
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

  /** Get result via WebSocket */
  getResult(jobId: string): Promise<ProcessResult> {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(`${this._api.defaults.baseURL?.replace(/^http/, "ws")}/result/${jobId}`);

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
}
