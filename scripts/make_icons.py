import os
import subprocess
from PIL import Image, ImageDraw

edge_path = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
pwd = os.getcwd()
pwd_forward = pwd.replace('\\', '/')
svg_url = f"file:///{pwd_forward}/public/favicon.svg"
out_512 = os.path.join(pwd, "public", "icon-512.png")

# Step 1: Render 512x512 using Edge Headless
cmd = [
    edge_path,
    "--headless=new",
    "--disable-gpu",
    "--hide-scrollbars",
    f"--screenshot={out_512}",
    "--window-size=512,512",
    svg_url
]
subprocess.run(cmd, check=True)

# Step 2: Open with Pillow and apply smooth alpha mask to corners
im = Image.open(out_512).convert("RGBA")
mask = Image.new("L", (512, 512), 0)
draw = ImageDraw.Draw(mask)
# rounded rectangle matching the SVG squircle (rx=128 on 512x512)
draw.rounded_rectangle([(0, 0), (512, 512)], radius=120, fill=255)
im.putalpha(mask)

# Save 512x512 PNG
im.save(os.path.join("public", "icon-512.png"), format="PNG")
print("Saved icon-512.png")

# Generate 192x192 PNG (standard PWA requirement)
im_192 = im.resize((192, 192), Image.Resampling.LANCZOS)
im_192.save(os.path.join("public", "icon-192.png"), format="PNG")
print("Saved icon-192.png")

# Generate 180x180 apple-touch-icon
im_180 = im.resize((180, 180), Image.Resampling.LANCZOS)
im_180.save(os.path.join("public", "apple-touch-icon.png"), format="PNG")
print("Saved apple-touch-icon.png")

# Generate 32x32 and 16x16 PNGs
im_32 = im.resize((32, 32), Image.Resampling.LANCZOS)
im_32.save(os.path.join("public", "favicon-32x32.png"), format="PNG")
im_16 = im.resize((16, 16), Image.Resampling.LANCZOS)
im_16.save(os.path.join("public", "favicon-16x16.png"), format="PNG")

# Generate multi-size favicon.ico (essential for Windows desktop shortcuts & bookmarks)
ico_sizes = [(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
im.save(os.path.join("public", "favicon.ico"), format="ICO", sizes=ico_sizes)
print("Saved favicon.ico with sizes:", ico_sizes)
