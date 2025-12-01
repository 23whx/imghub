export async function GET({ url }) {
  const id = url.searchParams.get('bvid');

  if (!id) {
    return new Response(JSON.stringify({ error: 'Missing bvid' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // B 站官方接口：https://api.bilibili.com/x/web-interface/view
    // 文档：https://socialsisteryi.github.io/bilibili-API-collect/docs/video/info.html
    const apiUrl = `https://api.bilibili.com/x/web-interface/view?bvid=${encodeURIComponent(id)}`;
    
    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.bilibili.com/'
      }
    });

    if (!response.ok) {
      throw new Error(`Bilibili API HTTP error: ${response.status}`);
    }

    const data = await response.json();

    // B 站接口返回格式：{ code: 0, data: { pic: "...", title: "...", owner: { name: "..." } } }
    if (data.code !== 0) {
      return new Response(
        JSON.stringify({ error: data.message || 'Video not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 获取封面 URL (data.pic)
    let picUrl = data.data.pic;
    if (picUrl && picUrl.startsWith('http://')) {
      picUrl = picUrl.replace('http://', 'https://');
    }

    return new Response(
      JSON.stringify({
        url: picUrl,
        title: data.data.title,
        author: data.data.owner?.name || 'Unknown'
      }),
      {
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=3600'
        },
      }
    );

  } catch (error) {
    console.error('Bilibili API Error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch video info',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
}
