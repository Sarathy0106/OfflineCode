import os
import math
from PIL import Image, ImageDraw, ImageFont, ImageFilter

os.makedirs("store_assets", exist_ok=True)

FONT_BOLD = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
FONT_REGULAR = "/System/Library/Fonts/Supplemental/Arial.ttf"
FONT_MONO = "/System/Library/Fonts/Menlo.ttc"

def get_font(path, size):
    try:
        return ImageFont.truetype(path, size)
    except:
        return ImageFont.load_default()

def create_feature_graphic():
    w, h = 1024, 500
    img = Image.new("RGBA", (w, h), (17, 17, 27, 255))
    draw = ImageDraw.Draw(img)

    # Gradient background
    for y in range(h):
        r = int(17 + (30 - 17) * (y / h))
        g = int(17 + (30 - 17) * (y / h))
        b = int(27 + (46 - 27) * (y / h))
        draw.line([(0, y), (w, y)], fill=(r, g, b, 255))

    # Ambient glow in background
    glow = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow)
    glow_draw.ellipse([(-100, -100), (450, 450)], fill=(0, 229, 255, 30))
    glow_draw.ellipse([(650, 100), (1200, 600)], fill=(137, 180, 250, 25))
    glow_draw.ellipse([(400, 250), (800, 650)], fill=(203, 166, 247, 20))
    glow = glow.filter(ImageFilter.GaussianBlur(80))
    img = Image.alpha_composite(img, glow)
    draw = ImageDraw.Draw(img)

    # App icon
    if os.path.exists("playstore_icon_512.png"):
        icon = Image.open("playstore_icon_512.png").convert("RGBA")
        icon = icon.resize((150, 150), Image.Resampling.LANCZOS)
        # Rounded mask
        mask = Image.new("L", (150, 150), 0)
        mask_draw = ImageDraw.Draw(mask)
        mask_draw.rounded_rectangle([(0, 0), (150, 150)], radius=32, fill=255)
        
        # Icon shadow
        shadow = Image.new("RGBA", (170, 170), (0, 0, 0, 0))
        shadow_draw = ImageDraw.Draw(shadow)
        shadow_draw.rounded_rectangle([(10, 10), (160, 160)], radius=34, fill=(0, 0, 0, 120))
        shadow = shadow.filter(ImageFilter.GaussianBlur(10))
        img.paste(shadow, (60, 165), shadow)
        img.paste(icon, (70, 175), mask)

    # Typography
    f_title = get_font(FONT_BOLD, 52)
    f_sub = get_font(FONT_REGULAR, 22)
    f_badge = get_font(FONT_BOLD, 15)
    f_code = get_font(FONT_MONO, 16)

    # Title
    draw.text((250, 175), "OfflineCode", fill=(255, 255, 255, 255), font=f_title)
    draw.text((250, 240), "100% Offline Compiler & IDE for Android", fill=(186, 194, 222, 255), font=f_sub)
    draw.text((250, 275), "Fast Native Execution • Zero Internet Permission", fill=(147, 153, 178, 255), font=f_sub)

    # Badges
    badges = [
        ("Python 3.10", (249, 226, 175)),
        ("C (TinyCC)", (166, 227, 161)),
        ("C++ (Clang 17)", (137, 220, 235)),
        ("Java (ECJ + D8)", (250, 179, 135)),
        ("Interactive Stdin", (203, 166, 247)),
    ]

    bx = 70
    by = 370
    for label, col in badges:
        bbox = draw.textbbox((0, 0), label, font=f_badge)
        bw = bbox[2] - bbox[0] + 28
        bh = 38
        draw.rounded_rectangle([(bx, by), (bx + bw, by + bh)], radius=19, fill=(30, 30, 46, 220), outline=col, width=2)
        draw.text((bx + 14, by + 10), label, fill=col, font=f_badge)
        bx += bw + 14

    # Top right offline badge
    off_text = "● 100% OFFLINE"
    draw.rounded_rectangle([(780, 45), (960, 85)], radius=20, fill=(34, 197, 94, 30), outline=(34, 197, 94, 200), width=2)
    draw.text((800, 56), off_text, fill=(34, 197, 94, 255), font=f_badge)

    img = img.convert("RGB")
    img.save("store_assets/feature_graphic_1024x500.png", "PNG", quality=95)
    print("Created feature_graphic_1024x500.png")

create_feature_graphic()

