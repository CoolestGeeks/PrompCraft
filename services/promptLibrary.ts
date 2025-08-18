// services/promptLibrary.ts

export type PromptTemplate = {
  usecase: string;
  prompt: string;
};

export type PromptCategory = {
  app: string;
  templates: PromptTemplate[];
};

export const promptLibrary: PromptCategory[] = [
  {
    app: "General AI",
    templates: [
      {
        usecase: "Brainstorm Ideas",
        prompt: "You are a creative assistant. Brainstorm a list of 10 ideas for a new mobile application in the productivity space. For each idea, provide a brief description and a potential target audience.",
      },
      {
        usecase: "Summarize Text",
        prompt: "You are an expert summarizer. Read the following article and provide a concise summary of the key points in three bullet points. Article: [Paste article text here]",
      },
    ],
  },
  {
    app: "Marketing",
    templates: [
      {
        usecase: "Write Ad Copy",
        prompt: "You are a professional copywriter. Write three versions of ad copy for a new brand of sustainable coffee. The target audience is millennials who are environmentally conscious. The tone should be upbeat and inspiring.",
      },
      {
        usecase: "Social Media Post",
        prompt: "You are a social media manager. Create an engaging Instagram post for a new line of sneakers. Include a catchy caption, relevant hashtags, and a call to action.",
      },
    ],
  },
  {
    app: "Software Engineering",
    templates: [
      {
        usecase: "Explain Code",
        prompt: "You are a senior software engineer with excellent communication skills. Explain the following code snippet to a junior developer. Focus on the logic and the purpose of the code. Code: [Paste code snippet here]",
      },
      {
        usecase: "Generate Documentation",
        prompt: "You are a technical writer. Generate markdown documentation for the following API endpoint. Include the endpoint URL, HTTP method, request parameters, and an example response. Endpoint details: [Paste details here]",
      },
    ],
  },
];
