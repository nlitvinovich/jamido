import { ImageResponse } from 'next/og';

export const size = {
  width: 512,
  height: 512,
};
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#FAF8F5',
          padding: '32px',
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            border: '8px solid #3E4A3F',
            borderRadius: '96px',
          }}
        >
          <span
            style={{
              fontSize: 220,
              fontFamily: 'Georgia, serif',
              color: '#3E4A3F',
              lineHeight: 1,
              marginTop: '-10px',
            }}
          >
            J
          </span>
          <span
            style={{
              fontSize: 34,
              letterSpacing: '0.28em',
              color: '#5D6D5E',
              marginTop: '12px',
              fontFamily: 'sans-serif',
            }}
          >
            JAMIDO
          </span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
