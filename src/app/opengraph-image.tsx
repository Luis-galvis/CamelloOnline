import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'CamelloOnline - Portal de Empleo Colombia & Trabajo Remoto';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #090d16 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px 80px',
          fontFamily: 'sans-serif',
          position: 'relative',
        }}
      >
        {/* Glow ambient effects */}
        <div
          style={{
            position: 'absolute',
            top: '-10%',
            left: '10%',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(245, 158, 11, 0.25) 0%, transparent 70%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-10%',
            right: '10%',
            width: '450px',
            height: '450px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99, 102, 241, 0.25) 0%, transparent 70%)',
          }}
        />

        {/* Top badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '9999px',
            padding: '10px 24px',
            marginBottom: '32px',
          }}
        >
          <span style={{ fontSize: '20px' }}>🇨🇴</span>
          <span
            style={{
              color: '#f59e0b',
              fontSize: '18px',
              fontWeight: 800,
              letterSpacing: '2px',
              textTransform: 'uppercase',
            }}
          >
            Portal de Empleo & Trabajo Remoto
          </span>
        </div>

        {/* Brand Name */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            fontSize: '72px',
            fontWeight: 900,
            letterSpacing: '-2px',
            marginBottom: '16px',
            color: '#ffffff',
          }}
        >
          <span>CAMELLO</span>
          <span
            style={{
              background: 'linear-gradient(90deg, #f59e0b, #fbbf24)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginLeft: '8px',
            }}
          >
            ONLINE
          </span>
          <span style={{ fontSize: '48px', marginLeft: '12px' }}>.COM</span>
        </div>

        {/* Subtitle / Value Proposition */}
        <p
          style={{
            fontSize: '26px',
            color: '#94a3b8',
            textAlign: 'center',
            maxWidth: '900px',
            lineHeight: 1.4,
            marginBottom: '40px',
          }}
        >
          Encuentra camello verificado en Colombia y el mundo: Tech, Inteligencia Artificial, Ventas y Salarios en USD
        </p>

        {/* Highlight Pills */}
        <div
          style={{
            display: 'flex',
            gap: '16px',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#34d399',
              padding: '12px 22px',
              borderRadius: '16px',
              fontSize: '18px',
              fontWeight: 700,
            }}
          >
            ✓ Ofertas 100% Verificadas
          </div>
          <div
            style={{
              background: 'rgba(99, 102, 241, 0.15)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              color: '#a5b4fc',
              padding: '12px 22px',
              borderRadius: '16px',
              fontSize: '18px',
              fontWeight: 700,
            }}
          >
            💵 Remoto en Dólares ($USD)
          </div>
          <div
            style={{
              background: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              color: '#fcd34d',
              padding: '12px 22px',
              borderRadius: '16px',
              fontSize: '18px',
              fontWeight: 700,
            }}
          >
            ⚡ Sin Intermediarios
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
