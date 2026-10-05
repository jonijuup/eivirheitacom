import { llmsFullTxt, markdownResponse } from "../lib/markdown.ts";

export const GET = () => markdownResponse(llmsFullTxt(), "text/plain");
