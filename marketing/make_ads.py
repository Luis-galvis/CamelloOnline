# -*- coding: utf-8 -*-
"""
Generador de piezas publicitarias para Camello Online.
Produce:
  - 1 video vertical MP4 (1080x1920, motion-graphics, ~10s)
  - 3 imágenes estáticas (vertical / cuadrado / horizontal)
  - 1 video cuadrado MP4 (1080x1080) opcional
Requiere: Pillow + imageio-ffmpeg (ya instalados).
"""
import os, math, subprocess, tempfile, shutil
from PIL import Image, ImageDraw, ImageFont, ImageFilter

# ---------------------------------------------------------------- config
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "salida")
os.makedirs(OUT, exist_ok=True)

FONT_DIR = r"C:\Windows\Fonts"
def F(name, size):
    p = os.path.join(FONT_DIR, name)
    return ImageFont.truetype(p, size)

# Brand
AMBER      = (245, 158, 11)     # #f59e0b
AMBER_DK   = (217, 119, 6)      # #d97706
NAVY       = (11, 18, 32)       # #0b1220
NAVY_LT    = (30, 41, 59)       # #1e293b
WHITE      = (255, 255, 255)
EMERALD    = (16, 185, 129)     # #10b981
SLATE      = (148, 163, 184)

SITE = "camelloonline.com"
COUNT = "+1.900"   # <- actualiza aquí el número de vacantes si quieres

# ---------------------------------------------------------------- helpers
def gradient_bg(w, h, top, bottom):
    """Degradado vertical."""
    img = Image.new("RGB", (w, h))
    px = img.load()
    for y in range(h):
        t = y / max(1, h - 1)
        r = int(top[0] + (bottom[0] - top[0]) * t)
        g = int(top[1] + (bottom[1] - top[1]) * t)
        b = int(top[2] + (bottom[2] - top[2]) * t)
        for x in range(w):
            px[x, y] = (r, g, b)
    return img

def wrap(text, font, max_w, draw):
    words = text.split()
    lines, cur = [], ""
    for wd in words:
        t = (cur + " " + wd).strip()
        if draw.textlength(t, font=font) <= max_w:
            cur = t
        else:
            if cur: lines.append(cur)
            cur = wd
    if cur: lines.append(cur)
    return lines

def draw_text_center(draw, cx, y, text, font, fill, tracking=0):
    draw.text((cx, y), text, font=font, fill=fill, anchor="ma", spacing=4)

def rounded(draw, box, rad, fill):
    draw.rounded_rectangle(box, radius=rad, fill=fill)

