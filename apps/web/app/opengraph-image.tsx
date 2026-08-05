import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export const alt = 'WellDesk — Practice Management Software for Dietitians';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  const [jost, logoData] = await Promise.all([
    readFile(join(process.cwd(), 'assets/Jost-SemiBold.ttf')),
    readFile(join(process.cwd(), 'public/icon-512.png')),
  ]);
  const logoSrc = `data:image/png;base64,${logoData.toString('base64')}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #454e17 0%, #2f3510 100%)',
          padding: '80px',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoSrc} width={120} height={120} alt="" />
        <div
          style={{
            marginTop: 36,
            fontFamily: 'Jost',
            fontSize: 88,
            fontWeight: 600,
            color: '#ffffff',
            letterSpacing: '-0.02em',
          }}
        >
          WellDesk
        </div>
        <div
          style={{
            marginTop: 20,
            fontFamily: 'Jost',
            fontSize: 34,
            fontWeight: 600,
            color: '#c9d68f',
            textAlign: 'center',
          }}
        >
          Practice management software for dietitians
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: 'Jost', data: jost, style: 'normal', weight: 600 }],
    }
  );
}
