import type { APIRoute, GetStaticPaths } from "astro";
import { EPISODES, type Episode } from "../../data/episodes.ts";
import { episodeMarkdown, markdownResponse } from "../../lib/markdown.ts";

export const getStaticPaths = (() => EPISODES.map((e) => ({ params: { slug: e.slug }, props: { episode: e } }))) satisfies GetStaticPaths;

export const GET: APIRoute<{ episode: Episode }> = ({ props }) => markdownResponse(episodeMarkdown(props.episode));
