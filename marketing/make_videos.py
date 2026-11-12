# -*- coding: utf-8 -*-
"""
Camello Online — Generador de videos publicitarios (TikTok + IG).
Estética: fondo aurora, tipografía cinética Poppins, subtítulos quemados, música synth.
Salida: MP4 1080x1920 (9:16) y 1080x1080 (1:1) con audio.
"""
import os, math, subprocess, tempfile, shutil, wave
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import imageio_ffmpeg

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(ROOT, "salida")
FONT_DIR = os.path.join(ROOT, "fonts")
os.makedirs(OUT, exist_ok=True)
FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()

def F(name, size):
    return ImageFont.truetype(os.path.join(FONT_DIR, name), size)

# ---------------- paleta ----------------
INK      = (13, 9, 28)        # fondo
WHITE    = (255, 255, 255)
AMBER    = (245, 158, 11)
ORANGE   = (255, 122, 0)
PINK     = (255, 77, 141)
CORAL    = (255, 107, 107)
TEAL     = (0, 201, 167)
EMERALD  = (34, 197, 94)
SLATE    = (168, 176, 196)

SITE = "camelloonline.com"
COUNT = "+1.900"

# ---------------- helpers de texto ----------------
def text_img(text, font, fill):
    tmp = Image.new("RGB", (4, 4))
    d = ImageDraw.Draw(tmp)
    bb = d.textbbox((0, 0), text, font=font)
    w, h = bb[2] - bb[0], bb[3] - bb[1]
    img = Image.new("RGBA", (w + 16, h + 16), (0, 0, 0, 0))
    ImageDraw.Draw(img).text((8 - bb[0], 8 - bb[1]), text, font=font, fill=fill)
    return img

def gradient_text(text, font, top, bottom):
    white = text_img(text, font, (255, 255, 255, 255))
    w, h = white.size
    grad = Image.new("RGBA", (w, h))
    px = grad.load()
    for y in range(h):
        t = y / max(1, h - 1)
        c = tuple(int(top[i] + (bottom[i] - top[i]) * t) for i in range(3)) + (255,)
        for x in range(w):
            px[x, y] = c
    grad.putalpha(white.split()[3])
    return grad

def paste(base, layer, cx, y, scale=1.0, alpha=1.0):
    if scale != 1.0:
        nw = max(1, int(layer.width * scale)); nh = max(1, int(layer.height * scale))
        layer = layer.resize((nw, nh), Image.LANCZOS)
    if alpha < 1.0:
        r, g, b, a = layer.split()
        a = a.point(lambda p: int(p * alpha))
        layer = Image.merge("RGBA", (r, g, b, a))
    base.alpha_composite(layer, (int(cx - layer.width / 2), int(y - layer.height / 2)))

def ease(t):
    t = max(0.0, min(1.0, t))
    return 1 - (1 - t) ** 3

# ---------------- fondo aurora ----------------
def make_aurora(W, H, seed=0):
    base = Image.new("RGBA", (W, H), INK + (255,))
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ld = ImageDraw.Draw(layer)
    blobs = [
        (AMBER,  W*0.22, H*0.18, W*0.60),
        (CORAL,  W*0.85, H*0.38, W*0.55),
        (PINK,   W*0.30, H*0.62, W*0.55),
        (TEAL,   W*0.80, H*0.80, W*0.50),
        (ORANGE, W*0.10, H*0.90, W*0.50),
    ]
    for col, cx, cy, r in blobs:
        ld.ellipse((cx-r, cy-r, cx+r, cy+r), fill=col + (70,))
    layer = layer.filter(ImageFilter.GaussianBlur(int(W*0.10)))
    base.alpha_composite(layer)
    # viñeta suave
    v = Image.new("L", (W, H), 0)
    vd = ImageDraw.Draw(v)
    vd.ellipse((-W*0.3, -H*0.2, W*1.3, H*1.2), fill=255)
    v = v.filter(ImageFilter.GaussianBlur(int(W*0.18)))
    dark = Image.new("RGBA", (W, H), (5, 3, 12, 180))
    base.paste(dark, (0, 0), v)
    return base.convert("RGB")