def create_phone_screenshot(input_name, output_name, tag, title, subtitle, accent_color):
    w, h = 1080, 1920
    canvas = Image.new("RGBA", (w, h), (17, 17, 27, 255))
    draw = ImageDraw.Draw(canvas)

    # Ambient background gradient
    for y in range(h):
        r = int(17 + (24 - 17) * (y / h))
        g = int(17 + (24 - 17) * (y / h))
        b = int(27 + (37 - 27) * (y / h))
        draw.line([(0, y), (w, y)], fill=(r, g, b, 255))

    # Glow under the header
    glow = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow)
    glow_draw.ellipse([(150, -100), (930, 250)], fill=(*accent_color, 45))
    glow = glow.filter(ImageFilter.GaussianBlur(60))
    canvas = Image.alpha_composite(canvas, glow)
    draw = ImageDraw.Draw(canvas)

    # Fonts
    f_tag = get_font(FONT_BOLD, 22)
    f_title = get_font(FONT_BOLD, 46)
    f_sub = get_font(FONT_REGULAR, 26)

    # Header section (0 - 270)
    # Tag badge
    bbox = draw.textbbox((0, 0), tag, font=f_tag)
    tw = bbox[2] - bbox[0] + 32
    th = 40
    tx = (w - tw) // 2
    ty = 48
    draw.rounded_rectangle([(tx, ty), (tx + tw, ty + th)], radius=20, fill=(30, 30, 46, 230), outline=accent_color, width=2)
    draw.text((tx + 16, ty + 9), tag, fill=accent_color, font=f_tag)

    # Title
    t_bbox = draw.textbbox((0, 0), title, font=f_title)
    draw.text(((w - (t_bbox[2] - t_bbox[0])) // 2, 110), title, fill=(255, 255, 255, 255), font=f_title)

    # Subtitle
    s_bbox = draw.textbbox((0, 0), subtitle, font=f_sub)
    draw.text(((w - (s_bbox[2] - s_bbox[0])) // 2, 178), subtitle, fill=(186, 194, 222, 255), font=f_sub)

    # Device Mockup / Screen placement
    src_path = "/Users/sarathyv/.gemini/antigravity/brain/337e5c3a-1cfe-42e8-a1f1-c8127441e08f/" + input_name
    if os.path.exists(src_path):
        src = Image.open(src_path).convert("RGBA")
        
        # Crop system status bar if present (top ~120px)
        crop_top = 110
        src = src.crop((0, crop_top, src.width, src.height))
        
        # Target frame size
        frame_w = 940
        # Preserve aspect ratio
        frame_h = int(src.height * (frame_w / src.width))
        src = src.resize((frame_w, frame_h), Image.Resampling.LANCZOS)

        # Visible height on canvas from y=250 to 1920
        display_y = 260
        max_h = h - display_y
        if frame_h > max_h:
            src = src.crop((0, 0, frame_w, max_h))
            frame_h = max_h

        # Rounded corners for the app screenshot
        mask = Image.new("L", (frame_w, frame_h), 0)
        mask_draw = ImageDraw.Draw(mask)
        mask_draw.rounded_rectangle([(0, 0), (frame_w, frame_h)], radius=36, fill=255)

        # Shadow
        shadow = Image.new("RGBA", (frame_w + 40, frame_h + 40), (0, 0, 0, 0))
        shadow_draw = ImageDraw.Draw(shadow)
        shadow_draw.rounded_rectangle([(20, 20), (frame_w + 20, frame_h + 20)], radius=38, fill=(0, 0, 0, 160))
        shadow = shadow.filter(ImageFilter.GaussianBlur(16))
        
        pos_x = (w - frame_w) // 2
        canvas.paste(shadow, (pos_x - 20, display_y - 10), shadow)
        canvas.paste(src, (pos_x, display_y), mask)

        # Subtle elegant border around the mockup
        border_overlay = Image.new("RGBA", (frame_w, frame_h), (0, 0, 0, 0))
        b_draw = ImageDraw.Draw(border_overlay)
        b_draw.rounded_rectangle([(0, 0), (frame_w - 1, frame_h - 1)], radius=36, outline=(255, 255, 255, 40), width=3)
        canvas.paste(border_overlay, (pos_x, display_y), border_overlay)

    canvas = canvas.convert("RGB")
    out_path = os.path.join("store_assets", output_name)
    canvas.save(out_path, "PNG", quality=95)
    print(f"Created {out_path}")

create_phone_screenshot(
    "cpp_result.png",
    "screenshot_1_cpp.png",
    "C++17 COMPILER",
    "Clang 17 Native Compilation",
    "Real-time stdin, STL, and sub-second execution",
    (137, 220, 235)
)

create_phone_screenshot(
    "python_result.png",
    "screenshot_2_python.png",
    "PYTHON 3.10 RUNTIME",
    "Pure Offline Python IDE",
    "Full interactive stdin, math, sys, and standard library",
    (249, 226, 175)
)

create_phone_screenshot(
    "java_result.png",
    "screenshot_3_java.png",
    "JAVA COMPILER & VM",
    "ECJ + D8 Dex Execution",
    "Fast javac compilation with interactive Scanner support",
    (250, 179, 135)
)

create_phone_screenshot(
    "c_result.png",
    "screenshot_4_c.png",
    "C COMPILER",
    "Instant C Execution",
    "TinyCC engine with blazing fast compile & run cycles",
    (166, 227, 161)
)

