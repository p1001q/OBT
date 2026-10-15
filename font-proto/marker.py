"""보드마카 손글씨 프로토타입: 획 중심선(+필압) -> 사선 펜촉 스탬프 -> SVG 프리뷰."""
import math, sys, random

# ---- 튜닝 파라미터 ----
NIB_ANGLE = -30      # 펜촉 각도(도). 방향별 명암 결정
NIB_RATIO = 0.62     # 펜촉 납작함 (minor/major)
BASE_W    = 17      # 기본 굵기 (em 100 기준)
SLANT     = -0.18    # 전체 기울임 (shear)
STEP      = 0.7      # 스탬프 간격

# ---- 자모 획 데이터 (0..1 박스, y 아래로, 점=(x,y,필압)) ----
J = {
 'ㄱ': [[(0.05,0.12,0.8),(0.5,0.07,0.9),(0.93,0.1,1.45),(0.92,0.35,1.0),(0.78,0.95,0.1)]],
 'ㄴ': [[(0.1,0.05,0.9),(0.1,0.5,0.9),(0.14,0.88,1.45),(0.5,0.92,0.9),(0.97,0.78,0.1)]],
 'ㄷ': [[(0.92,0.1,0.9),(0.5,0.07,0.9),(0.1,0.12,1.4),(0.1,0.5,0.9),(0.1,0.9,1.4),(0.5,0.93,0.9),(0.96,0.84,0.1)]],
 'ㄹ': [[(0.1,0.08,0.9),(0.9,0.1,1.4),(0.88,0.3,0.9),(0.12,0.5,1.35),(0.1,0.7,0.9),(0.12,0.92,1.4),(0.96,0.88,0.1)]],
 'ㅁ': [[(0.12,0.1,0.9),(0.1,0.5,0.9),(0.12,0.9,1.2)],
        [(0.1,0.1,1.2),(0.9,0.1,1.4),(0.9,0.5,0.9),(0.88,0.92,1.4),(0.1,0.9,0.12)]],
 'ㅂ': [[(0.15,0.05,0.9),(0.12,0.5,0.9),(0.15,0.95,0.3)],
        [(0.85,0.05,0.9),(0.85,0.5,0.9),(0.88,0.95,0.2)],
        [(0.15,0.5,1.0),(0.5,0.45,0.9),(0.85,0.5,0.8)],
        [(0.15,0.95,1.1),(0.5,0.92,0.9),(0.92,0.95,0.12)]],
 'ㅅ': [[(0.5,0.05,1.0),(0.45,0.4,0.9),(0.12,0.93,0.1)],
        [(0.4,0.4,0.9),(0.7,0.7,0.9),(0.93,0.95,0.1)]],
 'ㅇ': [[(0.5,0.05,0.9),(0.15,0.25,1.0),(0.1,0.55,1.1),(0.3,0.9,1.1),(0.65,0.92,1.0),(0.9,0.6,1.0),(0.85,0.25,1.0),(0.5,0.05,1.0),(0.28,0.15,0.15)]],
 'ㅈ': [[(0.08,0.1,1.0),(0.5,0.07,0.9),(0.92,0.12,0.8)],
        [(0.5,0.1,1.0),(0.45,0.5,0.9),(0.1,0.93,0.1)],
        [(0.45,0.5,0.9),(0.7,0.7,0.9),(0.93,0.95,0.1)]],
 'ㅏ': [[(0.4,0.0,1.0),(0.42,0.5,0.9),(0.38,1.0,0.12)],
        [(0.42,0.45,1.0),(0.7,0.42,0.9),(0.98,0.36,0.1)]],
 'ㅕ': [[(0.6,0.0,1.0),(0.62,0.5,0.9),(0.57,1.0,0.12)],
        [(0.6,0.33,1.0),(0.35,0.3,0.9),(0.03,0.24,0.1)],
        [(0.6,0.64,1.0),(0.35,0.61,0.9),(0.03,0.55,0.1)]],
 'ㅣ': [[(0.5,0.0,1.0),(0.52,0.5,0.9),(0.45,1.0,0.12)]],
 'ㅗ': [[(0.5,0.0,1.0),(0.5,0.4,0.9),(0.5,0.7,1.0)],
        [(0.02,0.72,1.2),(0.5,0.68,0.9),(0.98,0.7,0.12)]],
 'ㅜ': [[(0.02,0.2,1.2),(0.5,0.17,0.9),(0.98,0.22,0.12)],
        [(0.5,0.2,1.0),(0.5,0.6,0.9),(0.45,1.0,0.12)]],
 'ㅡ': [[(0.0,0.5,1.2),(0.5,0.45,0.9),(1.0,0.5,0.12)]],
}
VOW_V = set('ㅏㅕㅣ'); 
CHO = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ'
JUNG = 'ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ'
JONG = ' ㄱㄲㄳㄴㄵㄶㄷㄹㄺㄻㄼㄽㄾㄿㅀㅁㅂㅄㅅㅆㅇㅈㅊㅋㅌㅍㅎ'

