/* global React */
const { useState } = React;

/* ──────────────────────────────────────────────────────────────
   Shared atoms — used across all thumbnails
   ────────────────────────────────────────────────────────────── */

const Logo = ({ variant = 'white-on-navy', height = 30, style = {} }) => {
  const src = variant === 'white-on-navy'
    ? '../assets/logo-horizontal-white-on-navy.png'
    : variant === 'mark-color'
      ? '../assets/logo-mark-color.png'
      : variant === 'mark-navy'
        ? '../assets/logo-mark-navy.png'
        : variant === 'mark-white-on-navy'
          ? '../assets/logo-mark-white-on-navy.png'
          : '../assets/logo-horizontal-navy.png';
  return <img src={src} style={{ height, ...style }} alt="15Element.AI" />;
};

const Eyebrow = ({ children, color = '#3FB2B7' }) => (
  <div style={{
    fontFamily: 'IBM Plex Sans, sans-serif',
    fontSize: 18,
    fontWeight: 700,
    letterSpacing: '0.22em',
    textTransform: 'uppercase',
    color,
    display: 'flex',
    alignItems: 'center',
    gap: 14,
  }}>
    <span style={{ width: 40, height: 2, background: color, display: 'inline-block' }} />
    {children}
  </div>
);

const ColorStripe = ({ colors = ['#7EB749', '#209499', '#ED9321', '#BD2429'], height = 8 }) => (
  <div style={{ display: 'flex', height }}>
    {colors.map((c, i) => (
      <div key={i} style={{ flex: 1, background: c }} />
    ))}
  </div>
);

const ClientChip = ({ name, role, color = '#3FB2B7', dark = true }) => (
  <div style={{
    display: 'inline-flex',
    alignItems: 'center',
    gap: 14,
    padding: '14px 20px',
    background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(20,22,42,0.04)',
    border: `1px solid ${dark ? 'rgba(255,255,255,0.12)' : 'rgba(20,22,42,0.12)'}`,
    borderRadius: 12,
  }}>
    <div style={{ width: 6, height: 38, background: color, borderRadius: 3 }} />
    <div>
      <div style={{
        fontFamily: 'Saira Condensed, sans-serif',
        fontWeight: 800,
        textTransform: 'uppercase',
        fontSize: 32,
        letterSpacing: '-0.01em',
        lineHeight: 1,
        color: dark ? '#fff' : '#2A2E46',
      }}>{name}</div>
      <div style={{
        fontFamily: 'IBM Plex Sans, sans-serif',
        fontSize: 14,
        marginTop: 4,
        color: dark ? 'rgba(255,255,255,0.6)' : '#5E6378',
      }}>{role}</div>
    </div>
  </div>
);

const PlaySticker = () => (
  <div style={{
    position: 'absolute',
    bottom: 28,
    right: 28,
    width: 64,
    height: 64,
    borderRadius: '50%',
    background: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
    zIndex: 5,
  }}>
    <svg width="22" height="22" viewBox="0 0 24 24" fill="#2A2E46"><polygon points="6,4 20,12 6,20"/></svg>
  </div>
);

const ThumbBase = ({ children, bg = '#2A2E46', style = {} }) => (
  <div style={{
    width: 1280, height: 720,
    background: bg,
    position: 'relative',
    overflow: 'hidden',
    fontFamily: 'IBM Plex Sans, sans-serif',
    color: '#fff',
    ...style,
  }}>
    {children}
  </div>
);

/* ──────────────────────────────────────────────────────────────
   01 · BIG NUMBER — testimonial stat dominates
   ────────────────────────────────────────────────────────────── */
