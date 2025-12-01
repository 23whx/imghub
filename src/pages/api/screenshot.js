import puppeteer from 'puppeteer';

export const POST = async ({ request }) => {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url) {
      return new Response(JSON.stringify({ error: 'URL is required' }), { status: 400 });
    }

    // 启动浏览器
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    
    // 设置视口大小，高度设大一点以加载更多内容，宽度设为常见的桌面宽度
    await page.setViewport({ width: 1920, height: 1080 });

    // 访问页面
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });

    // 滚动到底部以触发懒加载
    await page.evaluate(async () => {
      await new Promise((resolve) => {
        let totalHeight = 0;
        const distance = 100;
        const timer = setInterval(() => {
          const scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;

          if (totalHeight >= scrollHeight) {
            clearInterval(timer);
            resolve();
          }
        }, 100);
      });
    });

    // 再次等待以确保内容加载
    await new Promise(r => setTimeout(r, 1000));

    // 截取全屏
    const screenshotBuffer = await page.screenshot({
      fullPage: true,
      type: 'jpeg',
      quality: 80
    });

    await browser.close();

    // 返回图片数据
    return new Response(screenshotBuffer, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=3600' // 缓存1小时
      }
    });

  } catch (error) {
    console.error('Screenshot error:', error);
    return new Response(JSON.stringify({ error: 'Failed to capture screenshot', details: error.message }), { status: 500 });
  }
};
