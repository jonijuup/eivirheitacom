import "@fontsource/ibm-plex-mono/400.css";
import { ease, interpolate, springTo, useFrame, useVideoInfo, waitFor } from "@intentface-launch/core";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { BEATS, FADE_IN, FADE_OUT, KEYS, type Line, lineAt } from "./script.ts";

// A CRT screen with one line of text on it. The line is drawn into a small 2D
// canvas (the signal) and a blurred copy (the glow); one WebGL pass then does
// what the tube does: curvature, colour fringing, the dot mask and scanlines,
// the glass, bloom and flicker.

/** Text size on screen, in 1080p pixels. */
const SIZE = 128;
const FONT = `400 ${SIZE}px "IBM Plex Mono"`;
/** The signal canvas is at half the frame's resolution, so glyph edges are as soft as a beam. */
const SIGNAL = 2;
/** The glow canvas is at a quarter. */
const GLOW = 4;

// --- The line ---------------------------------------------------------------

/** Blink period (s): on for half, off for half. At 120 BPM, on for a beat and off for a beat. */
const BLINK = 1;
/** Before the first key the caret blinks on the track's beats, and goes out just before typing starts. */
const FIRST_BLINK = BEATS.type - 2 * BLINK;

/** A key restarts the blink, so the caret stays solid while typing. */
function caretOn(t: number, lastKey: number) {
  const since = t - (Number.isFinite(lastKey) ? lastKey : FIRST_BLINK);
  return ((since % BLINK) + BLINK) % BLINK < BLINK / 2;
}

/** Afterglow: the phosphor of a glyph or caret that has just gone out fades over a few frames. */
const PERSIST = [1, 0.45, 0.18, 0.06];

// --- The tube ---------------------------------------------------------------

const VERTEX = `#version 300 es
in vec2 p;
out vec2 uv;
void main() { uv = p * 0.5 + 0.5; gl_Position = vec4(p, 0.0, 1.0); }`;

const FRAGMENT = `#version 300 es
precision highp float;
in vec2 uv;
out vec4 color;
uniform sampler2D signal;
uniform sampler2D glow;
uniform vec2 res;        // output size in device pixels
uniform float px;        // device pixels per 1080p pixel
uniform float frame;
uniform float fade;
uniform float bloom;
uniform float zoom;
uniform float mask;      // 0 smooth, 1 full phosphor dots

const float DOT = 4.0;   // phosphor pitch, in 1080p pixels
const vec3 PHOSPHOR = vec3(1.0, 0.975, 0.94);
const vec3 HALO = vec3(1.0, 0.92, 0.82);
const vec3 GLASS = vec3(0.066, 0.07, 0.068);

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

// Barrel distortion: the picture bulges towards the viewer like a tube's face.
vec2 curve(vec2 q) {
  vec2 c = (q * 2.0 - 1.0) / zoom;
  c *= 1.0 + vec2(0.028, 0.045) * (c.yx * c.yx);
  return c * 0.5 + 0.5;
}

// Inside the screen's rounded rectangle (in units of the frame's height), with a soft edge.
float screen(vec2 q) {
  vec2 aspect = vec2(res.x / res.y, 1.0);
  const float R = 0.07;
  vec2 d = abs((q - 0.5) * aspect) - (0.5 * aspect - R);
  float dist = length(max(d, 0.0)) + min(max(d.x, d.y), 0.0) - R;
  return 1.0 - smoothstep(-0.003, 0.003, dist);
}

void main() {
  // Phosphor dots on a fixed grid (the frame's pixels, so no moire under the
  // curve). The signal itself is sampled per pixel, so glyphs keep their shape
  // and the dots only texture them.
  float pitch = DOT * px;
  vec2 cell = floor(gl_FragCoord.xy / pitch);
  vec2 within = (gl_FragCoord.xy - (cell + 0.5) * pitch) / pitch;
  vec2 q = curve(uv);
  vec2 c = q - 0.5;

  // Colour fringing, soft: red lands a little left, blue a little right, more towards the edges.
  vec2 fringe = vec2(1.4 / 1920.0, 0.0) + c * vec2(0.0016, 0.0008);
  float r = (texture(signal, q + fringe).r + texture(signal, q + 0.5 * fringe).r) * 0.5;
  float g = texture(signal, q).r;
  float b = (texture(signal, q - fringe).r + texture(signal, q - 0.5 * fringe).r) * 0.5;
  // An analog signal smears a little to the right: the beam takes time to switch off.
  float smear = 0.0;
  for (float i = 1.0; i <= 4.0; i++) smear += texture(signal, q - vec2(i * 2.0 / 1920.0, 0.0)).g * exp(-i * 0.7);
  vec3 beam = (vec3(r, g, b) + smear * 0.18) * PHOSPHOR;

  // The glass is never black: a faint phosphor floor, lit a little more in the middle.
  float centre = pow(clamp(16.0 * q.x * q.y * (1.0 - q.x) * (1.0 - q.y), 0.0, 1.0), 0.25);
  vec3 glass = GLASS * mix(0.6, 1.1, centre);

  // A slow roll bar, as when a CRT is filmed, and a faint flicker per frame.
  float roll = exp(-pow((fract(q.y + frame / 60.0 * 0.11) - 0.5) * 7.0, 2.0));
  float flicker = 1.0 + (hash(vec2(floor(frame), 7.0)) - 0.5) * 0.02;
  float light = (1.0 + roll * 0.05) * flicker;
  beam *= light;

  // The text is drawn in phosphor dots and scanlines; a bright beam spreads
  // each dot until its neighbours merge, so cores read solid. The glass stays
  // smooth: video compression would only smear a texture there.
  float lum = dot(beam, vec3(0.3, 0.59, 0.11));
  float spread = mix(0.3, 0.62, smoothstep(0.1, 0.9, lum));
  float spot = exp(-dot(within, within) / (2.0 * spread * spread));
  // Normalised so the dots keep the picture's average brightness.
  float norm = 2.0 * 3.14159 * spread * spread;
  float dots = min(spot / min(norm, 1.0), 1.6);
  beam *= mix(1.0, dots, mask);

  vec3 halo = texture(glow, q).rgb * HALO * bloom * light;
  halo *= mix(1.0, dots, mask * 0.3);

  vec3 outc = (glass * light + beam + halo) * centre * screen(q);
  // A dither too faint to see as grain, so the glow's falloff does not band.
  outc += (hash(gl_FragCoord.xy + floor(frame) * 17.13) - 0.5) * (1.5 / 255.0);
  color = vec4(max(outc, 0.0) * fade, 1.0);
}`;

