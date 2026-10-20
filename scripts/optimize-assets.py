"""웹 배포용 에셋을 원본에서 다시 만든다.

- assets-src/images/**/*.png  ->  public/assets/**/*.webp   (품질 90, 투명 배경 유지)
- font-proto/OZMarker-Regular.ttf  ->  public/fonts/OZMarker-Regular.woff2

원본(PNG, TTF)은 저장소에 남기고 배포 폴더(public)에는 변환본만 둔다.
이미지나 폰트를 바꿨다면 이 스크립트를 다시 실행한다.

필요한 패키지: pip install pillow fonttools brotli
실행: python3 scripts/optimize-assets.py
"""
from pathlib import Path

from fontTools.ttLib import TTFont
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
IMAGE_SRC = ROOT / "assets-src" / "images"
IMAGE_OUT = ROOT / "public" / "assets"
FONT_SRC = ROOT / "font-proto" / "OZMarker-Regular.ttf"
FONT_OUT = ROOT / "public" / "fonts" / "OZMarker-Regular.woff2"
WEBP_QUALITY = 90
# 채도 높은 색 가장자리가 손실 압축(4:2:0)에서 번지는 이미지는 무손실로 저장한다.
LOSSLESS = {"cut/confetti", "cut/back-chevron-patch", "cut/redstars"}


def convert_images() -> None:
    before = after = count = 0
    for source in sorted(IMAGE_SRC.rglob("*.png")):
        target = IMAGE_OUT / source.relative_to(IMAGE_SRC).with_suffix(".webp")
        target.parent.mkdir(parents=True, exist_ok=True)
        key = source.relative_to(IMAGE_SRC).with_suffix("").as_posix()
        with Image.open(source) as image:
            image.load()
            if key in LOSSLESS:
                image.save(target, "WEBP", lossless=True, quality=100, method=6)
            else:
                image.save(target, "WEBP", quality=WEBP_QUALITY, method=6)
        before += source.stat().st_size
        after += target.stat().st_size
        count += 1
    print(f"이미지 {count}장: {before // 1024}KB -> {after // 1024}KB")


def convert_font() -> None:
    font = TTFont(FONT_SRC)
    font.flavor = "woff2"
    FONT_OUT.parent.mkdir(parents=True, exist_ok=True)
    font.save(FONT_OUT)
    print(f"폰트: {FONT_SRC.stat().st_size // 1024}KB -> {FONT_OUT.stat().st_size // 1024}KB")


if __name__ == "__main__":
    convert_images()
    convert_font()
