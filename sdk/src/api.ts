import axios, { AxiosInstance } from "axios";
import { JobData, ProcessResult } from "./types";

export default class VideoAnalyzer {
  private _api: AxiosInstance;
  private _prompt: string;
  private _model: string;
  private _modelId?: string; // backend model reference

  private constructor(baseUrl: string, apiKey?: string, model?: string, prompt?: string) {
    this._api = axios.create({
      baseURL: baseUrl,
      headers: {
        Authorization: apiKey ? `Bearer ${apiKey}` : undefined
      }
    });
    this._model = model || "default-model";
    this._prompt = prompt || "";
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
  async uploadVideo(file: File): Promise<JobData> {
    if (!this._modelId) throw new Error("Client not initialized");

    const formData = new FormData();
    formData.append("video", file);
    formData.append("model_id", this._modelId);

    const response = await this._api.post("/upload", formData);
    return {
      jobId: response.data.job_id,
      status: response.data.status
    };
  }

  /** Get result via WebSocket */
  getResult(jobId: string): Promise<ProcessResult> {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(`${this._api.defaults.baseURL?.replace(/^http/, "ws")}/result/${jobId}`);

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        const res: ProcessResult = {
          jobId: jobId,
          id: data.id,
          object: data.object,
          provider: data.provider,
          model: data.model,
          createdAt: data.created,
          result: data.choices[0].message.content,
          reasoning: data.choices[0].message.reasoning,
          refusal: data.choices[0].message.refusal
        };
        resolve(res);
        ws.close();
      };

      ws.onerror = (err) => reject(err);
      ws.onclose = () => console.log("WebSocket closed");
    });
  }
}
