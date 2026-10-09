# ImgHub SEO 审计与实施报告

> 最新新增工具技术 SEO 验证见 [TOOLS-UPDATE.md](./TOOLS-UPDATE.md)：13 个公开工具、51 个可索引页面、39 份三语说明，3,462 项静态断言通过。下文保留首轮审计的原始计数与生产基线，供前后比较。

日期：2026-10-03。正式域名：**https://imghub.oumashu.top/**。业务类型：免费在线图片工具集合；Astro 静态输出，React 工具交互，中文/英文/日文页面，生产平台 Vercel。

## 结论与证据范围

当前代码已完成域名统一、工具搜索意图与正文补充、多语言一致性、索引控制、分享信息、结构化数据和部署配置。构建及静态审计通过。**生产站检查发生在这次改动发布之前，不能视为线上修复完成。** 没有发布生产、提交 Search Console、购买链接或对外发送消息。

未给出全站 SEO 健康总分：没有 Search Console、CrUX、关键词量或链接数据，PageSpeed 匿名 API 返回 429；不能用源码条件推算性能或 Google 排名。当前的 3,135 项静态断言是工程回归检查数量，不是搜索排名权重或流量预测。

应用的技能：`marketingskills` 的 `marketing-seo-audit`，`claude-seo` 的审计与技术 SEO，以及 `web-quality-skills` 的 SEO、Core Web Vitals 测量指导。按审计技能分工核查工具实际功能、法律页面语言和独立全站检查。优先采用当前 Google Search Central 官方规范。

## 首轮生产证据

详见 `production-baseline.json`：`/`、`/robots.txt`、`/sitemap.xml` 返回 200，HTTPS 可访问，服务端标记 Vercel。生产 root 当时仍是旧版中文首页。robots 实际把 sitemap 指向 `https://imghub.com/sitemap.xml`，与用户确认的正式域名不同。

源码与旧构建还发现：缺失默认 `/og-image.png`，旧 Twitter 作者账号，未公开工具仍允许索引，英文/日文法律页主要正文仍为中文，sitemap 每次构建使用当前时间作为全部页面的更新时间。新 AI 示例资产在最终构建前已存在，最新资源审计通过。

## 技术 SEO