def decompose(ch):
    c = ord(ch) - 0xAC00
    return CHO[c//588], JUNG[(c%588)//28], JONG[c%28].strip()

def boxes(vowel, has_final):
    if vowel in VOW_V:
        return ((6,6,50,56),(58,4,94,64),(14,68,86,96)) if has_final else ((6,12,50,88),(58,2,94,98),None)
    return ((22,4,78,34),(8,38,92,64),(16,68,84,98)) if has_final else ((18,6,82,46),(6,52,94,92),None)

def catmull(pts, n=20):
    P = [pts[0]] + pts + [pts[-1]]
    out = []
    for i in range(1, len(P)-2):
        p0,p1,p2,p3 = P[i-1],P[i],P[i+1],P[i+2]
        for k in range(n):
            t = k/n; t2=t*t; t3=t2*t
            f = lambda a,b,c,d: 0.5*((2*b)+(-a+c)*t+(2*a-5*b+4*c-d)*t2+(-a+3*b-3*c+d)*t3)
            out.append(tuple(f(p0[j],p1[j],p2[j],p3[j]) for j in range(3)))
    out.append(pts[-1]); return out

def resample(path, step):
    res=[path[0]]; acc=0
    for a,b in zip(path,path[1:]):
        d=math.dist(a[:2],b[:2])
        if d==0: continue
        pos=step-acc
        while pos<=d:
            t=pos/d; res.append(tuple(a[j]+(b[j]-a[j])*t for j in range(3))); pos+=step
        acc=(acc+d)%step
    res.append(path[-1]); return res

def glyph_stamps(ch, ox, oy):
    cho, jung, jong = decompose(ch)
    bc, bv, bf = boxes(jung, bool(jong))
    items = [(cho,bc),(jung,bv)] + ([(jong,bf)] if jong else [])
    rnd = random.Random(ord(ch))
    stamps=[]   # (x,y,p,kind)
    def put(x,y,p,kind):
        x += SLANT*(y-50)
        stamps.append((ox+x, oy+y, p, kind))
    for name,(x0,y0,x1,y1) in items:
        for stroke in J[name]:
            # 끝을 날리되 완전히 뾰족하지 않게: 필압 하한
            pts=[(x0+(x1-x0)*x, y0+(y1-y0)*y, max(p,0.3)) for x,y,p in stroke]
            rp = resample(catmull(pts), STEP)
            for x,y,p in rp: put(x,y,p,'main')
            n=len(rp)
            def tan(i):
                a=rp[max(i-3,0)]; b=rp[min(i+3,n-1)]
                dx,dy=b[0]-a[0],b[1]-a[1]; l=math.hypot(dx,dy) or 1
                return dx/l,dy/l
            # 결(브리슬): 획 끝/시작이 갈라지는 효과 + 옆면 거칠기
            for _ in range(2):
                f = rnd.uniform(-0.35,0.35)
                ext_end = rnd.uniform(1.5,4.5); ext_st = rnd.uniform(0,5)
                for i,(sign,ext) in enumerate(((1,ext_end),(-1,ext_st))):
                    idx = n-1 if sign==1 else 0
                    x,y,p = rp[idx]; tx,ty = tan(idx); tx,ty = tx*sign,ty*sign
                    w = BASE_W*p*0.5
                    nx,ny = -ty,tx
                    steps=int(ext/STEP)
                    for k in range(steps):
                        t=k*STEP
                        put(x+tx*t+nx*f*w, y+ty*t+ny*f*w, 0.16, 'bristle')
            for _ in range(0):  # 옆면 결
                f = rnd.choice((-1,1))*rnd.uniform(0.5,0.7)
                a=rnd.randint(n//5, n//2); b=rnd.randint(n//2, n-1)
                for i in range(a,b):
                    x,y,p = rp[i]; tx,ty=tan(i); nx,ny=-ty,tx
                    put(x+nx*f*BASE_W*p*0.5, y+ny*f*BASE_W*p*0.5, 0.14, 'bristle')
    return stamps

def svg(lines, size_px=1600):
    adv=100; lh=130
    W=max(len(l) for l in lines)*adv+40; H=len(lines)*lh+20
    out=[f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{size_px}" height="{int(size_px*H/W)}" style="background:#fff">','<g fill="#111">']
    for li,line in enumerate(lines):
        x=20
        for ch in line:
            if ch==' ': x+=adv*0.45; continue
            for sx,sy,p,kind in glyph_stamps(ch,x,li*lh+15):
                if kind=='main':
                    rx=BASE_W*p/2; ry=rx*NIB_RATIO
                    out.append(f'<ellipse cx="{sx:.1f}" cy="{sy:.1f}" rx="{rx:.2f}" ry="{ry:.2f}" transform="rotate({NIB_ANGLE} {sx:.1f} {sy:.1f})"/>')
                else:
                    out.append(f'<circle cx="{sx:.1f}" cy="{sy:.1f}" r="1.1"/>')
            x+=adv
    out.append('</g></svg>'); return '\n'.join(out)

if __name__=='__main__':
    text = sys.argv[1:] or ['가나다라마바사','박수연 오즈 동아리']
    open('preview.svg','w').write(svg(text))
    print('preview.svg written')
