# MBTI 角色接入验证

- 16 张独立角色图、4 张分组案例图均保存到 public/assets/mbti/，格式均为 WebP，总大小 613,830 字节。
- 首页精选区域与工具列表的 MBTI 预览均改为新角色，未使用其他工具的人物图。
- MBTI 工具页默认载入完整 16 人格，四组案例可一键载入，仍支持自定义上传、缩放、移动和移除。
- 切换分析家/外交家案例、从四人格新增 ISTJ、恢复完整 16 人格均在浏览器中验证。
- 实际点击下载，文件名为 mbti-grid.webp；解码检查 format=webp、600×600。留存 export-analysts.webp。
- 浏览器检查：首页两处 MBTI 网格共 32 个角色引用全部加载；工具页四组案例全部加载，没有浏览器控制台错误。
- npm run build：64 页构建成功，0 errors、0 warnings。完整日志见 build.log。
- 页面效果保存为 home.webp、tool-desktop.webp。
- 360px 手机宽度：案例单列、上传区两列，页面无横向溢出；检查后已恢复默认视口。

生成原始审核稿留存在 output/mbti-characters-v1/，作为素材源；线上页面只引用转换后的 WebP。转换与人物分拆可用 node scripts/build-mbti-assets.mjs 复现。