type Gpu = {
  gl: WebGL2RenderingContext;
  uniforms: Record<string, WebGLUniformLocation | null>;
  signal: WebGLTexture;
  glow: WebGLTexture;
};

function createGpu(canvas: HTMLCanvasElement): Gpu {
  const gl = canvas.getContext("webgl2", { preserveDrawingBuffer: true, antialias: false, alpha: false });
  if (!gl) throw new Error("CRT: no WebGL2");
  const shader = (type: number, src: string) => {
    const s = gl.createShader(type) as WebGLShader;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(`CRT shader: ${gl.getShaderInfoLog(s)}`);
    return s;
  };
  const program = gl.createProgram();
  gl.attachShader(program, shader(gl.VERTEX_SHADER, VERTEX));
  gl.attachShader(program, shader(gl.FRAGMENT_SHADER, FRAGMENT));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS))
    throw new Error(`CRT program: ${gl.getProgramInfoLog(program)}`);
  gl.useProgram(program);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const p = gl.getAttribLocation(program, "p");
  gl.enableVertexAttribArray(p);
  gl.vertexAttribPointer(p, 2, gl.FLOAT, false, 0, 0);
  const texture = (unit: number) => {
    const t = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return t;
  };
  const signal = texture(0);
  const glow = texture(1);
  const uniforms: Gpu["uniforms"] = {};
  for (const name of ["signal", "glow", "res", "px", "frame", "fade", "bloom", "zoom", "mask"]) {
    uniforms[name] = gl.getUniformLocation(program, name);
  }
  gl.uniform1i(uniforms.signal, 0);
  gl.uniform1i(uniforms.glow, 1);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  return { gl, uniforms, signal, glow };
}

/** Holds the frame until the font has loaded, and re-renders before letting it go. */
function useFont() {
  const [ready, setReady] = useState(() => document.fonts.check(FONT));
  useLayoutEffect(() => {
    if (ready) return;
    waitFor(
      document.fonts.load(FONT).then(() => flushSync(() => setReady(true))),
      "CRT font",
    );
  }, [ready]);
  return ready;
}

