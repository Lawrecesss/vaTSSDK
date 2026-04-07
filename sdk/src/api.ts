import axios, { AxiosInstance } from "axios";
import { JobData, ProcessResult, VideoData } from "./types";

export class VideoAnalyzer {
  private _api: AxiosInstance;
  private _model: string;

  private constructor(baseUrl: string, apiKey?: string, model?: string) {
    this._api = axios.create({
      baseURL: baseUrl,
      headers: {
        Authorization: apiKey ? `Bearer ${apiKey}` : undefined
      }
    });
    this._model = model || "nvidia/nemotron-nano-12b-v2-vl:free";
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

  /** Get result via WebSocket */
  async getResult(jobId: string, desiredResult: string): Promise<ProcessResult> {
    return new Promise(async (resolve, reject) => {
      const response = await this._api.post("/get_result", { jobId, desiredResult });
      const resultReqId = response.data.job_id;
      const ws = new WebSocket(`${this._api.defaults.baseURL?.replace(/^http/, "ws")}/result/${resultReqId}`);

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