- `siteConfig` 统一正式域名、品牌、作者、邮箱和社交账号。canonical 根据已知语言与页面路径生成，不包含访问时的跟踪查询或片段；分享 URL 和结构化数据使用同一域名。
- 所有 48 个可索引页面自引用 canonical。每页有中文、英文、日文与英文 x-default 的互相对应链接，HTML lang 与实际语言匹配。
- Sitemap 只列出 48 个可索引页面，含 4 条语言替代链接；排除旧路由、根跳转和 6 个隐藏工具页。没有伪造 lastmod，删除 Google 忽略的 priority/changefreq。[Google sitemap 规范](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)
- 隐藏 `screenshot`、`watermark-remover` 页面使用 `noindex, follow`，保留可抓取性以让搜索引擎读取该指令；不发布它们的应用 schema 或 hreflang。
- 根路径与旧单语地址使用永久跳转声明，静态 HTML 回退立即跳转，目标带尾斜杠。Vercel 另提供 HTTP 308 和尾斜杠规范化；实际边缘响应待部署后检查。[Vercel 配置规范](https://vercel.com/docs/project-configuration/vercel-json)
- 本地未知工具路径实测返回 404。没有增加把所有未知地址改写到首页的兜底规则。
- 开发预览 `.vercel.app` 域名配置 `X-Robots-Tag: noindex`。正式自定义域名不匹配该规则；自定义预览域名仍需显式设置。
- Search Console HTML 验证标签由可选环境变量提供，未填入任何虚构验证码。没有站点所有者授权凭据，收录状态不可用。

## 页面与关键词

每个工具使用独立的本地化标题、简介与 H1，首页明确“在线图片工具”主题。中文 OCR 使用“图片转文字 / 图片文字识别”，压缩页突出 JPG、PNG、WebP、目标 KB 与画质，切片页补充图片分割和九宫格用途。首页集合主题与工具操作主题分开，保留已有 URL。

关键词方案见 `KEYWORD-MAP.md`，包括 12 工具和三种语言的主/辅助词。公开搜索样本用于校准意图，不提供虚构的搜索量、难度或 Google 排名。保留的 meta keywords 不作为 Google 优化成果；Google 不使用该字段排名。[Google SEO 指南](https://developers.google.com/search/docs/fundamentals/seo-starter-guide)

## 内容、信任与语言

新增 **36 份静态工具说明**。每份包括用途、3 步操作、格式/限制、2 个独立问题与答案、2–3 个公开关联工具。正文在初始 HTML 中，不依赖 React 加载后注入。说明依据当前工具实现，避免承诺 PSD、OCR 文本文件下载、自动音频字幕、人格诊断、不可见 SynthID 移除或任意浏览器 MP4 导出等未支持能力。

英文与日文隐私政策、使用条款采用完整翻译，保留原政策实质和日期。关于页、联系邮箱和 X 账号一致，Person 与 AboutPage 对应真实作者身份，没有捏造证书、用户数量或专家评价。

未来的内容提升应来自可复现的真实案例、有效输入和实际输出；工具说明没有固定字数排名承诺。现有静态知识文本也方便答案型检索理解，但没有“AI 引用保证”或可验证的引用分数。

## 结构化数据

每页有一份可解析 JSON-LD graph：Person、WebSite、WebPage/CollectionPage/AboutPage；公开工具另有 WebApplication 与 BreadcrumbList，首页有实际工具 ItemList。实体 ID 连接作者、站点、页面、应用和面包屑。输出转义 `<`、`>`、`&` 与行分隔字符，防止原始脚本元素被文本提前结束。

WebApplication 描述真实免费价格、浏览器运行要求、页面 URL。**没有真实评分或评论，因此不满足 Google 软件应用富结果的全部要求，不能宣称获得星级富结果。** 保留准确语义信息，未伪造评价。[Google 软件应用规范](https://developers.google.com/search/docs/appearance/structured-data/software-app)

FAQ 为用户可见正文，没有为富结果添加 FAQPage。Google 已宣布 FAQ 富结果自 2026-05-07 不再展示；llms.txt 也不影响 Google 可见性或排名，因此本次不把这些作为排名措施。[Google 文档更新](https://developers.google.com/search/updates)

## 图片、性能与移动端

修复默认分享图缺失，新增原创暖色品牌 PNG，1200×630、约 73KB；OG 与 Twitter 有图片替代说明，默认图尺寸及 MIME 元信息准确。站内 img 均有 alt 属性及尺寸；用于装饰或由标题已充分描述的图片保留空 alt，不填关键词。静态资源引用已检查。

保持现有首屏 picture、移动/桌面 WebP、尺寸预留、预加载和高优先级标记。非首屏作品图延迟加载，字体自托管并使用 swap。AI 约 29.5MB 模型仅在用户请求修复后加载，并非首页初始请求。新增指南为静态 HTML，不增加交互脚本；`/_astro/` 带哈希资源配置长期缓存。

上述为已观察的资源条件，不代表 LCP、INP、CLS 已通过。没有浏览器 trace 或真实用户 p75；匿名 PageSpeed 请求返回 429 并已记录于 `pagespeed-baseline.json`，未重试绕过配额。[PageSpeed API 文档](https://developers.google.com/speed/docs/insights/v5/get-started)

浏览器检查涵盖中文压缩工具桌面与 360px 手机布局、中文/英文手机首页、日文 OCR 指南。手机实际可视内容宽 345px（含滚动条），scrollWidth 同为 345px，无水平溢出；创作入口保持指向各自语言在线画图。截图见 `screenshots/`。

## 验证结果

| 项目 | 结果 |
| --- | --- |
| `npm run build` | 72 页面构建通过；Astro 检查 0 errors、0 warnings，仍有既存的未使用变量等 hints |
| `npm run test:seo` | 4 项回归测试通过，包括 JSON-LD 脚本结束字符防护与隐藏工具排除 |
| `npm run audit:seo` | 54 内容页、48 可索引页、36 工具指南、6 noindex 页面、18 跳转回退 |
| 内部链接与 HTML 资源 | 1,578 个引用；3,135 项静态断言；0 错误 |
| 未知工具地址 | 本地 HTTP 404 |
| 生产修复后验证 | 等待部署当前版本 |
| GSC 收录、流量、排名 | 不可用，需站点所有者属性权限 |
| CWV/PSI | 不可用，API 429；没有有效测量 |
| 外链与权威性 | 未获取付费外链库数据；没有对外推广操作 |

复现：`npm run test:seo` → `npm run build` → `npm run audit:seo`。详细记录在 `static-audit.json`、`findings/independent.md`，上线和长期行动见 `ACTION-PLAN.md`。

Google 不保证收录或靠前排名。当前改动解决可控的代码和内容问题；后续应基于真实抓取、展示、点击与工具使用体验持续改进。[Google 官方说明](https://developers.google.com/search/docs/fundamentals/seo-starter-guide)
