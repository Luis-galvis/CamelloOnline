import { NextResponse } from 'next/server';

export async function GET() {
  const host = 'www.camelloonline.com';
  const key = 'c9a87f1e63d24219a5840e7912bc8d31';
  const keyLocation = `https://${host}/${key}.txt`;

  const urlList = [
    `https://${host}/`,
    `https://${host}/remoto-colombia`,
    `https://${host}/ventas-comercial`,
    `https://${host}/jobs`,
    `https://${host}/talent`,
    `https://${host}/claim-job`,
  ];

  try {
    const payload = {
      host,
      key,
      keyLocation,
      urlList,
    };

    const res = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify(payload),
    });

    return NextResponse.json({
      success: res.ok,
      status: res.status,
      message: res.ok 
        ? 'IndexNow notification sent successfully to Bing, Yandex and participating search engines.' 
        : 'IndexNow submission completed with status ' + res.status,
      submittedUrls: urlList,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error?.message || 'Error submitting to IndexNow',
    }, { status: 500 });
  }
}
