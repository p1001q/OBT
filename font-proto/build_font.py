"""보드마카 한글 TTF 빌드: 획 중심선 -> 둥근 펜촉 스탬프 합집합 -> 자모 글리프 -> 11,172자 합성."""
import math, sys
from shapely.geometry import Polygon
from shapely.geometry.polygon import orient
from shapely.ops import unary_union
from shapely import affinity
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen
from marker import J, catmull, resample, CHO, JUNG, JONG

# ---- 확정 파라미터 (3차 시안) ----
NIB_ANGLE = -30
NIB_RATIO = 0.82
BASE_W    = 20
SLANT     = -0.18
FIT       = 0.92     # 중심선 축소: 굵은 펜이 글자 칸 밖으로 넘치지 않게
PRESS_MIN = 0.8
STEP      = 1.5
UPM, ASC, DESC = 1000, 880, -120
ADV = 1000

# ---- 자모 획 추가 정의 ----
def sc(strokes, x0, y0, x1, y1):
    return [[(x0+(x1-x0)*x, y0+(y1-y0)*y, p) for x, y, p in s] for s in strokes]

def dbl(name):
    return sc(J[name], 0.0, 0, 0.5, 1) + sc(J[name], 0.5, 0, 1.0, 1)

J.update({
 'ㅋ': J['ㄱ'] + [[(0.15,0.55,1.0),(0.6,0.52,0.9),(0.95,0.5,0.3)]],
 'ㅌ': J['ㄷ'] + [[(0.1,0.5,1.0),(0.5,0.48,0.9),(0.88,0.5,0.15)]],
 'ㅍ': [[(0.08,0.1,1.0),(0.5,0.08,0.9),(0.92,0.1,0.25)],
        [(0.08,0.92,1.0),(0.5,0.9,0.9),(0.92,0.93,0.25)],
        [(0.32,0.12,1.0),(0.3,0.5,0.9),(0.32,0.9,0.6)],
        [(0.68,0.12,1.0),(0.7,0.5,0.9),(0.68,0.9,0.6)]],
 'ㅊ': [[(0.4,0.0,1.0),(0.55,0.03,0.5)]] + sc(J['ㅈ'], 0, 0.17, 1, 1),
 'ㅎ': [[(0.2,0.04,1.0),(0.5,0.02,0.9),(0.8,0.05,0.3)],
        [(0.05,0.26,1.0),(0.5,0.24,0.9),(0.95,0.27,0.25)]] + sc(J['ㅇ'], 0.22, 0.4, 0.78, 1),
 'ㅐ': [[(0.33,0.0,1.0),(0.35,0.5,0.9),(0.31,1.0,0.12)],
        [(0.72,0.0,1.0),(0.74,0.5,0.9),(0.7,1.0,0.12)],
        [(0.35,0.45,1.0),(0.55,0.43,0.9),(0.73,0.41,0.9)]],
 'ㅑ': [[(0.4,0.0,1.0),(0.42,0.5,0.9),(0.38,1.0,0.12)],
        [(0.42,0.33,1.0),(0.7,0.3,0.9),(0.98,0.24,0.1)],
        [(0.42,0.64,1.0),(0.7,0.61,0.9),(0.98,0.55,0.1)]],
 'ㅒ': [[(0.33,0.0,1.0),(0.35,0.5,0.9),(0.31,1.0,0.12)],
        [(0.72,0.0,1.0),(0.74,0.5,0.9),(0.7,1.0,0.12)],
        [(0.35,0.33,1.0),(0.55,0.31,0.9),(0.73,0.29,0.9)],
        [(0.35,0.64,1.0),(0.55,0.62,0.9),(0.73,0.6,0.9)]],
 'ㅓ': [[(0.6,0.0,1.0),(0.62,0.5,0.9),(0.57,1.0,0.12)],
        [(0.6,0.45,1.0),(0.35,0.42,0.9),(0.02,0.36,0.1)]],
 'ㅔ': [[(0.45,0.0,1.0),(0.47,0.5,0.9),(0.43,1.0,0.12)],
        [(0.8,0.0,1.0),(0.82,0.5,0.9),(0.78,1.0,0.12)],
        [(0.02,0.4,0.15),(0.3,0.45,0.9),(0.46,0.45,1.0),(0.81,0.43,0.9)]],
 'ㅖ': [[(0.45,0.0,1.0),(0.47,0.5,0.9),(0.43,1.0,0.12)],
        [(0.8,0.0,1.0),(0.82,0.5,0.9),(0.78,1.0,0.12)],
        [(0.02,0.28,0.15),(0.3,0.33,0.9),(0.46,0.33,1.0),(0.81,0.31,0.9)],
        [(0.02,0.6,0.15),(0.3,0.65,0.9),(0.46,0.65,1.0),(0.81,0.63,0.9)]],
 'ㅛ': [[(0.3,0.05,1.0),(0.3,0.4,0.9),(0.3,0.7,1.0)],
        [(0.7,0.03,1.0),(0.7,0.4,0.9),(0.7,0.7,1.0)],
        [(0.02,0.72,1.2),(0.5,0.68,0.9),(0.98,0.7,0.12)]],
 'ㅠ': [[(0.02,0.2,1.2),(0.5,0.17,0.9),(0.98,0.22,0.12)],
        [(0.3,0.2,1.0),(0.3,0.6,0.9),(0.27,1.0,0.12)],
        [(0.7,0.2,1.0),(0.7,0.6,0.9),(0.67,1.0,0.12)]],
})
for k, base in (('ㄲ','ㄱ'),('ㄸ','ㄷ'),('ㅃ','ㅂ'),('ㅆ','ㅅ'),('ㅉ','ㅈ')):
    J[k] = dbl(base)
