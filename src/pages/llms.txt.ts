import { llmsTxt, markdownResponse } from "../lib/markdown.ts";

export const GET = () => markdownResponse(llmsTxt(), "text/plain");
