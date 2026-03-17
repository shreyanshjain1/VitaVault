import OpenAI from "openai";

export const openai =
  process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim()
    ? new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      })
    : null;

export const OPENAI_MODEL = process.env.OPENAI_MODEL?.trim() || "gpt-5-mini";