J.update({
 'ㅘ': sc(J['ㅗ'],0,0.42,0.62,1) + sc(J['ㅏ'],0.6,0,1,1),
 'ㅚ': sc(J['ㅗ'],0,0.42,0.62,1) + sc(J['ㅣ'],0.7,0,1,1),
 'ㅙ': sc(J['ㅗ'],0,0.42,0.5,1)  + sc(J['ㅐ'],0.45,0,1,1),
 'ㅝ': sc(J['ㅜ'],0,0.45,0.55,1) + sc(J['ㅓ'],0.5,0,1,1),
 'ㅞ': sc(J['ㅜ'],0,0.45,0.5,1)  + sc(J['ㅔ'],0.45,0,1,1),
 'ㅟ': sc(J['ㅜ'],0,0.4,0.62,1)  + sc(J['ㅣ'],0.7,0,1,1),
 'ㅢ': sc(J['ㅡ'],0,0.4,0.62,0.95) + sc(J['ㅣ'],0.7,0,1,1),
})

# ---- 모음 분류 / 배치 박스 ----
V1, V2, HZ, M1, M2 = 'ㅏㅑㅓㅕㅣ', 'ㅐㅒㅔㅖ', 'ㅗㅛㅜㅠㅡ', 'ㅘㅚㅝㅟㅢ', 'ㅙㅞ'
BOX = {  # cls -> (cho, vowel) for no-final / final
 'V1': (((6,12,50,88),(58,2,94,98)),   ((6,6,50,56),(58,4,94,64))),
 'V2': (((4,12,42,88),(46,2,96,98)),   ((4,6,42,56),(46,4,96,64))),
 'HZ': (((18,6,82,46),(6,52,94,92)),   ((22,4,78,34),(8,38,92,64))),
 'M':  (((6,4,60,42),(4,6,96,94)),     ((6,2,58,32),(4,4,96,66))),
}
JONG_BOX   = (14,68,86,98)
JONG_LEFT  = (14,68,48,98)
JONG_RIGHT = (52,68,86,98)
CLUSTER = {'ㄳ':('ㄱ','ㅅ'),'ㄵ':('ㄴ','ㅈ'),'ㄶ':('ㄴ','ㅎ'),'ㄺ':('ㄹ','ㄱ'),'ㄻ':('ㄹ','ㅁ'),
           'ㄼ':('ㄹ','ㅂ'),'ㄽ':('ㄹ','ㅅ'),'ㄾ':('ㄹ','ㅌ'),'ㄿ':('ㄹ','ㅍ'),'ㅀ':('ㄹ','ㅎ'),'ㅄ':('ㅂ','ㅅ')}

def vowel_cls(v):
    return 'V1' if v in V1 else 'V2' if v in V2 else 'HZ' if v in HZ else 'M'

def pen_scale(cho, jung, jong):
    s = 0.0
    if jung in V2 or jung in M2: s += 0.08
    if jung in M1 or jung in M2: s += 0.06
    if jong: s += 0.07
    if jong in CLUSTER or jong in 'ㄲㅆ': s += 0.08
    if cho in 'ㄲㄸㅃㅆㅉ': s += 0.08
    elif cho in 'ㅊㅋㅌㅍㅎ': s += 0.03
    return round(max(1.0 - s, 0.68), 2)