function ThumbBigNumber({ tweaks }) {
  return (
    <ThumbBase>
      {/* corner mark watermark */}
      <img src="../assets/logo-mark-color.png" style={{
        position: 'absolute', right: -180, top: -120, width: 700, opacity: 0.10,
      }} alt="" />

      <div style={{ padding: '64px 80px', display: 'flex', flexDirection: 'column', height: '100%', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Eyebrow color="#3FB2B7">Caso real · Nextco</Eyebrow>
          <Logo variant="white-on-navy" height={28} />
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{
            fontFamily: 'Saira Condensed, sans-serif',
            fontWeight: 800,
            fontSize: 360,
            lineHeight: 0.86,
            letterSpacing: '-0.04em',
            color: '#fff',
          }}>
            842<span style={{ color: '#3FB2B7' }}>.</span>
          </div>
          <div style={{
            fontFamily: 'Saira Condensed, sans-serif',
            fontWeight: 700,
            fontSize: 48,
            letterSpacing: '-0.01em',
            lineHeight: 1,
            color: '#fff',
            marginTop: 8,
          }}>
            leads B2B en 10 meses.
          </div>
          <div style={{ fontSize: 22, color: 'rgba(255,255,255,0.6)', marginTop: 18, maxWidth: 700 }}>
            Sin Meta. Sin Google Ads. Solo LinkedIn orgánico y señales reales.
          </div>
        </div>

        <ColorStripe />
      </div>
      <PlaySticker />
    </ThumbBase>
  );
}

/* ──────────────────────────────────────────────────────────────
   02 · FACE + STAT — split: client photo + big number
   ────────────────────────────────────────────────────────────── */
function ThumbFaceStat() {
  return (
    <ThumbBase bg="#1F2236">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', height: '100%' }}>

        {/* Photo slot */}
        <div style={{ position: 'relative', background: '#353A56', overflow: 'hidden' }}>
          <image-slot
            id="thumb-face-topenergy"
            shape="rect"
            placeholder="Arrastra foto de Diego Reyes (Top Energy)"
            style={{ width: '100%', height: '100%' }}
          />
          {/* gradient mask to blend into right column */}
          <div style={{
            position: 'absolute', top: 0, right: 0, bottom: 0, width: 120,
            background: 'linear-gradient(to right, rgba(31,34,54,0), #1F2236)',
            pointerEvents: 'none',
          }} />
          {/* client tag bottom left */}
          <div style={{ position: 'absolute', bottom: 24, left: 24, zIndex: 2 }}>
            <ClientChip name="Top Energy" role="Diego R. · Director Comercial" color="#ED9321" />
          </div>
        </div>

        {/* Stat side */}
        <div style={{ padding: '64px 64px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Eyebrow color="#ED9321">Caso · Energía</Eyebrow>
            <Logo variant="white-on-navy" height={26} />
          </div>

          <div>
            <div style={{
              fontFamily: 'Saira Condensed, sans-serif',
              fontWeight: 800,
              fontSize: 280,
              lineHeight: 0.85,
              letterSpacing: '-0.03em',
              color: '#fff',
            }}>
              $9M
              <span style={{ color: '#ED9321', fontSize: '0.4em', marginLeft: 14, verticalAlign: 'super' }}>USD</span>
            </div>
            <div style={{
              fontFamily: 'Saira Condensed, sans-serif',
              fontWeight: 700,
              fontSize: 44,
              letterSpacing: '-0.01em',
              lineHeight: 1,
              color: '#fff',
              marginTop: 8,
            }}>
              cerrados por LinkedIn orgánico.
            </div>
            <div style={{ fontSize: 19, color: 'rgba(255,255,255,0.55)', marginTop: 14, maxWidth: 540 }}>
              Cómo un solo mensaje correcto generó el proyecto industrial más grande del año.
            </div>
          </div>

          <ColorStripe colors={['#ED9321', '#ED9321', '#ED9321', '#ED9321']} height={6} />
        </div>
      </div>
      <PlaySticker />
    </ThumbBase>
  );
}

/* ──────────────────────────────────────────────────────────────
   03 · QUOTE PULL — large pull quote, client below
   ────────────────────────────────────────────────────────────── */
function ThumbQuote() {
  return (
    <ThumbBase bg="#F6F7F9" style={{ color: '#2A2E46' }}>
      {/* big quote glyph */}
      <div style={{
        position: 'absolute', top: 20, left: 50,
        fontFamily: 'Saira Condensed, sans-serif',
        fontSize: 480, lineHeight: 0.8,
        color: '#209499', opacity: 0.18, fontWeight: 800,
      }}>"</div>

      <div style={{ padding: '90px 80px 60px', display: 'flex', flexDirection: 'column', height: '100%', boxSizing: 'border-box', position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Eyebrow color="#1A7B80">En sus palabras</Eyebrow>
          <Logo variant="navy" height={26} />
        </div>

        <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
          <div style={{
            fontFamily: 'Saira Condensed, sans-serif',
            fontWeight: 700,
            fontSize: 110,
            lineHeight: 0.98,
            letterSpacing: '-0.02em',
            color: '#2A2E46',
            maxWidth: 1100,
          }}>
            Tuvimos que pausar todas las campañas. No <span style={{ color: '#209499' }}>había</span> más bodega.
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <ClientChip name="Spakio" role="Carla M. · VP Operaciones · Logística B2B" color="#BD2429" dark={false} />
          <div style={{
            fontFamily: 'Saira Condensed, sans-serif',
            fontWeight: 800,
            fontSize: 88,
            color: '#BD2429',
            letterSpacing: '-0.02em',
            lineHeight: 0.9,
            textAlign: 'right',
          }}>
            100%<br/>
            <span style={{ fontSize: 22, color: '#5E6378', letterSpacing: '0.18em', fontWeight: 600 }}>OCUPACIÓN</span>
          </div>
        </div>
      </div>
      <PlaySticker />
    </ThumbBase>
  );
}

/* ──────────────────────────────────────────────────────────────
   04 · ANTES / DESPUÉS
   ────────────────────────────────────────────────────────────── */
function ThumbBeforeAfter() {
  return (
    <ThumbBase bg="#fff">
      {/* Top header */}
      <div style={{ position: 'absolute', top: 32, left: 0, right: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 56px', zIndex: 3 }}>
        <Eyebrow color="#1A7B80">Caso · Itechmaint</Eyebrow>
        <Logo variant="navy" height={26} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', height: '100%' }}>
        {/* ANTES */}
        <div style={{
          background: '#EBEDF1', padding: '120px 56px 56px',
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          color: '#5E6378',
        }}>
          <div style={{
            fontFamily: 'Saira Condensed, sans-serif',
            fontWeight: 800, fontSize: 26, letterSpacing: '0.2em',
            color: '#8C90A1',
          }}>ANTES</div>
          <div>
            <div style={{
              fontFamily: 'Saira Condensed, sans-serif',
              fontWeight: 800,
              fontSize: 96,
              lineHeight: 0.95,
              letterSpacing: '-0.02em',
              color: '#5E6378',
            }}>
              3 años
            </div>
            <div style={{
              fontFamily: 'IBM Plex Sans, sans-serif',
              fontSize: 26, marginTop: 14, lineHeight: 1.3, color: '#5E6378', maxWidth: 480,
            }}>
              intentando entrar a corporativos grandes. Sin sistema, sin tracción.
            </div>
          </div>
        </div>

        {/* DESPUÉS */}
        <div style={{
          background: '#2A2E46', padding: '120px 56px 56px',
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          color: '#fff', position: 'relative',
        }}>
          <div style={{
            fontFamily: 'Saira Condensed, sans-serif',
            fontWeight: 800, fontSize: 26, letterSpacing: '0.2em',
            color: '#3FB2B7',
          }}>DESPUÉS · 10 MESES</div>
          <div>
            <div style={{
              fontFamily: 'Saira Condensed, sans-serif',
              fontWeight: 800,
              fontSize: 110,
              lineHeight: 0.92,
              letterSpacing: '-0.025em',
              color: '#fff',
            }}>
              59.9<span style={{ color: '#3FB2B7' }}>%</span>
            </div>
            <div style={{
              fontFamily: 'IBM Plex Sans, sans-serif',
              fontSize: 26, marginTop: 14, lineHeight: 1.3, color: 'rgba(255,255,255,0.8)', maxWidth: 480,
            }}>
              tasa de conexión LinkedIn. <b style={{color:'#fff'}}>1,144 de 1,914.</b>
            </div>
          </div>
        </div>
      </div>

      {/* Arrow ribbon between */}
      <div style={{
        position: 'absolute', left: '50%', top: '50%',
        transform: 'translate(-50%, -50%)',
        width: 100, height: 100, borderRadius: '50%',
        background: '#3FB2B7',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 12px 32px rgba(20,22,42,0.4)',
        zIndex: 4,
      }}>
        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#1F2236" strokeWidth="3"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
      </div>
      <PlaySticker />
    </ThumbBase>
  );
}

/* ──────────────────────────────────────────────────────────────
   05 · SIGNAL ALERT — looks like a LinkedIn notification
   ────────────────────────────────────────────────────────────── */
function ThumbSignal() {
  return (
    <ThumbBase bg="#1F2236">
      {/* faded mark */}
      <img src="../assets/logo-mark-color.png" style={{
        position: 'absolute', left: -120, bottom: -180, width: 600, opacity: 0.06,
      }} alt="" />

      <div style={{ padding: '60px 80px', display: 'flex', flexDirection: 'column', height: '100%', boxSizing: 'border-box', position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Eyebrow color="#7EB749">Señales B2B · en vivo</Eyebrow>
          <Logo variant="white-on-navy" height={26} />
        </div>

        <div style={{
          fontFamily: 'Saira Condensed, sans-serif',
          fontWeight: 800,
          fontSize: 96,
          lineHeight: 0.95,
          letterSpacing: '-0.02em',
          marginTop: 28, marginBottom: 36,
        }}>
          Así detectamos a tu <span style={{ color: '#7EB749' }}>próximo cliente.</span>
        </div>

        {/* Mock notification card */}
        <div style={{
          background: '#fff',
          color: '#2A2E46',
          borderRadius: 16,
          padding: '22px 26px',
          display: 'grid',
          gridTemplateColumns: '48px 1fr auto',
          gap: 18,
          alignItems: 'center',
          boxShadow: '0 20px 48px rgba(0,0,0,0.4)',
          maxWidth: 1000,
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: 10,
            background: '#7EB749',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
            </svg>
          </div>
          <div>
            <div style={{ fontFamily:'IBM Plex Sans', fontSize: 14, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#5E6378' }}>
              NUEVA SEÑAL · CAMBIO DE ROL
            </div>
            <div style={{ fontSize: 22, fontWeight: 600, marginTop: 6, lineHeight: 1.3 }}>
              <b>María Fernanda López</b> · nueva CIO en Cinépolis. Empezó hace 6 días.
            </div>
          </div>
          <div style={{
            fontFamily: 'Saira Condensed, sans-serif', fontWeight: 800,
            fontSize: 64, color: '#7EB749', letterSpacing: '-0.02em', lineHeight: 0.9, textAlign: 'right',
          }}>94<div style={{fontSize:11, color: '#5E6378', letterSpacing: '0.15em', fontWeight:600}}>SCORE</div></div>
        </div>

        <div style={{ marginTop: 'auto', fontSize: 20, color: 'rgba(255,255,255,0.55)' }}>
          Cada señal es una ventana de oportunidad.
        </div>
      </div>
      <PlaySticker />
    </ThumbBase>
  );
}

/* ──────────────────────────────────────────────────────────────
   06 · COMPARISON — Ads vs Orgánico
   ────────────────────────────────────────────────────────────── */
function ThumbComparison() {
  return (
    <ThumbBase bg="#2A2E46">
      <div style={{ padding: '60px 80px', display: 'flex', flexDirection: 'column', height: '100%', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Eyebrow color="#3FB2B7">El argumento</Eyebrow>
          <Logo variant="white-on-navy" height={26} />
        </div>

        <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 1fr', gap: 0, width: '100%', alignItems: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontFamily: 'Saira Condensed, sans-serif',
                fontWeight: 800, fontSize: 110, letterSpacing: '-0.02em', lineHeight: 0.95,
                color: '#BD2429',
                textDecoration: 'line-through',
                textDecorationThickness: 6,
              }}>
                ADS
              </div>
              <div style={{ marginTop: 12, fontSize: 19, color: 'rgba(255,255,255,0.55)', lineHeight: 1.4 }}>
                Pagas. Aparecen clics. Pausas — pipeline en cero.
              </div>
            </div>

            <div style={{
              fontFamily: 'Saira Condensed, sans-serif',
              fontWeight: 800, fontSize: 80, color: '#3FB2B7',
              textAlign: 'center', letterSpacing: '-0.02em',
            }}>VS</div>

            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontFamily: 'Saira Condensed, sans-serif',
                fontWeight: 800, fontSize: 110, letterSpacing: '-0.02em', lineHeight: 0.95,
                color: '#fff',
              }}>
                ORGÁNICO
              </div>
              <div style={{ marginTop: 12, fontSize: 19, color: 'rgba(255,255,255,0.7)', lineHeight: 1.4 }}>
                Una vez construido — sigue trabajando solo.
              </div>
            </div>
          </div>
        </div>

        <div style={{
          fontFamily: 'Saira Condensed, sans-serif',
          fontWeight: 800, fontSize: 56, color: '#fff',
          letterSpacing: '-0.02em', lineHeight: 1,
          textAlign: 'center', marginBottom: 16,
        }}>
          Por qué dejamos los <span style={{ color: '#3FB2B7' }}>ads.</span>
        </div>

        <ColorStripe />
      </div>
      <PlaySticker />
    </ThumbBase>
  );
}

/* ──────────────────────────────────────────────────────────────
   07 · BOLD CLAIM — un statement, fondo color
   ────────────────────────────────────────────────────────────── */
function ThumbBoldClaim() {
  return (
    <ThumbBase bg="#7EB749">
      <div style={{ padding: '60px 80px', display: 'flex', flexDirection: 'column', height: '100%', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Eyebrow color="#1F2236">Tesis · Episodio 01</Eyebrow>
          <Logo variant="navy" height={28} />
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
          <div style={{
            fontFamily: 'Saira Condensed, sans-serif',
            fontWeight: 800,
            fontSize: 200,
            lineHeight: 0.86,
            letterSpacing: '-0.03em',
            color: '#1F2236',
          }}>
            Tu pipeline<br/>
            no es <span style={{ color: '#fff' }}>marketing.</span><br/>
            Es <span style={{ color: '#fff' }}>matemática.</span>
          </div>
        </div>
        <div style={{
          fontFamily: 'IBM Plex Sans', fontSize: 22, color: '#1F2236',
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
        }}>
          <span>Por qué el azar dejó de ser tu estrategia.</span>
          <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 14, letterSpacing:'0.12em' }}>EP · 01 / 12</span>
        </div>
      </div>
      <PlaySticker />
    </ThumbBase>
  );
}

/* ──────────────────────────────────────────────────────────────
   08 · FULL-BLEED PHOTO — foto del cliente domina
   ────────────────────────────────────────────────────────────── */
function ThumbFullBleed() {
  return (
    <ThumbBase bg="#1F2236">
      <image-slot
        id="thumb-fullbleed-nextco"
        shape="rect"
        placeholder="Arrastra foto del cliente Nextco aquí (full-bleed)"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      />
      {/* dark overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to top, rgba(20,22,42,0.92) 0%, rgba(20,22,42,0.65) 40%, rgba(20,22,42,0.15) 100%)',
        pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative', zIndex: 2, padding: '52px 80px', display: 'flex', flexDirection: 'column', height: '100%', boxSizing: 'border-box', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Eyebrow color="#3FB2B7">Testimonio · Nextco</Eyebrow>
          <Logo variant="white-on-navy" height={26} />
        </div>

        <div>
          <div style={{
            fontFamily: 'Saira Condensed, sans-serif',
            fontWeight: 800,
            fontSize: 116,
            lineHeight: 0.92,
            letterSpacing: '-0.025em',
            color: '#fff',
            maxWidth: 1100,
          }}>
            "Cerramos <span style={{ color: '#3FB2B7' }}>BOSCH, Continental y SuKarne</span> sin conocer a nadie adentro."
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginTop: 28 }}>
            <div style={{ width: 6, height: 56, background: '#7EB749', borderRadius: 3 }} />
            <div>
              <div style={{ fontSize: 22, fontWeight: 600, color: '#fff' }}>Nextco</div>
              <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.65)' }}>Tech B2B · México</div>
            </div>
            <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
              <div style={{
                fontFamily: 'Saira Condensed, sans-serif', fontWeight: 800,
                fontSize: 80, color: '#7EB749', letterSpacing: '-0.02em', lineHeight: 0.9,
              }}>842<span style={{ fontSize: 22, color: 'rgba(255,255,255,0.55)', fontFamily: 'IBM Plex Sans', fontWeight:600, marginLeft: 10, letterSpacing: '0.12em', textTransform: 'uppercase' }}>LEADS</span></div>
            </div>
          </div>
        </div>
      </div>
      <PlaySticker />
    </ThumbBase>
  );
}

/* ──────────────────────────────────────────────────────────────
   09 · MULTI-STAT — dashboard pequeño con varios casos
   ────────────────────────────────────────────────────────────── */
function ThumbMultiStat() {
  return (
    <ThumbBase bg="#2A2E46">
      <div style={{ padding: '60px 80px', display: 'flex', flexDirection: 'column', height: '100%', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Eyebrow color="#3FB2B7">Resultados reales · 2025</Eyebrow>
          <Logo variant="white-on-navy" height={26} />
        </div>

        <div style={{
          fontFamily: 'Saira Condensed, sans-serif',
          fontWeight: 800,
          fontSize: 80,
          lineHeight: 0.95,
          letterSpacing: '-0.02em',
          color: '#fff',
          marginTop: 24,
          marginBottom: 36,
        }}>
          5 casos B2B en <span style={{ color: '#3FB2B7' }}>12 meses.</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 18, flex: 1 }}>
          {[
            { num: '842', label: 'leads · Nextco', color: '#7EB749' },
            { num: '$9M', label: 'cerrado · Top Energy', color: '#ED9321', sup: 'USD' },
            { num: '59.9%', label: 'conexión · Itechmaint', color: '#3FB2B7' },
            { num: '+320%', label: 'inbound · LeaseMD', color: '#BD2429' },
          ].map((s, i) => (
            <div key={i} style={{
              padding: '24px 22px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.10)',
              borderRadius: 12,
              display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            }}>
              <div style={{ width: 36, height: 4, background: s.color, borderRadius: 2 }} />
              <div>
                <div style={{
                  fontFamily: 'Saira Condensed, sans-serif',
                  fontWeight: 800, fontSize: 70, lineHeight: 0.9, color: '#fff', letterSpacing: '-0.02em',
                }}>{s.num}{s.sup && <span style={{ fontSize: 22, color: s.color, marginLeft: 6, verticalAlign: 'super' }}>{s.sup}</span>}</div>
                <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.6)', marginTop: 10, lineHeight: 1.3 }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{
          fontFamily: 'IBM Plex Sans', fontSize: 18, color: 'rgba(255,255,255,0.55)',
          marginTop: 24, display: 'flex', justifyContent: 'space-between',
        }}>
          <span>Pipeline B2B sin anuncios. Sin demos. Sin proyecciones.</span>
          <span style={{ fontFamily: 'IBM Plex Mono', letterSpacing: '0.12em' }}>100% ORGÁNICO</span>
        </div>
      </div>
      <PlaySticker />
    </ThumbBase>
  );
}

/* ──────────────────────────────────────────────────────────────
   10 · QUESTION HOOK — pregunta + respuesta visual
   ────────────────────────────────────────────────────────────── */
function ThumbHook() {
  return (
    <ThumbBase bg="#fff" style={{ color: '#2A2E46' }}>
      <div style={{ padding: '60px 80px', display: 'flex', flexDirection: 'column', height: '100%', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Eyebrow color="#1A7B80">La pregunta</Eyebrow>
          <Logo variant="navy" height={26} />
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 20 }}>
          <div style={{
            fontFamily: 'Saira Condensed, sans-serif',
            fontWeight: 700,
            fontSize: 84,
            lineHeight: 0.98,
            letterSpacing: '-0.02em',
            color: '#5E6378',
          }}>
            ¿Se puede cerrar
          </div>
          <div style={{
            fontFamily: 'Saira Condensed, sans-serif',
            fontWeight: 800,
            fontSize: 180,
            lineHeight: 0.86,
            letterSpacing: '-0.03em',
            color: '#2A2E46',
          }}>
            $9M USD
          </div>
          <div style={{
            fontFamily: 'Saira Condensed, sans-serif',
            fontWeight: 700,
            fontSize: 84,
            lineHeight: 0.98,
            letterSpacing: '-0.02em',
            color: '#5E6378',
          }}>
            sin <span style={{ color: '#BD2429', textDecoration: 'line-through', textDecorationThickness: 5 }}>ads</span>?
          </div>
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', gap: 16,
          padding: '20px 28px',
          background: '#7EB749',
          borderRadius: 12,
          color: '#fff',
          fontFamily: 'Saira Condensed, sans-serif',
          fontWeight: 800, fontSize: 36, letterSpacing: '-0.01em',
          width: 'fit-content',
        }}>
          Spoiler: sí. Y así.
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
        </div>
      </div>
      <PlaySticker />
    </ThumbBase>
  );
}

/* ──────────────────────────────────────────────────────────────
   11 · CLIENT SERIES — labelled "EP" with portrait slot
   ────────────────────────────────────────────────────────────── */
function ThumbSeries() {
  return (
    <ThumbBase bg="#1F2236">
      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', height: '100%' }}>

        {/* Left: typo */}
        <div style={{ padding: '60px 64px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{
              fontFamily: 'IBM Plex Mono', fontSize: 14, color: '#3FB2B7',
              letterSpacing: '0.22em', textTransform: 'uppercase', fontWeight: 600,
              marginBottom: 18,
            }}>SERIE · TESTIMONIOS B2B</div>
            <Logo variant="white-on-navy" height={26} />
          </div>

          <div>
            <div style={{
              fontFamily: 'Saira Condensed, sans-serif',
              fontWeight: 800,
              fontSize: 240,
              lineHeight: 0.85,
              letterSpacing: '-0.04em',
              color: '#3FB2B7',
            }}>
              03
            </div>
            <div style={{
              fontFamily: 'Saira Condensed, sans-serif',
              fontWeight: 800,
              fontSize: 64,
              lineHeight: 1,
              letterSpacing: '-0.02em',
              color: '#fff',
              marginTop: 16,
            }}>
              Cómo Top Energy<br/>cerró $9M USD.
            </div>
            <div style={{ fontSize: 18, color: 'rgba(255,255,255,0.55)', marginTop: 14, maxWidth: 480 }}>
              LinkedIn orgánico · Industrial · 4 meses
            </div>
          </div>

          <ColorStripe colors={['#ED9321', '#ED9321', '#ED9321', '#ED9321']} height={6} />
        </div>

        {/* Right: portrait slot */}
        <div style={{ position: 'relative', background: '#353A56', overflow: 'hidden' }}>
          <image-slot
            id="thumb-series-portrait"
            shape="rect"
            placeholder="Foto del cliente Top Energy"
            style={{ width: '100%', height: '100%' }}
          />
          {/* color stripe overlay on left */}
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 8, background: '#ED9321' }} />
        </div>
      </div>
      <PlaySticker />
    </ThumbBase>
  );
}

/* ──────────────────────────────────────────────────────────────
   12 · MINIMALIST — anti-clickbait
   ────────────────────────────────────────────────────────────── */
function ThumbMinimal() {
  return (
    <ThumbBase bg="#F6F7F9" style={{ color: '#2A2E46' }}>
      <div style={{ padding: '80px 96px', display: 'flex', flexDirection: 'column', height: '100%', boxSizing: 'border-box' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{
              fontFamily: 'IBM Plex Mono', fontSize: 14,
              letterSpacing: '0.22em', textTransform: 'uppercase',
              color: '#8C90A1', fontWeight: 600,
            }}>15ELEMENT.AI · TESTIMONIOS</div>
            <div style={{
              fontFamily: 'IBM Plex Mono', fontSize: 12, color: '#BDBEC0', letterSpacing: '0.12em',
            }}>EP 04 · DURACIÓN 18:32 · ESPAÑOL</div>
          </div>
          <Logo variant="navy" height={22} />
        </div>

        <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
          <div>
            <div style={{
              fontFamily: 'Saira Condensed, sans-serif',
              fontWeight: 700,
              fontSize: 130,
              lineHeight: 0.95,
              letterSpacing: '-0.025em',
              color: '#2A2E46',
            }}>
              Itechmaint, <span style={{ color: '#209499' }}>Chile.</span><br/>
              1,144 conexiones<br/>
              en <span style={{ color: '#209499' }}>5 meses.</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: 28, paddingTop: 24, borderTop: '1px solid #D8DBE3' }}>
          <div>
            <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#8C90A1', letterSpacing: '0.18em', textTransform: 'uppercase' }}>CLIENTE</div>
            <div style={{ fontFamily: 'Saira Condensed', fontWeight: 700, fontSize: 26, color: '#2A2E46', marginTop: 4, textTransform: 'uppercase', letterSpacing: '-0.01em' }}>Itechmaint</div>
          </div>
          <div>
            <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#8C90A1', letterSpacing: '0.18em', textTransform: 'uppercase' }}>INDUSTRIA</div>
            <div style={{ fontFamily: 'Saira Condensed', fontWeight: 700, fontSize: 26, color: '#2A2E46', marginTop: 4, textTransform: 'uppercase', letterSpacing: '-0.01em' }}>Energía Solar</div>
          </div>
          <div>
            <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#8C90A1', letterSpacing: '0.18em', textTransform: 'uppercase' }}>TASA</div>
            <div style={{ fontFamily: 'Saira Condensed', fontWeight: 700, fontSize: 26, color: '#209499', marginTop: 4, letterSpacing: '-0.01em' }}>59.9%</div>
          </div>
        </div>
      </div>
      <PlaySticker />
    </ThumbBase>
  );
}

/* ──────────────────────────────────────────────────────────────
   App — design canvas mounting the thumbnails
   ────────────────────────────────────────────────────────────── */

const thumbnails = [
  { id: 't1', label: '01 · Big Number', component: ThumbBigNumber },
  { id: 't2', label: '02 · Face + Stat (drop photo)', component: ThumbFaceStat },
  { id: 't3', label: '03 · Pull Quote', component: ThumbQuote },
  { id: 't4', label: '04 · Antes / Después', component: ThumbBeforeAfter },
  { id: 't5', label: '05 · Live Signal', component: ThumbSignal },
  { id: 't6', label: '06 · Ads vs Orgánico', component: ThumbComparison },
];

const thumbnailsAlt = [
  { id: 't7', label: '07 · Bold Claim · color bg', component: ThumbBoldClaim },
  { id: 't8', label: '08 · Full-bleed Photo (drop)', component: ThumbFullBleed },
  { id: 't9', label: '09 · Multi-Stat Roundup', component: ThumbMultiStat },
  { id: 't10', label: '10 · Question Hook', component: ThumbHook },
  { id: 't11', label: '11 · Series · numbered + photo', component: ThumbSeries },
  { id: 't12', label: '12 · Minimalist · anti-clickbait', component: ThumbMinimal },
];

function App() {
  return (
    <DesignCanvas title="YouTube Thumbnails — Testimoniales 15Element.AI">
      <DCSection id="thumbs" title="Patterns base · 1280×720" subtitle="Variantes brand-puro para testimoniales — un cliente, un número, una claim">
        {thumbnails.map(t => {
          const C = t.component;
          return (
            <DCArtboard key={t.id} id={t.id} label={t.label} width={1280} height={720}>
              <C />
            </DCArtboard>
          );
        })}
      </DCSection>

      <DCSection id="thumbs-alt" title="Variantes alternativas" subtitle="Direcciones visuales distintas — series, fotos full-bleed, comparativos, anti-clickbait">
        {thumbnailsAlt.map(t => {
          const C = t.component;
          return (
            <DCArtboard key={t.id} id={t.id} label={t.label} width={1280} height={720}>
              <C />
            </DCArtboard>
          );
        })}
      </DCSection>
    </DesignCanvas>
  );
}

window.App = App;
