export const invisibleWatermarkCopy = {
  zh: {
    title: '隐形水印实验处理', hint: '面向 GPT-image / Nano Banana 的整图自编码器重建实验。优先使用本机 WebGPU，首次加载约 32 MB 组件。会改变细节，效果未经 SynthID 验证。',
    example: '试用整图重建示例', controls: '重建设置', backend: '运行设备', auto: '自动选择 GPU / CPU', webgpu: 'WebGPU（本机 GPU）', wasm: 'CPU（兼容模式）', resolution: '处理分辨率（最长边）', resolutionHint: '较高分辨率保留更多细节，但需要更多显存和时间。导出恢复原图尺寸；处理过程仍可能损失细节。', strength: '潜空间扰动', strengthHint: '0 也会经过有损模型重建。每次从原图处理，避免叠加损失。', seed: '随机种子', low: '低扰动', standard: '标准', strong: '高扰动',
    status: '隐形水印状态：未验证', done: '实验性重建已完成；不能确认隐形水印已去除。', report: '处理记录', device: '实际运行设备', software: 'WebGPU（软件适配器）', quality: '画质差异 PSNR', qualityHint: '仅衡量与原图的像素差异，不是水印检测分数。', seconds: '秒', duration: '处理耗时', stale: '参数已调整，请重新处理后下载。',
    stages: { gpuCheck: '正在检查本机 GPU…', vaeModel: '正在加载重建模型…', vaeInitialize: '正在准备重建模型…', vaeEncode: '正在编码整张图片…', vaeDecode: '正在重建整张图片…', gpuFallback: 'GPU 运行失败，正在切换 CPU…' },
    errors: { gpuUnavailable: '当前浏览器没有可用 WebGPU。请选择自动或 CPU 兼容模式。', reconstruction: '模型重建失败，请降低处理分辨率，或切换 CPU 后重试。', settings: '请检查处理参数；随机种子必须为 1–2147483647 的整数。' },
  },
  en: {
    title: 'Invisible watermark experiment', hint: 'Whole-image autoencoder reconstruction for GPT-image / Nano Banana experiments. Uses local WebGPU when available; first use loads about 32 MB. Alters detail; not verified with SynthID.',
    example: 'Try whole-image reconstruction', controls: 'Reconstruction settings', backend: 'Execution device', auto: 'Automatic GPU / CPU', webgpu: 'WebGPU (local GPU)', wasm: 'CPU (compatibility)', resolution: 'Working resolution (longest edge)', resolutionHint: 'Higher resolution retains more detail but needs more GPU memory and time. Export returns to original dimensions; detail can still be lost.', strength: 'Latent perturbation', strengthHint: 'Even 0 performs lossy model reconstruction. Each run starts from the original.', seed: 'Random seed', low: 'Low', standard: 'Standard', strong: 'High',
    status: 'Invisible watermark: unverified', done: 'Experimental reconstruction completed. Invisible watermark removal is unverified.', report: 'Processing report', device: 'Actual execution device', software: 'WebGPU (software adapter)', quality: 'Image difference PSNR', qualityHint: 'Measures pixel differences from the original, not watermark detection.', seconds: 'seconds', duration: 'Processing time', stale: 'Settings changed. Process again before downloading.',
    stages: { gpuCheck: 'Checking local GPU…', vaeModel: 'Loading reconstruction models…', vaeInitialize: 'Preparing reconstruction models…', vaeEncode: 'Encoding the whole image…', vaeDecode: 'Reconstructing the whole image…', gpuFallback: 'GPU failed. Switching to CPU…' },
    errors: { gpuUnavailable: 'WebGPU is unavailable. Choose Automatic or CPU compatibility mode.', reconstruction: 'Reconstruction failed. Lower the working resolution or try CPU.', settings: 'Check settings. Seed must be an integer between 1 and 2147483647.' },
  },
  ja: {
    title: '不可視透かしの実験処理', hint: 'GPT-image / Nano Banana 向けの画像全体のオートエンコーダー再構築実験。利用可能なら端末の WebGPU を使用し、初回は約 32 MB を読み込みます。細部が変わり、SynthID による検証は未実施です。',
    example: '画像全体の再構築サンプル', controls: '再構築設定', backend: '実行デバイス', auto: 'GPU / CPU 自動選択', webgpu: 'WebGPU（端末の GPU）', wasm: 'CPU（互換モード）', resolution: '処理解像度（長辺）', resolutionHint: '高解像度ほど細部を残せますが、メモリと時間が必要です。出力は元の寸法に戻しますが、細部が失われる場合があります。', strength: '潜在空間の摂動', strengthHint: '0 でも非可逆なモデル再構築を行います。毎回、元画像から処理します。', seed: '乱数シード', low: '低', standard: '標準', strong: '高',
    status: '不可視透かし：未検証', done: '実験的な再構築が完了しました。不可視透かしの除去は未検証です。', report: '処理記録', device: '実際の実行デバイス', software: 'WebGPU（ソフトウェア）', quality: '画質の差 PSNR', qualityHint: '元画像との画素の差です。透かしの検出スコアではありません。', seconds: '秒', duration: '処理時間', stale: '設定を変更しました。再処理してから保存してください。',
    stages: { gpuCheck: 'GPU を確認中…', vaeModel: '再構築モデルを読み込み中…', vaeInitialize: 'モデルを準備中…', vaeEncode: '画像全体を符号化中…', vaeDecode: '画像全体を再構築中…', gpuFallback: 'GPU で失敗。CPU に切り替え中…' },
    errors: { gpuUnavailable: 'WebGPU を利用できません。自動または CPU を選択してください。', reconstruction: '再構築に失敗しました。解像度を下げるか CPU でお試しください。', settings: '設定を確認してください。シードは 1–2147483647 の整数です。' },
  },
};