# ---------------------------------------------------------------- static
def make_static_vertical():
    W, H = 1080, 1920
    img = gradient_bg(W, H, NAVY, (60, 25, 10))
    d = ImageDraw.Draw(img)
    # acento de brillo
    d.ellipse((-200, -200, 600, 600), fill=(217, 119, 6, 90))
    d.ellipse((700, 1500, 1500, 2300), fill=(245, 158, 11, 70))

    big = F("ariblk.ttf", 150)
    mid = F("arialbd.ttf", 56)
    small = F("arialbd.ttf", 42)

    draw_text_center(d, W//2, 320, "¿BUSCAS", F("arialbd.ttf", 90), SLATE)
    draw_text_center(d, W//2, 430, "CAMELLO?", big, AMBER)

    # caja de value props
    box = (90, 700, W-90, 1280)
    rounded(d, box, 36, NAVY_LT)
    props = [
        "Trabajo remoto en DÓLARES",
        "Vacantes SIN experiencia",
        "Primer empleo y prácticas",
        "100% GRATIS · verificadas",
    ]
    yy = 760
    for p in props:
        draw_text_center(d, W//2, yy, p, F("arialbd.ttf", 52), WHITE)
        yy += 118
    draw_text_center(d, W//2, yy, COUNT + " vacantes activas", F("arialbd.ttf", 58), EMERALD)

    # CTA
    cta = (120, 1580, W-120, 1710)
    rounded(d, cta, 30, AMBER_DK)
    draw_text_center(d, W//2, 1645, "ENTRA GRATIS  →", F("ariblk.ttf", 56), WHITE)
    draw_text_center(d, W//2, 1790, SITE, F("arialbd.ttf", 44), WHITE)
    img.save(os.path.join(OUT, "ad_vertical_1080x1920.png"))
    return img

def make_static_square():
    W = H = 1080
    img = gradient_bg(W, H, NAVY, (70, 30, 12))
    d = ImageDraw.Draw(img)
    d.ellipse((650, -150, 1150, 350), fill=(217, 119, 6, 80))

    draw_text_center(d, W//2, 220, "CAMELLO ONLINE", F("ariblk.ttf", 96), AMBER)
    draw_text_center(d, W//2, 340, "Bolsa de empleo para Colombia", F("arialbd.ttf", 46), SLATE)

    draw_text_center(d, W//2, 520, COUNT, F("ariblk.ttf", 240), WHITE)
    draw_text_center(d, W//2, 700, "vacantes activas", F("arialbd.ttf", 56), SLATE)

    items = ["Remoto en USD", "Sin experiencia", "Verificadas"]
    yy = 830
    for it in items:
        draw_text_center(d, W//2, yy, "✓  " + it, F("arialbd.ttf", 60), EMERALD)
        yy += 84

    draw_text_center(d, W//2, 1010, SITE, F("arialbd.ttf", 50), WHITE)
    img.save(os.path.join(OUT, "ad_square_1080x1080.png"))
    return img

def make_static_horizontal():
    W, H = 1920, 1080
    img = gradient_bg(W, H, NAVY, (60, 25, 10))
    d = ImageDraw.Draw(img)
    d.ellipse((-150, -250, 700, 600), fill=(217, 119, 6, 90))
    d.ellipse((1500, 700, 2100, 1300), fill=(245, 158, 11, 70))

    draw_text_center(d, W//2, 300, "CAMELLO ONLINE", F("ariblk.ttf", 170), AMBER)
    draw_text_center(d, W//2, 500,
        "Trabajo remoto en dólares · Sin experiencia · 100% gratis",
        F("arialbd.ttf", 58), WHITE)
    draw_text_center(d, W//2, 640, COUNT + " vacantes activas en Colombia",
        F("arialbd.ttf", 66), EMERALD)

    cta = (760, 780, W-760, 900)
    rounded(d, cta, 28, AMBER_DK)
    draw_text_center(d, W//2, 840, "ENTRA GRATIS  →", F("ariblk.ttf", 54), WHITE)
    draw_text_center(d, W//2, 960, SITE, F("arialbd.ttf", 46), WHITE)
    img.save(os.path.join(OUT, "ad_horizontal_1920x1080.png"))
    return img

# ---------------------------------------------------------------- video
def ease(t):
    """0..1 con easing suave."""
    t = max(0.0, min(1.0, t))
    return 1 - (1 - t) ** 3

def draw_scene_frame(img, d, scene, t):
    """Dibuja una escena en el instante t (0..1) de su duración."""
    W, H = img.size
    cx = W // 2
    kind, lines = scene
    e = ease(t)

    if kind == "hook":
        d.text((cx, 500 + (1-e)*80), "¿BUSCAS", font=F("arialbd.ttf", 110), fill=SLATE, anchor="mm")
        d.text((cx, 660), "CAMELLO?", font=F("ariblk.ttf", 190), fill=AMBER, anchor="mm")
        # barra
        bw = int(700 * e)
        d.rectangle((cx-bw//2, 800, cx+bw//2, 812), fill=EMERALD)

    elif kind == "remote":
        d.text((cx, 560 + (1-e)*80), "TRABAJO REMOTO", font=F("ariblk.ttf", 120), fill=WHITE, anchor="mm")
        d.text((cx, 700), "en  DÓLARES  $", font=F("ariblk.ttf", 130), fill=EMERALD, anchor="mm")

    elif kind == "noexp":
        d.text((cx, 540 + (1-e)*80), "¿SIN EXPERIENCIA?", font=F("ariblk.ttf", 110), fill=WHITE, anchor="mm")
        d.text((cx, 680), "También hay", font=F("arialbd.ttf", 80), fill=SLATE, anchor="mm")
        d.text((cx, 790), "para primer empleo", font=F("arialbd.ttf", 80), fill=AMBER, anchor="mm")

    elif kind == "count":
        d.text((cx, 620), COUNT, font=F("ariblk.ttf", 300), fill=AMBER, anchor="mm")
        d.text((cx, 810), "vacantes activas en Colombia", font=F("arialbd.ttf", 60), fill=WHITE, anchor="mm")

    elif kind == "gratis":
        d.text((cx, 560 + (1-e)*80), "100% GRATIS", font=F("ariblk.ttf", 140), fill=EMERALD, anchor="mm")
        d.text((cx, 720), "Vacantes verificadas", font=F("arialbd.ttf", 70), fill=WHITE, anchor="mm")

    elif kind == "brand":
        d.text((cx, 700), "CAMELLO ONLINE", font=F("ariblk.ttf", 150), fill=AMBER, anchor="mm")
        d.text((cx, 830), SITE, font=F("arialbd.ttf", 62), fill=WHITE, anchor="mm")
        bw = int(900 * e)
        cy = 960
        d.rounded_rectangle((cx-bw//2, cy, cx+bw//2, cy+130), radius=40, fill=AMBER_DK)
        d.text((cx, cy+65), "ENTRA GRATIS  →", font=F("ariblk.ttf", 58), fill=WHITE, anchor="mm")

def make_video(size, name, dur_per=1.5):
    W, H = size
    scenes = [
        ("hook", None),
        ("remote", None),
        ("noexp", None),
        ("count", None),
        ("gratis", None),
        ("brand", None),
    ]
    fps = 30
    frames = []
    tmp = tempfile.mkdtemp(prefix="camello_frames_")
    try:
        for si, scene in enumerate(scenes):
            n = int(dur_per * fps)
            for i in range(n):
                t = i / max(1, n - 1)
                img = gradient_bg(W, H, NAVY, (60, 25, 10))
                d = ImageDraw.Draw(img)
                # acentos fijos
                d.ellipse((-250, -250, 550, 550), fill=(217, 119, 6, 90))
                d.ellipse((W-450, H-450, W+350, H+350), fill=(245, 158, 11, 70))
                draw_scene_frame(img, d, scene, t)
                # marca de agua abajo
                d.text((W//2, H-60), "camelloonline.com", font=F("arialbd.ttf", 40), fill=SLATE, anchor="mm")
                fn = os.path.join(tmp, f"{len(frames):05d}.png")
                img.save(fn)
                frames.append(fn)
        # codificar con ffmpeg
        import imageio_ffmpeg
        ff = imageio_ffmpeg.get_ffmpeg_exe()
        out = os.path.join(OUT, name)
        cmd = [ff, "-y", "-framerate", str(fps), "-i",
               os.path.join(tmp, "%05d.png"),
               "-c:v", "libx264", "-pix_fmt", "yuv420p",
               "-movflags", "+faststart", "-crf", "20", out]
        subprocess.run(cmd, check=True, capture_output=True)
        print("VIDEO_OK", out, "frames=", len(frames))
    finally:
        shutil.rmtree(tmp, ignore_errors=True)

if __name__ == "__main__":
    print("Generando estáticas...")
    make_static_vertical()
    make_static_square()
    make_static_horizontal()
    print("Generando video vertical...")
    make_video((1080, 1920), "ad_video_vertical_1080x1920.mp4")
    print("LISTO ->", OUT)