# ---------------- música ----------------
def make_music(duration, sr=44100):
    n = int(sr * duration)
    mix = np.zeros(n, dtype=np.float64)
    bpm = 90.0
    beat = 60.0 / bpm
    prog = [
        (110.00, [220.00, 261.63, 329.63]),
        (87.31,  [174.61, 220.00, 261.63]),
        (98.00,  [196.00, 246.94, 293.66]),
        (82.41,  [164.81, 196.00, 246.94]),
    ]
    def add(sig, start):
        i = int(start * sr)
        if i >= n: return
        j = min(n, i + len(sig))
        mix[i:j] += sig[:j - i]

    rng = np.random.default_rng(7)
    for bi in range(int(duration / beat) + 2):
        bstart = bi * beat
        root, triad = prog[(bi // 4) % 4]
        # pad (por compás)
        if bi % 4 == 0:
            dur = min(4 * beat, duration - bstart)
            if dur > 0:
                tt = np.arange(int(dur * sr)) / sr
                pad = np.zeros_like(tt)
                for f in triad:
                    pad += np.sin(2*np.pi*f*tt) * 0.11
                    pad += np.sin(2*np.pi*f*2.006*tt) * 0.045
                env = np.minimum(1, tt/0.6) * np.minimum(1, (dur-tt)/0.6)
                pad *= env
                add(pad * 0.55, bstart)
        # kick
        kd = 0.16; kt = np.arange(int(kd*sr))/sr
        freq = 130 * np.exp(-kt*30)
        kick = np.sin(2*np.pi*np.cumsum(freq)/sr) * np.exp(-kt*20) * 0.85
        add(kick, bstart)
        # bass
        bd = 0.35; bt = np.arange(int(bd*sr))/sr
        add(np.sin(2*np.pi*root*bt) * np.exp(-bt*7) * 0.22, bstart)
        # hat off-beat
        hd = 0.05; ht = np.arange(int(hd*sr))/sr
        add((rng.standard_normal(len(ht))) * np.exp(-ht*80) * 0.14, bstart + beat*0.5)
        # arpegio pluck 16ths
        for k in range(4):
            p = bstart + k*beat/4
            if p >= duration: break
            pd = 0.22; pt = np.arange(int(pd*sr))/sr
            f = triad[k % len(triad)] * 2
            add(np.sin(2*np.pi*f*pt) * np.exp(-pt*11) * 0.11, p)
    mix = mix / (np.max(np.abs(mix)) + 1e-9) * 0.8
    stereo = np.stack([mix, mix], axis=1)
    return (stereo * 32767).astype(np.int16)

def write_wav(path, pcm, sr=44100):
    with wave.open(path, "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(sr)
        w.writeframes(pcm.tobytes())

# ---------------- render de video ----------------
def render_video(size, beats, out_name, fps=30, beat_dur=1.5):
    W, H = size
    bg = make_aurora(W, H)
    total = len(beats) * beat_dur
    frames_dir = tempfile.mkdtemp(prefix="cml_")
    try:
        fi = 0
        for bi, beat in enumerate(beats):
            nframes = int(beat_dur * fps)
            for k in range(nframes):
                t = k / max(1, nframes - 1)
                frame = bg.convert("RGBA")
                # barra de progreso (top)
                prog = min(1.0, (bi + t) / len(beats))
                ImageDraw.Draw(frame).rounded_rectangle(
                    (0, 0, int(W*prog), 14), radius=7, fill=AMBER + (255,))
                # headline lines (pop-in escalonado)
                for li, ln in enumerate(beat["lines"]):
                    start = li * 0.10
                    dur = 0.32
                    p = (t - start) / dur
                    if p < 0: continue
                    e = ease(p)
                    scale = 1.25 - 0.25 * e
                    alpha = e
                    if ln.get("grad"):
                        layer = gradient_text(ln["text"], F(ln["font"], ln["size"]), ln["g1"], ln["g2"])
                    else:
                        layer = text_img(ln["text"], F(ln["font"], ln["size"]), ln["color"] + (255,))
                    paste(frame, layer, W//2, ln["y"], scale, alpha)
                # subtítulo (aparece y se va)
                sub = beat.get("sub")
                if sub:
                    a = 0.0
                    if 0.10 <= t <= 0.85:
                        a = ease(min(1.0, (t - 0.10) / 0.15))
                        if t > 0.75: a = ease((0.85 - t) / 0.10)
                    if a > 0:
                        sl = text_img(sub, F("Poppins-SemiBold.ttf", 52), WHITE + (255,))
                        pad = 26
                        bar = Image.new("RGBA", (sl.width + pad*2, sl.height + pad*2), (0, 0, 0, 0))
                        ImageDraw.Draw(bar).rounded_rectangle(
                            (0, 0, bar.width, bar.height), radius=18, fill=(0, 0, 0, 170))
                        bar.alpha_composite(sl, (pad, pad))
                        paste(frame, bar, W//2, H - 200, 1.0, a)
                # marca de agua
                wm = text_img(SITE, F("Poppins-Medium.ttf", 36), (255,255,255,120))
                frame.alpha_composite(wm, (int(W//2 - wm.width/2), H - 90))
                frame.convert("RGB").save(os.path.join(frames_dir, f"{fi:05d}.png"))
                fi += 1
        # audio
        wav = os.path.join(frames_dir, "music.wav")
        write_wav(wav, make_music(total))
        out = os.path.join(OUT, out_name)
        subprocess.run([
            FFMPEG, "-y", "-framerate", str(fps), "-i",
            os.path.join(frames_dir, "%05d.png"),
            "-i", wav, "-c:v", "libx264", "-pix_fmt", "yuv420p",
            "-c:a", "aac", "-b:a", "160k", "-shortest",
            "-movflags", "+faststart", "-crf", "19", out
        ], check=True, capture_output=True)
        print("VIDEO_OK", out, "frames=", fi)
    finally:
        shutil.rmtree(frames_dir, ignore_errors=True)

# ---------------- contenido (beats) ----------------
def L(text, y, font="Poppins-Black.ttf", size=130, color=WHITE, grad=False, g1=AMBER, g2=PINK):
    return {"text": text, "y": y, "font": font, "size": size, "color": color, "grad": grad, "g1": g1, "g2": g2}

BRAND = [
    {"lines": [L("CAMELLO ONLINE", 760, size=110, grad=True, g1=AMBER, g2=ORANGE),
               L(SITE, 900, font="Poppins-Bold.ttf", size=60, color=WHITE)],
     "sub": "Entra gratis → camelloonline.com"},
]

def hook_camello():
    return [
        {"lines": [L("¿BUSCAS", 620, font="Poppins-SemiBold.ttf", size=110, color=SLATE),
                   L("CAMELLO?", 760, size=200, grad=True, g1=AMBER, g2=ORANGE)],
         "sub": "¿Buscas camello? Quédate, esto te interesa"},
        {"lines": [L("TRABAJO REMOTO", 660, size=120, color=WHITE),
                   L("en DÓLARES", 800, size=140, grad=True, g1=TEAL, g2=EMERALD)],
         "sub": "Trabajo remoto pagado en dólares"},
        {"lines": [L("¿SIN EXPERIENCIA?", 660, size=115, color=WHITE),
                   L("también hay", 800, font="Poppins-Bold.ttf", size=90, color=SLATE),
                   L("para primer empleo", 900, font="Poppins-Bold.ttf", size=90, grad=True, g1=AMBER, g2=ORANGE)],
         "sub": "Vacantes sin experiencia y para primer empleo"},
        {"lines": [L(COUNT, 700, size=300, grad=True, g1=AMBER, g2=PINK),
                   L("vacantes activas en Colombia", 900, font="Poppins-SemiBold.ttf", size=58, color=WHITE)],
         "sub": COUNT + " vacantes activas en Colombia"},
        {"lines": [L("100% GRATIS", 700, size=150, grad=True, g1=TEAL, g2=EMERALD),
                   L("y verificadas", 850, font="Poppins-Bold.ttf", size=80, color=WHITE)],
         "sub": "Cero costos. Vacantes verificadas"},
    ] + BRAND

def hook_dolares():
    return [
        {"lines": [L("GANA EN", 640, font="Poppins-SemiBold.ttf", size=130, color=WHITE),
                   L("DÓLARES", 800, size=200, grad=True, g1=TEAL, g2=EMERALD)],
         "sub": "Trabaja remoto y cobra en dólares"},
        {"lines": [L("DESDE", 660, font="Poppins-SemiBold.ttf", size=120, color=SLATE),
                   L("COLOMBIA", 800, size=160, color=WHITE)],
         "sub": "Sin salir de Colombia"},
        {"lines": [L("REMOTO", 660, size=150, color=WHITE),
                   L("100%", 800, size=150, grad=True, g1=AMBER, g2=ORANGE)],
         "sub": "Vacantes 100% remotas"},
        {"lines": [L(COUNT, 700, size=300, grad=True, g1=AMBER, g2=PINK),
                   L("vacantes activas", 900, font="Poppins-SemiBold.ttf", size=58, color=WHITE)],
         "sub": COUNT + " vacantes activas en Colombia"},
        {"lines": [L("100% GRATIS", 700, size=150, grad=True, g1=TEAL, g2=EMERALD),
                   L("y verificadas", 850, font="Poppins-Bold.ttf", size=80, color=WHITE)],
         "sub": "Cero costos. Vacantes verificadas"},
    ] + BRAND

def hook_primer_empleo():
    return [
        {"lines": [L("¿PRIMER", 640, font="Poppins-SemiBold.ttf", size=130, color=WHITE),
                   L("EMPLEO?", 800, size=200, grad=True, g1=AMBER, g2=ORANGE)],
         "sub": "¿Buscas tu primer empleo? Esto es para ti"},
        {"lines": [L("SIN EXPERIENCIA", 640, size=115, color=WHITE),
                   L("también hay", 790, font="Poppins-Bold.ttf", size=90, grad=True, g1=TEAL, g2=EMERALD)],
         "sub": "Vacantes sin experiencia"},
        {"lines": [L("PRÁCTICAS", 640, size=130, color=WHITE),
                   L("y SENA", 790, size=140, grad=True, g1=AMBER, g2=ORANGE)],
         "sub": "Prácticas, aprendices y SENA"},
        {"lines": [L(COUNT, 700, size=300, grad=True, g1=AMBER, g2=PINK),
                   L("vacantes activas", 900, font="Poppins-SemiBold.ttf", size=58, color=WHITE)],
         "sub": COUNT + " vacantes activas en Colombia"},
        {"lines": [L("100% GRATIS", 700, size=150, grad=True, g1=TEAL, g2=EMERALD),
                   L("y verificadas", 850, font="Poppins-Bold.ttf", size=80, color=WHITE)],
         "sub": "Cero costos. Vacantes verificadas"},
    ] + BRAND

def hook_verificadas_square():
    return [
        {"lines": [L("VACANTES", 420, size=130, color=WHITE),
                   L("VERIFICADAS", 580, size=120, grad=True, g1=TEAL, g2=EMERALD)],
         "sub": "Vacantes reales y verificadas"},
        {"lines": [L("100% GRATIS", 500, size=140, grad=True, g1=AMBER, g2=ORANGE)],
         "sub": "Sin pagar nada, sin muros de pago"},
        {"lines": [L("REMOTO en USD", 400, size=100, color=WHITE),
                   L("SIN EXPERIENCIA", 520, size=95, grad=True, g1=AMBER, g2=PINK),
                   L("PRÁCTICAS", 640, size=100, color=WHITE)],
         "sub": "Remoto en dólares · Sin experiencia · Prácticas"},
        {"lines": [L(COUNT, 480, size=220, grad=True, g1=AMBER, g2=PINK),
                   L("vacantes activas", 640, font="Poppins-SemiBold.ttf", size=52, color=WHITE)],
         "sub": COUNT + " vacantes activas en Colombia"},
    ] + BRAND

if __name__ == "__main__":
    print("Generando música y videos (esto toma ~1-2 min)...")
    render_video((1080, 1920), hook_camello(), "tiktok_1_buscas_camello.mp4")
    render_video((1080, 1920), hook_dolares(), "tiktok_2_remoto_dolares.mp4")
    render_video((1080, 1920), hook_primer_empleo(), "tiktok_3_primer_empleo.mp4")
    render_video((1080, 1080), hook_verificadas_square(), "ig_1_verificadas_gratis.mp4")
    print("LISTO ->", OUT)
