import { ImageResponse } from 'next/og';

export const size = {
  width: 180,
  height: 180,
};
export const contentType = 'image/png';

export default function AppleIcon() {
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
          backgroundColor: '#3E4A3F',
        }}
      >
        <span
          style={{
            fontSize: 88,
            fontFamily: 'Georgia, serif',
            color: '#FAF8F5',
            lineHeight: 1,
          }}
        >
          J
        </span>
        <span
          style={{
            fontSize: 13,
            letterSpacing: '0.25em',
            color: '#DCD6CA',
            marginTop: '6px',
            fontFamily: 'sans-serif',
          }}
        >
          JAMIDO
        </span>
      </div>
    ),
    {
      ...size,
    }
  );
}