# ---- 스탬프 -> 폴리곤 ----
_nib_cache = {}
def nib(r):
    key = round(r, 2)
    if key not in _nib_cache:
        e = affinity.scale(Polygon([(math.cos(a*math.pi/8), math.sin(a*math.pi/8)) for a in range(16)]),
                           key, key*NIB_RATIO, origin=(0,0))
        _nib_cache[key] = affinity.rotate(e, NIB_ANGLE, origin=(0,0))
    return _nib_cache[key]

def draw(jamo, box, pen):
    x0, y0, x1, y1 = box
    polys = []
    for stroke in J[jamo]:
        pts = [(x0+(x1-x0)*x, y0+(y1-y0)*y, max(p, PRESS_MIN)) for x, y, p in stroke]
        pts = [(50+(x-50)*FIT, 50+(y-50)*FIT, p) for x, y, p in pts]
        for x, y, p in resample(catmull(pts), STEP):
            x += SLANT*(y-50)
            polys.append(affinity.translate(nib(BASE_W*pen*p/2), x, y))
    return unary_union(polys)

def to_glyph(geom):
    pen = TTGlyphPen(None)
    g = geom.simplify(0.12)
    polys = [g] if g.geom_type == 'Polygon' else list(g.geoms)
    for poly in polys:
        poly = orient(poly, sign=-1.0)   # y 뒤집기 전 기준: 아래에서 다시 방향 보정
        for ring in [poly.exterior, *poly.interiors]:
            pts = [(round(x*10), round(ASC - y*10)) for x, y in ring.coords[:-1]]
            pts.reverse()                 # y 반전으로 뒤집힌 방향 복구
            pen.moveTo(pts[0])
            for p in pts[1:]: pen.lineTo(p)
            pen.closePath()
    return pen.glyph()

# ---- 빌드 ----
def main():
    glyphs, order = {}, ['.notdef', 'space']
    empty = TTGlyphPen(None).glyph()
    notdef = TTGlyphPen(None)
    for pts in ([(100,-100),(100,800),(800,800),(800,-100)], [(180,-20),(720,-20),(720,720),(180,720)]):
        notdef.moveTo(pts[0]); [notdef.lineTo(p) for p in pts[1:]]; notdef.closePath()
    glyphs['.notdef'], glyphs['space'] = notdef.glyph(), empty

    placed = {}
    def place(jamo, box, pen):
        key = (jamo, box, pen)
        if key not in placed:
            name = f'p{len(placed)}'
            placed[key] = name
            glyphs[name] = to_glyph(draw(jamo, box, pen)); order.append(name)
        return placed[key]

    cmap, total = {}, 0
    for code in range(0xAC00, 0xD7A4):
        i = code - 0xAC00
        cho, jung, jong = CHO[i//588], JUNG[(i%588)//28], JONG[i%28].strip()
        cls = vowel_cls(jung)
        bc, bv = BOX[cls][1 if jong else 0]
        pen = pen_scale(cho, jung, jong)
        parts = [place(cho, bc, pen), place(jung, bv, pen)]
        if jong:
            if jong in CLUSTER:
                a, b = CLUSTER[jong]
                parts += [place(a, JONG_LEFT, pen), place(b, JONG_RIGHT, pen)]
            else:
                parts.append(place(jong, JONG_BOX, pen))
        name = f'uni{code:04X}'
        gp = TTGlyphPen(glyphs)
        for part in parts: gp.addComponent(part, (1,0,0,1,0,0))
        glyphs[name] = gp.glyph(); order.append(name); cmap[code] = name
        total += 1
    cmap[0x20] = 'space'

    fb = FontBuilder(UPM, isTTF=True)
    fb.setupGlyphOrder(order)
    fb.setupCharacterMap(cmap)
    fb.setupGlyf({n: glyphs[n] for n in order})
    glyf = fb.font['glyf']
    metrics = {}
    for n in order:
        g = glyf[n]
        g.recalcBounds(glyf)
        metrics[n] = (400 if n == 'space' else ADV, getattr(g, 'xMin', 0))
    fb.setupHorizontalMetrics(metrics)
    fb.setupHorizontalHeader(ascent=ASC, descent=DESC)
    fb.setupNameTable({'familyName': 'OZ Marker', 'styleName': 'Regular'})
    fb.setupOS2(sTypoAscender=ASC, sTypoDescender=DESC, usWinAscent=ASC, usWinDescent=-DESC,
                sTypoLineGap=0, achVendID='OBT ', fsType=0)
    fb.setupPost()
    out = sys.argv[1] if len(sys.argv) > 1 else 'OZMarker-Regular.ttf'
    fb.save(out)
    print(f'saved {out}: {total} syllables, {len(placed)} placed jamo glyphs')

if __name__ == '__main__':
    main()
