"""Offline conversion of official Real-ESRGAN weights; not a web backend.

Requires CPU PyTorch and ONNX. The website serves the exported model locally.
"""
import hashlib
import json
from pathlib import Path
import sys
import urllib.request

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / 'output/ai-watermark/export-deps'))
import torch
import onnx

REVISION = 'a4abfb2979a7bbff3f69f58f58ae324608821e27'
SOURCE = f'https://raw.githubusercontent.com/xinntao/Real-ESRGAN/{REVISION}/'
RELEASE = 'https://github.com/xinntao/Real-ESRGAN/releases/download/v0.2.5.0/'
REF = ROOT / 'output/image-enhancer/references'
DEST = ROOT / 'public/assets/image-enhancer'
REF.mkdir(parents=True, exist_ok=True)
DEST.mkdir(parents=True, exist_ok=True)
sources = {}
for name, url in {
    'srvgg_arch.py': SOURCE + 'realesrgan/archs/srvgg_arch.py',
    'LICENSE': SOURCE + 'LICENSE',
    'realesr-general-x4v3.pth': RELEASE + 'realesr-general-x4v3.pth',
    'realesr-general-wdn-x4v3.pth': RELEASE + 'realesr-general-wdn-x4v3.pth',
}.items():
    path = REF / name
    if not path.exists():
        with urllib.request.urlopen(url, timeout=90) as response:
            path.write_bytes(response.read())
    sources[name] = {'url': url, 'sha256': hashlib.sha256(path.read_bytes()).hexdigest()}
    print(name, sources[name]['sha256'], flush=True)

# Remove only BasicSR's registration dependency; preserve the official graph.
code = (REF / 'srvgg_arch.py').read_text().replace('from basicsr.utils.registry import ARCH_REGISTRY', '').replace('@ARCH_REGISTRY.register()', '')
namespace = {}
exec(compile(code, str(REF / 'srvgg_arch.py'), 'exec'), namespace)
model = namespace['SRVGGNetCompact'](num_in_ch=3, num_out_ch=3, num_feat=64, num_conv=32, upscale=4, act_type='prelu')
normal = torch.load(REF / 'realesr-general-x4v3.pth', map_location='cpu', weights_only=True)['params']
weak = torch.load(REF / 'realesr-general-wdn-x4v3.pth', map_location='cpu', weights_only=True)['params']
model.load_state_dict({key: .5 * normal[key] + .5 * weak[key] for key in normal}, strict=True)
model.eval()
torch.set_num_threads(4)
path = DEST / 'realesrgan-general-x4.onnx'
torch.onnx.export(model, torch.zeros(1, 3, 64, 64), str(path), input_names=['input'], output_names=['output'],
                  opset_version=17, dynamo=False, dynamic_axes={'input': {2: 'height', 3: 'width'}, 'output': {2: 'out_height', 3: 'out_width'}})
onnx.checker.check_model(onnx.load(str(path)))
data = path.read_bytes()
manifest = {'source': 'https://github.com/xinntao/Real-ESRGAN', 'revision': REVISION, 'sources': sources,
            'denoiseWeight': .5, 'scale': 4, 'padding': 36,
            'model': {'file': path.name, 'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()}}
(DEST / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
(DEST / 'Real-ESRGAN-LICENSE.txt').write_bytes((REF / 'LICENSE').read_bytes())
print('Exported', len(data), manifest['model']['sha256'], flush=True)
