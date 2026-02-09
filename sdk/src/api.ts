import axios, { AxiosInstance } from 'axios';
import { JobData, ProcessResult } from './types';

export default class va {
  private _api: AxiosInstance;
  private _prompt: string = "";
  private _model: string = "default-model";

  constructor(private baseUrl: string, private apiKey?: string, private model?: string, private prompt?: string) {
    this._api = axios.create({
      baseURL: baseUrl,
      headers: {
        Authorization: apiKey ? `Bearer ${apiKey}` : undefined
      }
    });
    this._model = model || this._model;
    this._prompt = prompt || this._prompt;
  }

  /** Upload a File object from browser */
  async uploadVideo(file: File): Promise<JobData> {
    const formData = new FormData();
    formData.append("video", file); // must match backend parameter name

    const response = await this._api.post("/upload", formData);
    return {
      jobId: response.data.job_id,
      status: response.data.status
    }
}


  /** Get result via WebSocket */
  getResult(jobId: string): Promise<ProcessResult> {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(`${this.baseUrl.replace(/^http/, 'ws')}/result/${jobId}`);

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
        resolve(res); // resolve the promise when first message comes
        ws.close();
      };

      ws.onerror = (err) => reject(err);
      ws.onclose = () => console.log('WebSocket closed');
    });
  }
}
