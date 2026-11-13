import numpy as np, glob
from PIL import Image
from scipy import ndimage
fails=0
trans=['out/3_logo/logo_oneline.png','out/3_logo/logo_stacked.png','out/4_splash/splash_1200.png',
       'out/2_android_adaptive/adaptive_foreground_1024.png']+glob.glob('out/6_mascot_roo/roo_[a-z]*.png')
trans=[t for t in trans if 'sheet' not in t]
for f in trans:
    a=np.array(Image.open(f).convert('RGBA'))[:,:,3]
    lab,n=ndimage.label(a<128)
    border=set(np.unique(np.concatenate([lab[0],lab[-1],lab[:,0],lab[:,-1]])))
    h=[i for i in range(1,n+1) if i not in border]
    print('holes', len(h), f); fails+=len(h)>0
for f in sorted(glob.glob('out/6_mascot_roo/rig/parts/*.png'))+['out/6_mascot_roo/rig/roo_rig_assembled.png']+[t for t in trans if 'roo_' in t or 'splash' in t or 'logo' in t]:
    a=np.array(Image.open(f).convert('RGBA'))[:,:,3]
    e=int((a[0]>0).sum()+(a[-1]>0).sum()+(a[:,0]>0).sum()+(a[:,-1]>0).sum())
    if e: print('EDGE',e,f); fails+=1
a=np.array(Image.open('out/6_mascot_roo/rig/parts/tail@2x.png'))[:,:,3]; ys,xs=np.nonzero(a)
print('tail right edge at', xs.max(), 'of', a.shape[1], '-> margin', a.shape[1]-1-xs.max(), 'px')
print('FAILS', fails)
