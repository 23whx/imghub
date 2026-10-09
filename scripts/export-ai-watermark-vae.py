"""One-time offline ONNX export. Not a website dependency or backend.

Requires local torch and onnx. Upstream MIT code/weights pinned to a commit.
"""
import hashlib
import importlib.util
import json
from pathlib import Path
import sys
import urllib.request

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / 'output/ai-watermark/export-deps'))
import torch
import onnx

REVISION = '027d3ef404a04a141e60d5ec0fee149c2c8bdd74'
SOURCE = f'https://raw.githubusercontent.com/madebyollin/taesd/{REVISION}/'
REFERENCE = ROOT / 'output/ai-watermark/references/taesd'
TARGET = ROOT / 'public/assets/ai-watermark'
REFERENCE.mkdir(parents=True, exist_ok=True)
manifest = {'source': 'https://github.com/madebyollin/taesd', 'revision': REVISION, 'models': {}}
for name in ['taesd.py', 'taesd_encoder.pth', 'taesd_decoder.pth', 'LICENSE']:
    dest = REFERENCE / name
    if not dest.exists():
        with urllib.request.urlopen(SOURCE + name, timeout=90) as response:
            dest.write_bytes(response.read())
    print(name, hashlib.sha256(dest.read_bytes()).hexdigest(), flush=True)
spec = importlib.util.spec_from_file_location('taesd_export_source', REFERENCE / 'taesd.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
torch.set_num_threads(4)
autoencoder = module.TAESD(str(REFERENCE / 'taesd_encoder.pth'), str(REFERENCE / 'taesd_decoder.pth')).eval()
for name, model, channels, size, output in [('encoder', autoencoder.encoder, 3, 256, 'latents'), ('decoder', autoencoder.decoder, 4, 32, 'image')]:
    path = TARGET / f'taesd-{name}.onnx'
    torch.onnx.export(model, torch.zeros(1, channels, size, size), str(path), input_names=['input'], output_names=[output],
                      opset_version=17, dynamo=False, dynamic_axes={'input': {2: 'height', 3: 'width'}, output: {2: 'out_height', 3: 'out_width'}})
    onnx.checker.check_model(onnx.load(str(path)))
    data = path.read_bytes()
    manifest['models'][name] = {'file': path.name, 'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()}
    print('Exported', name, len(data), flush=True)
(TARGET / 'TAESD-LICENSE.txt').write_bytes((REFERENCE / 'LICENSE').read_bytes())
(TARGET / 'taesd-manifest.json').write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
