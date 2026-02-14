export interface JobData {
  jobId: string;
  video?: string;
  metadata?: VideoData;
  modelId: string;
  status: string;
}

export interface VideoData {
  caption: string;
  tags: string[];
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

export const DefaultPrompt = `Analyze the provided video and extract the most important insights that can be derived from its content.
          Focus on identifying key themes, trends, or actionable information that can be useful for understanding the video's subject matter or for making informed decisions based on its content.
          Return the insights in a clear and concise manner, using bullet points if necessary to highlight distinct insights.`;

export const CategoryOnlyPrompt = `Analyze the provided video and determine the best categories that represents its primary content.
          The video must be classified into one or more of the following categories:
          - Sports
          - Music
          - Education
          - Entertainment
          - News
          - Gaming
          - Lifestyle
          - Travel
          - Technology
          - Food
          - Fashion
          - Health
          - Finance
          - Automotive
          - Science
          - History
          - Art
          - Culture
          - Nature
          - Animals
          - Politics
          Base your decision on the main theme, subject matter, and overall focus of the video rather than minor or background elements.
          Return ONLY one or more the category name with comma separated as the final answer.`;
          
export const CategoryWithReasoningPrompt = `Analyze the provided video and determine the best categories that represents its primary content.
          The video must be classified into one or more of the following categories:
          - Sports
          - Music
          - Education
          - Entertainment
          - News
          - Gaming
          - Lifestyle
          - Travel
          - Technology
          - Food
          - Fashion
          - Health
          - Finance
          - Automotive
          - Science
          - History
          - Art
          - Culture
          - Nature
          - Animals
          - Politics

          Base your decision on the main theme, subject matter, and overall focus of the video rather than minor or background elements.

          Return the category name with comma separated as the final answer, and provide a brief reasoning for why you chose that category with 2 new lines separated from the categories. The reasoning should be concise and directly related to the content of the video.`;
          
export const InsightPrompt = `Analyze the provided video and extract the most important insights that can be derived from its content.
          Focus on identifying key themes, trends, or actionable information that can be useful for understanding the video's subject matter or for making informed decisions based on its content.
          Return the insights in a clear and concise manner, using bullet points if necessary to highlight distinct insights.`;
    
export const SummaryPrompt = `Watch the provided video and generate a concise summary that captures the main points and key information presented in the video.
          The summary should be brief yet comprehensive, providing an overview of the video's content without going into excessive detail. Focus on the most important aspects and avoid including minor or irrelevant information.`; 
          
export const TranscriptionPrompt = `Transcribe the spoken content of the provided video into text format.
          The transcription should accurately capture the dialogue, narration, and any other spoken elements in the video. Include timestamps for each segment of text to indicate when it was spoken in the video. Ensure that the transcription is clear and easy to read, while faithfully representing the original audio content.`;

