import { indexMd, markdownResponse } from "../lib/markdown.ts";

export const GET = () => markdownResponse(indexMd());
