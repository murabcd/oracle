export interface DescribeImageSuccess {
  description: string;
}

export interface GeneratedMediaSuccess {
  url: string;
  type: string;
  description: string;
}

export interface GeneratedVideoSuccess {
  url: string;
  type: string;
}

export interface ErrorResponse {
  error: string;
}

export interface GenerateImageInput {
  prompt: string;
  modelId: string;
  instructions?: string;
}

export interface EditImageInput {
  images: {
    url: string;
    type: string;
  }[];
  modelId: string;
  instructions?: string;
}

export interface GenerateVideoInput {
  modelId: string;
  prompt: string;
  image?: string;
}
