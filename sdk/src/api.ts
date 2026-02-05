import axios, { AxiosInstance } from 'axios';

export default class va {
  private api: AxiosInstance;

  constructor(private baseUrl: string, private apiKey?: string) {
    this.api = axios.create({
      baseURL: baseUrl,
      headers: {
        Authorization: apiKey ? `Bearer ${apiKey}` : undefined
      }
    });
  }

  /** Upload a File object from browser */
  async uploadVideo(file: File): Promise<{ jobId: string; status: string }> {
  const formData = new FormData();
  formData.append("video", file); // must match backend parameter name

  const response = await this.api.post("/upload", formData); // no Content-Type header
  return response.data;
}


  /** Get result via WebSocket */
  getResult(jobId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(`${this.baseUrl.replace(/^http/, 'ws')}/result/${jobId}`);

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        resolve(data); // resolve the promise when first message comes
        ws.close();
      };

      ws.onerror = (err) => reject(err);
      ws.onclose = () => console.log('WebSocket closed');
    });
  }
}