export function Crt({ mask = 0.5 }: { mask?: number }) {
  const frame = useFrame();
  const { fps, width, height } = useVideoInfo();
  const ready = useFont();
  const canvas = useRef<HTMLCanvasElement>(null);
  const gpu = useRef<Gpu | null>(null);
  const layers = useMemo(() => {
    const make = (scale: number) => {
      const c = document.createElement("canvas");
      c.width = width / scale;
      c.height = height / scale;
      return c.getContext("2d", { willReadFrequently: false }) as CanvasRenderingContext2D;
    };
    return { signal: make(SIGNAL), glow: make(GLOW) };
  }, [width, height]);

  // The line glides to stay centred as it grows: one spring per change of length.
  const advance = useMemo(() => {
    layers.signal.font = FONT;
    // A little tracking, so a caret inside a word sits in a gap, not on a stem.
    return (ready ? layers.signal.measureText("0").width : SIZE * 0.6) + SIZE * 0.04;
  }, [layers, ready]);
  const centreTargets = useMemo(() => {
    const targets = [{ at: 0, to: 0 }];
    let length = 0;
    for (const key of KEYS) {
      const next = lineAt(key.at).glyphs.length;
      if (next !== length) targets.push({ at: key.at * fps, to: next });
      length = next;
    }
    return targets;
  }, [fps]);

  useLayoutEffect(() => {
    if (!ready || !canvas.current) return;
    gpu.current ??= createGpu(canvas.current);
    const { gl, uniforms, signal, glow } = gpu.current;
    const t = frame / fps;

    const length = springTo(frame, fps, centreTargets, { duration: 0.8 * fps });
    const left = width / 2 - (length * advance) / 2;
    const baseline = height / 2 + SIZE * 0.36;

    // The signal: the line now, over the fading afterglow of the last few frames.
    const s = layers.signal;
    s.setTransform(1 / SIGNAL, 0, 0, 1 / SIGNAL, 0, 0);
    s.globalCompositeOperation = "source-over";
    s.globalAlpha = 1;
    s.fillStyle = "#000";
    s.fillRect(0, 0, width, height);
    s.font = FONT;
    s.textBaseline = "alphabetic";
    s.globalCompositeOperation = "lighten";
    const draw = (line: Line, at: number, alpha: number) => {
      s.globalAlpha = alpha;
      s.fillStyle = "#fff";
      for (const [i, g] of line.glyphs.entries()) s.fillText(g.char, left + i * advance + SIZE * 0.02, baseline);
      if (caretOn(at, line.lastKey)) s.fillRect(left + line.caret * advance - 3, baseline - SIZE * 0.8, 7, SIZE * 1.0);
    };
    for (let k = PERSIST.length - 1; k >= 0; k--) {
      const at = t - k / 60;
      draw(lineAt(at), at, PERSIST[k]);
    }

    // The glow: the signal blurred at three sizes, and a strike on each glyph as it is typed.
    const g = layers.glow;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.globalCompositeOperation = "source-over";
    g.globalAlpha = 1;
    g.filter = "none";
    g.fillStyle = "#000";
    g.fillRect(0, 0, g.canvas.width, g.canvas.height);
    g.globalCompositeOperation = "lighter";
    for (const [blur, alpha] of [
      [1.5, 0.55],
      [5, 0.45],
      [16, 0.4],
    ]) {
      g.filter = `blur(${blur}px)`;
      g.globalAlpha = alpha;
      g.drawImage(s.canvas, 0, 0, g.canvas.width, g.canvas.height);
    }
    g.filter = "blur(3px)";
    g.setTransform(1 / GLOW, 0, 0, 1 / GLOW, 0, 0);
    g.font = FONT;
    g.fillStyle = "#fff";
    const now = lineAt(t);
    for (const [i, glyph] of now.glyphs.entries()) {
      const strike = Math.exp(-(t - glyph.born) / 0.09);
      if (strike < 0.01) continue;
      g.globalAlpha = 0.7 * strike;
      g.fillText(glyph.char, left + i * advance + SIZE * 0.02, baseline);
    }
    g.filter = "none";

    const dpr = canvas.current.width / width;
    gl.viewport(0, 0, canvas.current.width, canvas.current.height);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, signal);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, s.canvas);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, glow);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, g.canvas);

    // The full stop lands on the hit: the tube flares and settles.
    const hit = t < BEATS.stop ? 0 : Math.exp(-(t - BEATS.stop) / 0.35) * Math.min(1, (t - BEATS.stop) / 0.03);
    const fade =
      interpolate(t, [...FADE_IN], [0, 1], { easing: ease.soft }) *
      interpolate(t, [...FADE_OUT], [1, 0], { easing: ease.soft });
    gl.uniform2f(uniforms.res, canvas.current.width, canvas.current.height);
    gl.uniform1f(uniforms.px, dpr);
    gl.uniform1f(uniforms.frame, frame);
    gl.uniform1f(uniforms.fade, fade);
    gl.uniform1f(uniforms.bloom, 1 + 0.9 * hit);
    // A slow push over the whole intro, so the frame never sits still.
    gl.uniform1f(uniforms.zoom, interpolate(t, [0, FADE_OUT[1]], [1, 1.06], { easing: ease.inOut }) + 0.004 * hit);
    gl.uniform1f(uniforms.mask, mask);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  });

  const dpr = typeof window === "undefined" ? 1 : window.devicePixelRatio;
  return (
    <canvas
      ref={canvas}
      width={width * dpr}
      height={height * dpr}
      style={{ position: "absolute", inset: 0, width, height, display: "block" }}
    />
  );
}
