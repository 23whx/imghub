# SEO 上线与持续行动计划

## 已完成的代码工作

| 优先级 | 问题 | 实施 | 验证 |
| --- | --- | --- | --- |
| 高 | 正式域名与 canonical、robots、sitemap 不一致 | 单一 siteConfig，统一 `https://imghub.oumashu.top` | 全部 51 个可索引页面 canonical 和语言链接匹配 |
| 高 | 工具页缺少可抓取的操作说明 | 13 工具 × 3 语言的用途、步骤、限制、FAQ 与关联链接 | 39 份说明存在于初始静态 HTML |
| 高 | 隐藏工具仍可索引 | 6 个页面 `noindex, follow`，移除语言替代和应用 schema | 排除 sitemap，保留爬取以读取 noindex |
| 高 | 英文/日文法律页面使用中文正文 | 完整翻译隐私和条款、保留原政策实质 | 6 个页面拥有各自语言正文 |
| 中 | 分享图片缺失、作者旧账号 | 新建 1200×630 PNG 与准确分享信息 | 本地资产存在、尺寸和元数据一致 |
| 中 | URL 重复与静态重定向延迟 | Astro 永久即时回退，Vercel 308 和尾斜杠配置 | 19 个回退目标存在；生产 HTTP 待上线验证 |
| 中 | Sitemap 每次构建伪造更新时间 | 删除未经维护的 lastmod 及 Google 忽略字段 | XML 中只含索引页面和语言链接 |
| 中 | 缺少发布回归检查 | `test:seo`、`audit:seo` | 当前构建静态检查全部通过 |

## 发布当日：依赖站点所有者

1. 将当前版本通过原 Vercel 项目发布，并确认自定义域名使用本版本。代码完成不等于生产已更新。
2. 检查 `/robots.txt` 的 sitemap 域名、`/sitemap.xml` 的 51 条 URL、`/og-image.png` 的可访问性。
3. 请求 `/`、`/about`、`/tools/image-compress`、`/zh`，确认永久重定向最终落到带尾斜杠的新地址；检查不存在的工具返回真实 404。Vercel 的规范化可能产生额外一跳，应以上线实测为准。
4. 确认正式域名响应没有 `X-Robots-Tag: noindex`；`.vercel.app` 预览域名带此头。自定义预览域名需另行配置，不自动包含在规则中。
5. 在 Google Search Console 添加准确的 URL 前缀属性 `https://imghub.oumashu.top/`，或使用具有管理权限的域名属性。验证所有权后提交 `sitemap.xml`。
6. 如选择 HTML 标签验证，只把 Google 提供的 content 值配置到 `PUBLIC_GOOGLE_SITE_VERIFICATION`，重新构建发布。DNS 属性验证在域名管理平台操作；不能用 HTML 标签替代。
7. 使用 URL Inspection 实时测试首页、画图、压缩、OCR，以及本次图片变清晰、AI 图片去水印三种语言的代表页面，核对抓取正文、用户指定 canonical、Google 选择的 canonical 和是否允许索引。
8. 用 Rich Results Test 检查面包屑；WebApplication 没有真实评分或评论，不保证软件应用富结果。不要为通过检查捏造五星评价。

## 第一周：获得真实基线

- Search Console 记录已索引页面、排除原因、展示次数、点击、CTR 和查询/页面/国家/设备分布。`site:` 查询只能作粗略发现检查。
- 首批优先观察画图、压缩、OCR 三个工具及已有曝光的具体词，不用总体平均排名代替单一查询表现。
- PageSpeed Insights 或 Lighthouse 对同一版本、同一环境至少测 3 次，保存版本、时间、设备及中位数。首次匿名 API 调用本次返回 429，没有获得有效性能数据。
- 有 CrUX/Search Console 数据后，看移动与桌面的 p75 LCP ≤2.5s、INP ≤200ms、CLS ≤0.1；数据不足时记为不可用，不能记为通过。[Google web.dev 阈值说明](https://web.dev/articles/defining-core-web-vitals-thresholds)
- 若跟踪工具使用率，只收集操作事件，避免记录图片、OCR 文本或编辑内容。新增第三方分析应按实际隐私选择配置。

## 后续 4–8 周：内容与发现

- 用真实使用素材补充“压缩到 200KB”“照片图层编辑”“截图提取文字”等可复现案例，展示输入设置、结果、限制和维护日期。先验证需求再创建独立教程，避免批量生成同质薄内容。
- 对有曝光低点击的页面，核对搜索意图与标题；对高点击低完成率的页面，优先修复工具体验。保留修改前后同口径记录。
- 提供准确的作者介绍、公开项目资源和反馈渠道。通过有用的案例自然获得引用；不购买垃圾链接、不群发、不未经授权联系他人。
- 每次公开新工具前补齐三语标题、说明、内部链接，执行构建与审计；每次实际更新内容后再维护 lastmod 记录。

以上步骤改善可抓取性、内容匹配和体验。Google 的抓取、收录及排名仍由搜索系统决定，不能承诺首页、第一名或固定见效时间。[Google 官方说明](https://developers.google.com/search/docs/fundamentals/seo-starter-guide)
