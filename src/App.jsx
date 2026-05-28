import { useState, useMemo, useRef, useEffect } from "react";
import actoresData from "./data/actores.json";
import partidosData from "./data/partidos.json";
import sesionesData from "./data/sesiones.json";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getPartido = (id) => partidosData.find((p) => p.id === id);
const getSesion  = (id) => sesionesData.find((s) => s.id === id);
const getActor   = (id) => actoresData.find((a) => a.id === id);

const VOTO_LABEL = {
  afirmativo: { label: "Afirmativo", color: "#346538", bg: "#EDF3EC", text: "#346538" },
  negativo:   { label: "Negativo",   color: "#9F2F2D", bg: "#FDEBEC", text: "#9F2F2D" },
  abstencion: { label: "Abstención", color: "#956400", bg: "#FBF3DB", text: "#956400" },
  ausente:    { label: "Ausente",    color: "#787774", bg: "#F7F6F3", text: "#787774" },
};

const ESTADO_COLOR = {
  Promulgada:             { bg: "#EDF3EC", text: "#346538", border: "#c5dac5" },
  "Media sanción":        { bg: "#E1F3FE", text: "#1F6C9F", border: "#b4d8f0" },
  "En comisión":          { bg: "#FBF3DB", text: "#956400", border: "#e5d690" },
  Ingresado:              { bg: "#F7F6F3", text: "#787774", border: "#EAEAEA" },
  Apoyado:                { bg: "#EDF3EC", text: "#346538", border: "#c5dac5" },
  "En vigor / impugnado": { bg: "#FDEBEC", text: "#9F2F2D", border: "#edc4c2" },
};

const FRECUENCIA_COLOR = {
  alta:  "#9F2F2D",
  media: "#956400",
  baja:  "#787774",
};

const CONEXION_COLOR = {
  aliado_historico:   { bg: "#EDF3EC", text: "#346538", label: "Aliado histórico" },
  alianza_electoral:  { bg: "#E1F3FE", text: "#1F6C9F", label: "Alianza electoral" },
  alianza_coyuntural: { bg: "#FBF3DB", text: "#956400", label: "Alianza coyuntural" },
  tension_interna:    { bg: "#FBF3DB", text: "#956400", label: "Tensión interna" },
  rival_politico:     { bg: "#FDEBEC", text: "#9F2F2D", label: "Rival político" },
  rival_historico:    { bg: "#FDEBEC", text: "#9F2F2D", label: "Rival histórico" },
};

const TONO_COLOR = {
  confrontativo: { bg: "#FDEBEC", text: "#9F2F2D" },
  moderado:      { bg: "#EDF3EC", text: "#346538" },
  propositivo:   { bg: "#E1F3FE", text: "#1F6C9F" },
  defensivo:     { bg: "#FBF3DB", text: "#956400" },
  técnico:       { bg: "#F7F6F3", text: "#787774" },
};

function initials(name) {
  return name.split(" ").filter((w) => w.length > 2).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

// ─── FadeIn ───────────────────────────────────────────────────────────────────

function FadeIn({ children, delay = 0, style = {} }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.opacity = "1";
          el.style.transform = "translateY(0)";
          obs.unobserve(el);
        }
      },
      { threshold: 0.08 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        opacity: 0,
        transform: "translateY(12px)",
        transition: `opacity 600ms cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 600ms cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
        willChange: "transform",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ─── SVG Icons (Phosphor-style) ───────────────────────────────────────────────

const Ic = {
  chat: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  list: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  ),
  vote: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  ),
  megaphone: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11l19-9-9 19-2-8-8-2z" />
    </svg>
  ),
  compass: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </svg>
  ),
  link: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  ),
  video: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </svg>
  ),
  newspaper: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
      <path d="M18 14h-8" /><path d="M15 18h-5" /><path d="M10 6h8v4h-8V6Z" />
    </svg>
  ),
  radar: (size = 16) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="2" />
      <path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14" />
    </svg>
  ),
  play: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  ),
  close: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
};

// ─── Primitives ───────────────────────────────────────────────────────────────

function Avatar({ nombre, size = 44, style = {} }) {
  const partido = actoresData.find((a) => a.nombre === nombre)?.partido_actual;
  const color = getPartido(partido)?.color_hex || "#2F3437";
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: color + "18",
        border: `1.5px solid ${color}30`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.3,
        fontWeight: 600,
        color,
        flexShrink: 0,
        fontFamily: "'Syne', sans-serif",
        letterSpacing: "0.04em",
        ...style,
      }}
    >
      {initials(nombre)}
    </div>
  );
}

function PartidoBadge({ partidoId, small }) {
  const p = getPartido(partidoId);
  if (!p) return null;
  return (
    <span
      style={{
        fontSize: small ? 10 : 11,
        padding: small ? "2px 6px" : "3px 8px",
        borderRadius: 9999,
        background: p.color_hex + "14",
        color: p.color_hex,
        border: `1px solid ${p.color_hex}28`,
        fontWeight: 700,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
        fontFamily: "'Syne', sans-serif",
      }}
    >
      {p.sigla}
    </span>
  );
}

function SectionTitle({ icon, title }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 7,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: "#787774",
        marginBottom: 16,
        fontFamily: "'Syne', sans-serif",
      }}
    >
      <span style={{ color: "#787774", display: "flex" }}>{icon}</span>
      {title}
    </div>
  );
}

function FilterLabel({ children }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#787774", marginTop: 2 }}>
      {children}
    </div>
  );
}

function Card({ children, style = {} }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "#fff",
        border: "1px solid #EAEAEA",
        borderRadius: 12,
        padding: "24px",
        transition: "box-shadow 200ms",
        boxShadow: hovered ? "0 2px 8px rgba(0,0,0,0.04)" : "none",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function Sidebar({ actores, selected, onSelect, filters, onFilterChange, regionesAplicacion, regionesRepresentacion }) {
  return (
    <aside
      style={{
        width: 272,
        flexShrink: 0,
        borderRight: "1px solid #EAEAEA",
        display: "flex",
        flexDirection: "column",
        background: "#F9F9F8",
      }}
    >
      <div
        style={{
          padding: "14px 14px 12px",
          borderBottom: "1px solid #EAEAEA",
          display: "flex",
          flexDirection: "column",
          gap: 7,
        }}
      >
        <select value={filters.partido} onChange={(e) => onFilterChange("partido", e.target.value)} style={selectStyle}>
          <option value="">Todas las fuerzas</option>
          {partidosData.map((p) => (
            <option key={p.id} value={p.id}>{p.sigla} — {p.nombre}</option>
          ))}
        </select>
        <select value={filters.nivel} onChange={(e) => onFilterChange("nivel", e.target.value)} style={selectStyle}>
          <option value="">Todos los niveles</option>
          <option value="nacional">Nacional</option>
          <option value="provincial">Provincial</option>
          <option value="municipal">Municipal</option>
        </select>
        <select value={filters.camara} onChange={(e) => onFilterChange("camara", e.target.value)} style={selectStyle}>
          <option value="">Todas las cámaras</option>
          <option value="Senado">Senado</option>
          <option value="Diputados">Diputados</option>
        </select>
        <FilterLabel>Aplicación</FilterLabel>
        <select value={filters.region_aplicacion} onChange={(e) => onFilterChange("region_aplicacion", e.target.value)} style={selectStyle}>
          <option value="">Todas las regiones</option>
          {regionesAplicacion.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
        <FilterLabel>Representación</FilterLabel>
        <select value={filters.region_representacion} onChange={(e) => onFilterChange("region_representacion", e.target.value)} style={selectStyle}>
          <option value="">Todas las regiones</option>
          {regionesRepresentacion.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>

      <div
        style={{
          padding: "10px 14px 6px",
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "#787774",
          fontFamily: "'Syne', sans-serif",
        }}
      >
        {actores.length} actor{actores.length !== 1 ? "es" : ""}
      </div>

      <div style={{ flex: 1, overflowY: "auto" }}>
        {actores.map((a) => {
          const p = getPartido(a.partido_actual);
          const isSelected = selected?.id === a.id;
          return (
            <button
              key={a.id}
              onClick={() => onSelect(a)}
              style={{
                width: "100%",
                padding: "10px 14px",
                display: "flex",
                alignItems: "center",
                gap: 10,
                background: isSelected ? "#fff" : "transparent",
                border: "none",
                borderLeft: isSelected ? `2px solid ${p?.color_hex || "#111111"}` : "2px solid transparent",
                cursor: "pointer",
                textAlign: "left",
                transition: "background 0.12s",
              }}
            >
              <Avatar nombre={a.nombre} size={36} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#111111",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    fontFamily: "'Syne', sans-serif",
                  }}
                >
                  {a.nombre}
                </div>
                <div style={{ fontSize: 11, color: "#787774", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginTop: 1 }}>
                  {a.rol_actual}
                </div>
              </div>
              <PartidoBadge partidoId={a.partido_actual} small />
            </button>
          );
        })}
        {actores.length === 0 && (
          <div style={{ padding: 24, color: "#787774", fontSize: 13, textAlign: "center" }}>Sin resultados</div>
        )}
      </div>
    </aside>
  );
}

// ─── Profile header ───────────────────────────────────────────────────────────

function ProfileHeader({ actor }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 20,
        alignItems: "flex-start",
        padding: "28px 32px 22px",
        borderBottom: "1px solid #EAEAEA",
        background: "#fff",
      }}
    >
      <Avatar nombre={actor.nombre} size={58} />
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <h2
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: "#111111",
              fontFamily: "'Syne', sans-serif",
              margin: 0,
              letterSpacing: "-0.02em",
            }}
          >
            {actor.nombre}
          </h2>
          <PartidoBadge partidoId={actor.partido_actual} />
        </div>
        <div style={{ fontSize: 13, color: "#787774", marginTop: 3, lineHeight: 1.5 }}>
          {actor.rol_actual} · {actor.provincia || "Nacional"}{actor.camara ? ` · ${actor.camara}` : ""}
        </div>
        <p style={{ fontSize: 13, color: "#2F3437", marginTop: 10, lineHeight: 1.65, maxWidth: 680, margin: "10px 0 0" }}>
          {actor.biografia}
        </p>
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 10 }}>
          {actor.etiquetas.map((e) => (
            <span
              key={e}
              style={{
                fontSize: 10,
                padding: "2px 8px",
                borderRadius: 9999,
                background: "#F7F6F3",
                color: "#787774",
                border: "1px solid #EAEAEA",
                letterSpacing: "0.04em",
              }}
            >
              {e}
            </span>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
        <MetricPill label="Exposición mediática" value={actor.exposicion_mediatica} />
        <MetricPill label="Influencia interna" value={actor.influencia_interna} />
      </div>
    </div>
  );
}

function MetricPill({ label, value }) {
  const color = value >= 80 ? "#9F2F2D" : value >= 50 ? "#956400" : "#346538";
  return (
    <div
      style={{
        textAlign: "center",
        padding: "12px 16px",
        background: "#F9F9F8",
        border: "1px solid #EAEAEA",
        borderRadius: 8,
        minWidth: 76,
      }}
    >
      <div style={{ fontSize: 24, fontWeight: 700, color, fontFamily: "'Syne', sans-serif", lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontSize: 10, color: "#787774", marginTop: 5, lineHeight: 1.3 }}>{label}</div>
    </div>
  );
}

// ─── Content sections ─────────────────────────────────────────────────────────

function CitasSection({ citas }) {
  return (
    <FadeIn>
      <Card>
        <SectionTitle icon={Ic.chat} title="Citas destacadas" />
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {citas.map((c, i) => (
            <div
              key={i}
              style={{
                padding: "12px 16px",
                borderLeft: "2px solid #EAEAEA",
                background: "#F9F9F8",
                borderRadius: "0 8px 8px 0",
                fontSize: 14,
                color: "#2F3437",
                fontStyle: "italic",
                lineHeight: 1.65,
                fontFamily: "'Newsreader', 'Georgia', serif",
                letterSpacing: "-0.01em",
              }}
            >
              "{c}"
            </div>
          ))}
        </div>
      </Card>
    </FadeIn>
  );
}

function ProyectosSection({ proyectos }) {
  return (
    <FadeIn>
      <Card>
        <SectionTitle icon={Ic.list} title="Proyectos legislativos" />
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {proyectos.length === 0 && (
            <div style={{ color: "#787774", fontSize: 13 }}>Sin proyectos registrados.</div>
          )}
          {proyectos.map((p) => {
            const sc = ESTADO_COLOR[p.estado] || ESTADO_COLOR["Ingresado"];
            return (
              <div
                key={p.id}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 12,
                  padding: "10px 12px",
                  background: "#F9F9F8",
                  borderRadius: 8,
                  border: "1px solid #EAEAEA",
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#111111", lineHeight: 1.4 }}>{p.titulo}</div>
                  <div style={{ fontSize: 11, color: "#787774", marginTop: 3 }}>
                    {p.expediente} · {p.camara} · {p.fecha}
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
                  <span
                    style={{
                      fontSize: 10,
                      padding: "2px 8px",
                      borderRadius: 9999,
                      background: sc.bg,
                      color: sc.text,
                      border: `1px solid ${sc.border}`,
                      fontWeight: 700,
                      letterSpacing: "0.05em",
                      textTransform: "uppercase",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {p.estado}
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      color: "#787774",
                      padding: "2px 7px",
                      background: "#F7F6F3",
                      border: "1px solid #EAEAEA",
                      borderRadius: 9999,
                    }}
                  >
                    {p.tematica}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </FadeIn>
  );
}

function VotacionesSection({ votaciones }) {
  return (
    <FadeIn delay={80}>
      <Card>
        <SectionTitle icon={Ic.vote} title="Registro de votaciones" />
        {votaciones.length === 0 && (
          <div style={{ color: "#787774", fontSize: 13 }}>Sin votaciones registradas.</div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {votaciones.map((v) => {
            const ses = getSesion(v.sesion_id);
            const vv = VOTO_LABEL[v.voto] || VOTO_LABEL.ausente;
            return (
              <div
                key={v.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "9px 0",
                  borderBottom: "1px solid #F7F6F3",
                }}
              >
                <span
                  style={{
                    fontSize: 10,
                    padding: "3px 9px",
                    borderRadius: 9999,
                    background: vv.bg,
                    color: vv.text,
                    fontWeight: 700,
                    minWidth: 76,
                    textAlign: "center",
                    border: `1px solid ${vv.color}28`,
                    fontFamily: "'Syne', sans-serif",
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                  }}
                >
                  {vv.label}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: "#2F3437", fontWeight: 500 }}>{v.tema}</div>
                  {ses && (
                    <div style={{ fontSize: 11, color: "#787774", marginTop: 1 }}>
                      {ses.camara} · {v.fecha} · Resultado: {v.resultado_sesion}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </FadeIn>
  );
}

function AgendaSection({ agenda }) {
  return (
    <FadeIn>
      <Card>
        <SectionTitle icon={Ic.megaphone} title="Conversación pública" />
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {agenda.map((item) => (
            <div
              key={item.id}
              style={{
                padding: "12px 14px",
                background: "#F9F9F8",
                borderRadius: 8,
                border: "1px solid #EAEAEA",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: FRECUENCIA_COLOR[item.frecuencia],
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontSize: 13, fontWeight: 600, color: "#111111", fontFamily: "'Syne', sans-serif" }}>
                  {item.tema}
                </span>
                <span
                  style={{
                    fontSize: 10,
                    color: FRECUENCIA_COLOR[item.frecuencia],
                    marginLeft: "auto",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  {item.frecuencia}
                </span>
              </div>
              <div style={{ fontSize: 12, color: "#787774", lineHeight: 1.55, marginBottom: 8 }}>{item.encuadre}</div>
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                {item.palabras_clave.map((k) => (
                  <span
                    key={k}
                    style={{
                      fontSize: 10,
                      padding: "2px 7px",
                      borderRadius: 9999,
                      background: "#F7F6F3",
                      color: "#787774",
                      border: "1px solid #EAEAEA",
                    }}
                  >
                    #{k}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </FadeIn>
  );
}

function AfinidadSection({ afinidades }) {
  const sorted = [...afinidades].sort((a, b) => b.score - a.score);
  return (
    <FadeIn delay={80}>
      <Card>
        <SectionTitle icon={Ic.compass} title="Afinidad con fuerzas políticas" />
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {sorted.map((af) => {
            const p = getPartido(af.partido_id);
            if (!p) return null;
            return (
              <div key={af.partido_id}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#111111",
                      minWidth: 140,
                      fontFamily: "'Syne', sans-serif",
                    }}
                  >
                    {p.sigla}
                  </span>
                  <div
                    style={{
                      flex: 1,
                      height: 5,
                      background: "#F7F6F3",
                      borderRadius: 10,
                      overflow: "hidden",
                      border: "1px solid #EAEAEA",
                    }}
                  >
                    <div
                      style={{
                        width: `${af.score}%`,
                        height: "100%",
                        background: p.color_hex,
                        borderRadius: 10,
                        transition: "width 0.6s cubic-bezier(.4,0,.2,1)",
                      }}
                    />
                  </div>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: p.color_hex,
                      minWidth: 34,
                      textAlign: "right",
                      fontFamily: "'Syne', sans-serif",
                    }}
                  >
                    {af.score}%
                  </span>
                </div>
                <div style={{ fontSize: 11, color: "#787774", paddingLeft: 150 }}>{af.fundamento}</div>
              </div>
            );
          })}
        </div>
      </Card>
    </FadeIn>
  );
}

function ConexionesSection({ conexiones }) {
  return (
    <FadeIn>
      <Card>
        <SectionTitle icon={Ic.link} title="Conexiones con otros actores" />
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {conexiones.map((c, i) => {
            const otro = getActor(c.actor_id);
            const ct = CONEXION_COLOR[c.tipo] || { bg: "#F7F6F3", text: "#787774", label: c.tipo };
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 12,
                  padding: "10px 12px",
                  background: "#F9F9F8",
                  borderRadius: 8,
                  border: "1px solid #EAEAEA",
                }}
              >
                {otro && <Avatar nombre={otro.nombre} size={32} />}
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#111111", fontFamily: "'Syne', sans-serif" }}>
                      {otro ? otro.nombre : c.actor_id}
                    </span>
                    {otro && <PartidoBadge partidoId={otro.partido_actual} small />}
                    <span
                      style={{
                        fontSize: 10,
                        padding: "2px 8px",
                        borderRadius: 9999,
                        background: ct.bg,
                        color: ct.text,
                        fontWeight: 700,
                        border: `1px solid ${ct.text}22`,
                        letterSpacing: "0.04em",
                        textTransform: "uppercase",
                      }}
                    >
                      {ct.label}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: "#787774", marginTop: 4, lineHeight: 1.5 }}>{c.descripcion}</div>
                  <div style={{ fontSize: 11, color: "#787774", marginTop: 2, opacity: 0.7 }}>Desde {c.desde}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                  <div style={{ width: 36, height: 4, background: "#EAEAEA", borderRadius: 10, overflow: "hidden" }}>
                    <div
                      style={{
                        width: `${c.intensidad}%`,
                        height: "100%",
                        background: c.intensidad > 70 ? "#9F2F2D" : c.intensidad > 40 ? "#956400" : "#346538",
                        borderRadius: 10,
                      }}
                    />
                  </div>
                  <span style={{ fontSize: 10, color: "#787774", fontWeight: 600 }}>{c.intensidad}</span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </FadeIn>
  );
}

function VideosSection({ videos }) {
  const [activeVideo, setActiveVideo] = useState(null);

  if (!videos || videos.length === 0) return null;

  return (
    <FadeIn>
      <Card>
        <SectionTitle icon={Ic.video} title="Entrevistas y discursos" />
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {videos.map((v) => {
            const tono = TONO_COLOR[v.tono] || TONO_COLOR["técnico"];
            const mins = v.duracion_seg ? Math.round(v.duracion_seg / 60) : null;
            const isActive = activeVideo === v.id;

            return (
              <div
                key={v.id}
                style={{
                  border: "1px solid #EAEAEA",
                  borderRadius: 8,
                  overflow: "hidden",
                  background: "#F9F9F8",
                }}
              >
                {isActive && v.youtube_id ? (
                  <>
                    <div style={{ position: "relative", paddingBottom: "56.25%", height: 0 }}>
                      <iframe
                        src={`https://www.youtube.com/embed/${v.youtube_id}?autoplay=1`}
                        title={v.titulo}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        loading="lazy"
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: "100%",
                          height: "100%",
                          border: "none",
                        }}
                      />
                    </div>
                    <div
                      style={{
                        padding: "10px 14px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        borderTop: "1px solid #EAEAEA",
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#111111" }}>{v.titulo}</div>
                        <div style={{ fontSize: 11, color: "#787774", marginTop: 2 }}>
                          {v.canal}{mins ? ` · ${mins} min` : ""}{v.fecha ? ` · ${v.fecha}` : ""}
                        </div>
                      </div>
                      <button
                        onClick={() => setActiveVideo(null)}
                        style={{
                          background: "#F7F6F3",
                          border: "1px solid #EAEAEA",
                          borderRadius: 6,
                          cursor: "pointer",
                          color: "#787774",
                          display: "flex",
                          padding: "5px 6px",
                          flexShrink: 0,
                        }}
                      >
                        {Ic.close}
                      </button>
                    </div>
                  </>
                ) : (
                  <button
                    onClick={() => setActiveVideo(v.id)}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 12,
                      padding: "12px 14px",
                      width: "100%",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    <div
                      style={{
                        width: 96,
                        height: 60,
                        borderRadius: 6,
                        overflow: "hidden",
                        flexShrink: 0,
                        background: "#EAEAEA",
                        position: "relative",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {v.youtube_id ? (
                        <>
                          <img
                            src={`https://img.youtube.com/vi/${v.youtube_id}/mqdefault.jpg`}
                            alt={v.titulo}
                            style={{
                              position: "absolute",
                              inset: 0,
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                          <div
                            style={{
                              position: "absolute",
                              width: 28,
                              height: 28,
                              borderRadius: "50%",
                              background: "rgba(0,0,0,0.55)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#fff",
                            }}
                          >
                            {Ic.play}
                          </div>
                        </>
                      ) : (
                        <span style={{ color: "#787774", display: "flex" }}>{Ic.play}</span>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#111111", lineHeight: 1.4 }}>
                        {v.titulo}
                      </div>
                      <div style={{ fontSize: 11, color: "#787774", marginTop: 2 }}>
                        {v.canal}{mins ? ` · ${mins} min` : ""}{v.fecha ? ` · ${v.fecha}` : ""}
                      </div>
                      <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 6 }}>
                        {v.tono && (
                          <span
                            style={{
                              fontSize: 10,
                              padding: "2px 7px",
                              borderRadius: 9999,
                              background: tono.bg,
                              color: tono.text,
                              fontWeight: 700,
                              letterSpacing: "0.04em",
                            }}
                          >
                            {v.tono}
                          </span>
                        )}
                        {(v.temas_principales || []).map((t) => (
                          <span
                            key={t}
                            style={{
                              fontSize: 10,
                              padding: "2px 7px",
                              borderRadius: 9999,
                              background: "#F7F6F3",
                              color: "#787774",
                              border: "1px solid #EAEAEA",
                            }}
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                      {v.posicion_general && (
                        <div style={{ fontSize: 12, color: "#787774", marginTop: 6, lineHeight: 1.5 }}>
                          {v.posicion_general}
                        </div>
                      )}
                    </div>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </Card>
    </FadeIn>
  );
}

function NoticiasSection({ noticias }) {
  return (
    <FadeIn delay={80}>
      <Card>
        <SectionTitle icon={Ic.newspaper} title="Noticias recientes" />
        <div style={{ display: "flex", flexDirection: "column" }}>
          {noticias.map((n, i) => (
            <div
              key={n.id}
              style={{
                display: "flex",
                gap: 12,
                padding: "9px 0",
                borderBottom: i < noticias.length - 1 ? "1px solid #F7F6F3" : "none",
                alignItems: "flex-start",
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  color: "#787774",
                  minWidth: 52,
                  paddingTop: 2,
                  fontFamily: "'Syne', sans-serif",
                  letterSpacing: "0.04em",
                }}
              >
                {n.fecha.slice(5).replace("-", "/")}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: "#2F3437", lineHeight: 1.4 }}>{n.titulo}</div>
                <div style={{ fontSize: 11, color: "#787774", marginTop: 2 }}>
                  {n.medio} · {n.categoria}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </FadeIn>
  );
}

// ─── Compass ──────────────────────────────────────────────────────────────────

const COMPASS_AXES = {
  socialismo_liberalismo:       { left: "Socialismo",    right: "Liberalismo",      label: "Socialismo ↔ Liberalismo" },
  totalitarismo_libertarianismo:{ left: "Totalitarismo", right: "Libertarianismo",  label: "Totalitarismo ↔ Libertarianismo" },
  nacionalismo_conservadurismo: { left: "Nacionalismo",  right: "Conservadurismo",  label: "Nacionalismo ↔ Conservadurismo" },
  revolucionario_reaccionario:  { left: "Revolucionario",right: "Reaccionario",     label: "Revolucionario ↔ Reaccionario" },
};

function CompassView({ actores, onSelectActor }) {
  const [axisX, setAxisX] = useState("socialismo_liberalismo");
  const [axisY, setAxisY] = useState("totalitarismo_libertarianismo");
  const [tooltip, setTooltip] = useState(null);

  const W = 680, H = 480, PAD = 72;
  const innerW = W - PAD * 2;
  const innerH = H - PAD * 2;

  const toSvgX = (v) => PAD + ((v + 100) / 200) * innerW;
  const toSvgY = (v) => H - PAD - ((v + 100) / 200) * innerH;

  const withCompass = actores.filter((a) => a.compass);

  const axX = COMPASS_AXES[axisX];
  const axY = COMPASS_AXES[axisY];

  const gridVals = [-75, -50, -25, 25, 50, 75];

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "#F7F6F3" }}>
      {/* Controls */}
      <div
        style={{
          padding: "12px 28px",
          background: "#fff",
          borderBottom: "1px solid #EAEAEA",
          display: "flex",
          gap: 16,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#787774" }}>Eje X</span>
          <select value={axisX} onChange={(e) => setAxisX(e.target.value)} style={{ ...selectStyle, width: 230 }}>
            {Object.entries(COMPASS_AXES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#787774" }}>Eje Y</span>
          <select value={axisY} onChange={(e) => setAxisY(e.target.value)} style={{ ...selectStyle, width: 230 }}>
            {Object.entries(COMPASS_AXES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
        <span style={{ fontSize: 11, color: "#787774", marginLeft: "auto" }}>
          {withCompass.length} actores · click para abrir perfil
        </span>
      </div>

      {/* Canvas */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px 32px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ perspective: "1100px" }}>
          <div
            style={{
              transform: "rotateX(40deg) rotateZ(-2deg)",
              transformOrigin: "center 60%",
            }}
          >
            <svg
              width={W}
              height={H}
              style={{ display: "block", filter: "drop-shadow(0 12px 32px rgba(0,0,0,0.08))" }}
              onMouseLeave={() => setTooltip(null)}
            >
              {/* Background plane */}
              <rect x={0} y={0} width={W} height={H} rx={12} fill="#FFFFFF" stroke="#EAEAEA" strokeWidth={1} />
              <rect x={PAD} y={PAD} width={innerW} height={innerH} fill="#FAFAF9" />

              {/* Grid lines */}
              {gridVals.map((v) => (
                <g key={v}>
                  <line x1={toSvgX(v)} y1={PAD} x2={toSvgX(v)} y2={H - PAD} stroke="#EAEAEA" strokeWidth={1} />
                  <line x1={PAD} y1={toSvgY(v)} x2={W - PAD} y2={toSvgY(v)} stroke="#EAEAEA" strokeWidth={1} />
                </g>
              ))}

              {/* Main axes */}
              <line x1={PAD} y1={H / 2} x2={W - PAD} y2={H / 2} stroke="#2F3437" strokeWidth={1.5} />
              <line x1={W / 2} y1={PAD} x2={W / 2} y2={H - PAD} stroke="#2F3437" strokeWidth={1.5} />

              {/* Axis arrowheads */}
              <polygon points={`${W - PAD},${H / 2 - 4} ${W - PAD + 8},${H / 2} ${W - PAD},${H / 2 + 4}`} fill="#2F3437" />
              <polygon points={`${PAD},${H / 2 - 4} ${PAD - 8},${H / 2} ${PAD},${H / 2 + 4}`} fill="#2F3437" />
              <polygon points={`${W / 2 - 4},${PAD} ${W / 2},${PAD - 8} ${W / 2 + 4},${PAD}`} fill="#2F3437" />
              <polygon points={`${W / 2 - 4},${H - PAD} ${W / 2},${H - PAD + 8} ${W / 2 + 4},${H - PAD}`} fill="#2F3437" />

              {/* Axis end labels */}
              <text x={W - PAD + 12} y={H / 2 + 4} fontSize={10} fill="#787774" fontFamily="'Syne',sans-serif" fontWeight={700} letterSpacing="0.06em" textAnchor="start">{axX.right.toUpperCase()}</text>
              <text x={PAD - 12} y={H / 2 + 4} fontSize={10} fill="#787774" fontFamily="'Syne',sans-serif" fontWeight={700} letterSpacing="0.06em" textAnchor="end">{axX.left.toUpperCase()}</text>
              <text x={W / 2} y={PAD - 14} fontSize={10} fill="#787774" fontFamily="'Syne',sans-serif" fontWeight={700} letterSpacing="0.06em" textAnchor="middle">{axY.right.toUpperCase()}</text>
              <text x={W / 2} y={H - PAD + 20} fontSize={10} fill="#787774" fontFamily="'Syne',sans-serif" fontWeight={700} letterSpacing="0.06em" textAnchor="middle">{axY.left.toUpperCase()}</text>

              {/* Origin label */}
              <text x={W / 2 + 6} y={H / 2 - 6} fontSize={9} fill="#EAEAEA" fontFamily="'Syne',sans-serif" textAnchor="start">0</text>

              {/* Actor dots */}
              {withCompass.map((a) => {
                const cx = toSvgX(a.compass[axisX] ?? 0);
                const cy = toSvgY(a.compass[axisY] ?? 0);
                const p = getPartido(a.partido_actual);
                const color = p?.color_hex || "#787774";
                return (
                  <g
                    key={a.id}
                    onMouseEnter={(e) => setTooltip({ actor: a, x: e.clientX, y: e.clientY })}
                    onMouseMove={(e) => setTooltip({ actor: a, x: e.clientX, y: e.clientY })}
                    onMouseLeave={() => setTooltip(null)}
                    onClick={() => onSelectActor(a)}
                    style={{ cursor: "pointer" }}
                  >
                    <circle cx={cx} cy={cy} r={9} fill={color} fillOpacity={0.18} stroke={color} strokeWidth={1.5} />
                    <text
                      x={cx}
                      y={cy + 4}
                      fontSize={8}
                      fill={color}
                      fontFamily="'Syne',sans-serif"
                      fontWeight={700}
                      textAnchor="middle"
                      style={{ pointerEvents: "none" }}
                    >
                      {initials(a.nombre)}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Tooltip — fuera del transform */}
        {tooltip && (
          <div
            style={{
              position: "fixed",
              top: tooltip.y - 68,
              left: tooltip.x + 14,
              background: "#fff",
              border: "1px solid #EAEAEA",
              borderRadius: 8,
              padding: "8px 12px",
              boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
              pointerEvents: "none",
              zIndex: 100,
              minWidth: 160,
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 700, color: "#111111", fontFamily: "'Syne',sans-serif" }}>
              {tooltip.actor.nombre}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
              <PartidoBadge partidoId={tooltip.actor.partido_actual} small />
              <span style={{ fontSize: 11, color: "#787774" }}>{tooltip.actor.rol_actual}</span>
            </div>
            <div style={{ fontSize: 10, color: "#EAEAEA", marginTop: 6, borderTop: "1px solid #F7F6F3", paddingTop: 4 }}>
              {axX.label.split("↔")[0].trim()}: <b style={{ color: "#787774" }}>{tooltip.actor.compass[axisX]}</b>
              {" · "}
              {axY.label.split("↔")[0].trim()}: <b style={{ color: "#787774" }}>{tooltip.actor.compass[axisY]}</b>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 14,
        padding: 40,
      }}
    >
      <div style={{ color: "#EAEAEA" }}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="2" />
          <path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14" />
        </svg>
      </div>
      <div
        style={{
          fontSize: 18,
          fontWeight: 700,
          color: "#2F3437",
          fontFamily: "'Syne', sans-serif",
          letterSpacing: "-0.02em",
        }}
      >
        Seleccioná un actor político
      </div>
      <div style={{ fontSize: 13, color: "#787774" }}>Usá los filtros y elegí un perfil de la lista</div>
    </div>
  );
}

// ─── Detail panel ─────────────────────────────────────────────────────────────

function DetailPanel({ actor }) {
  const [tab, setTab] = useState("resumen");

  const tabs = [
    { id: "resumen",     label: "Resumen" },
    { id: "legislativo", label: "Actividad legislativa" },
    { id: "discurso",    label: "Discurso" },
    { id: "relaciones",  label: "Relaciones" },
    { id: "prensa",      label: "Prensa" },
  ];

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflowY: "auto" }}>
      <ProfileHeader actor={actor} />

      <div
        style={{
          display: "flex",
          gap: 0,
          borderBottom: "1px solid #EAEAEA",
          padding: "0 24px",
          background: "#fff",
        }}
      >
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: "10px 14px",
              fontSize: 12,
              fontWeight: 600,
              background: "none",
              border: "none",
              borderBottom: tab === t.id ? "2px solid #111111" : "2px solid transparent",
              cursor: "pointer",
              color: tab === t.id ? "#111111" : "#787774",
              fontFamily: "'Syne', sans-serif",
              letterSpacing: "0.04em",
              transition: "color 0.12s",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div
        style={{
          flex: 1,
          padding: "24px",
          background: "#F7F6F3",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {tab === "resumen" && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <AgendaSection agenda={actor.agenda_publica} />
              <AfinidadSection afinidades={actor.afinidades} />
            </div>
            <CitasSection citas={actor.citas_destacadas} />
          </>
        )}
        {tab === "legislativo" && (
          <>
            <ProyectosSection proyectos={actor.proyectos} />
            <VotacionesSection votaciones={actor.votaciones} />
          </>
        )}
        {tab === "discurso" && (
          <>
            <AgendaSection agenda={actor.agenda_publica} />
            <CitasSection citas={actor.citas_destacadas} />
          </>
        )}
        {tab === "relaciones" && (
          <>
            <ConexionesSection conexiones={actor.conexiones} />
            <AfinidadSection afinidades={actor.afinidades} />
          </>
        )}
        {tab === "prensa" && (
          <>
            <VideosSection videos={actor.videos} />
            <NoticiasSection noticias={actor.noticias} />
          </>
        )}
      </div>
    </div>
  );
}

// ─── Topbar ───────────────────────────────────────────────────────────────────

function Topbar({ search, onSearch, view, onViewChange }) {
  return (
    <header
      style={{
        height: 50,
        borderBottom: "1px solid #EAEAEA",
        display: "flex",
        alignItems: "center",
        padding: "0 20px",
        gap: 16,
        background: "#fff",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          fontFamily: "'Syne', sans-serif",
          fontWeight: 800,
          fontSize: 14,
          color: "#111111",
          letterSpacing: "-0.01em",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span style={{ color: "#787774", display: "flex" }}>{Ic.radar(16)}</span>
        RADAR POLÍTICO AR
        <span
          style={{
            fontSize: 10,
            background: "#F7F6F3",
            color: "#787774",
            padding: "2px 7px",
            borderRadius: 4,
            fontWeight: 600,
            letterSpacing: "0.04em",
            border: "1px solid #EAEAEA",
          }}
        >
          MVP · β
        </span>
      </div>

      {/* View toggle */}
      <div
        style={{
          display: "flex",
          background: "#F7F6F3",
          border: "1px solid #EAEAEA",
          borderRadius: 6,
          padding: 2,
          gap: 2,
        }}
      >
        {[
          { id: "perfiles", label: "Perfiles" },
          { id: "mapa", label: "Mapa político" },
        ].map((v) => (
          <button
            key={v.id}
            onClick={() => onViewChange(v.id)}
            style={{
              padding: "4px 12px",
              fontSize: 11,
              fontWeight: 600,
              fontFamily: "'Syne', sans-serif",
              letterSpacing: "0.03em",
              background: view === v.id ? "#fff" : "transparent",
              color: view === v.id ? "#111111" : "#787774",
              border: view === v.id ? "1px solid #EAEAEA" : "1px solid transparent",
              borderRadius: 4,
              cursor: "pointer",
              transition: "all 0.12s",
            }}
          >
            {v.label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1 }} />
      <input
        type="text"
        placeholder="Buscar actor..."
        value={search}
        onChange={(e) => onSearch(e.target.value)}
        style={{ ...selectStyle, width: 210, padding: "6px 12px" }}
      />
    </header>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

const selectStyle = {
  fontSize: 12,
  padding: "6px 10px",
  borderRadius: 6,
  border: "1px solid #EAEAEA",
  background: "#fff",
  color: "#2F3437",
  outline: "none",
  fontFamily: "inherit",
  width: "100%",
};

export default function App() {
  const [selected, setSelected] = useState(null);
  const [view, setView] = useState("perfiles");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({ partido: "", nivel: "", camara: "", region_aplicacion: "", region_representacion: "" });

  const regionesAplicacion = useMemo(() => {
    const vals = [...new Set(actoresData.map((a) => a.region_aplicacion).filter(Boolean))];
    return ["Nacional", ...vals.filter((v) => v !== "Nacional").sort()];
  }, []);

  const regionesRepresentacion = useMemo(() => {
    const vals = [...new Set(actoresData.map((a) => a.region_representacion).filter(Boolean))];
    return ["Nacional", ...vals.filter((v) => v !== "Nacional").sort()];
  }, []);

  const filtered = useMemo(() => {
    return actoresData.filter((a) => {
      if (filters.partido && a.partido_actual !== filters.partido) return false;
      if (filters.nivel && a.nivel !== filters.nivel) return false;
      if (filters.camara && a.camara !== filters.camara) return false;
      if (filters.region_aplicacion && a.region_aplicacion !== filters.region_aplicacion) return false;
      if (filters.region_representacion && a.region_representacion !== filters.region_representacion) return false;
      if (search && !a.nombre.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [filters, search]);

  const handleFilterChange = (key, val) => setFilters((f) => ({ ...f, [key]: val }));

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Newsreader:ital,opsz,wght@0,6..72,400;1,6..72,400;1,6..72,500&display=swap"
        rel="stylesheet"
      />
      <div
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 0,
          background:
            "radial-gradient(ellipse 60% 50% at 72% 18%, rgba(160,140,100,0.04) 0%, transparent 70%)",
        }}
      />
      <div
        style={{
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          fontFamily: "'Syne', 'Helvetica Neue', -apple-system, sans-serif",
          background: "#F7F6F3",
          color: "#111111",
          fontSize: 14,
          position: "relative",
          zIndex: 1,
        }}
      >
        <Topbar search={search} onSearch={setSearch} view={view} onViewChange={setView} />
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          {view === "mapa" ? (
            <CompassView
              actores={filtered}
              onSelectActor={(a) => { setSelected(a); setView("perfiles"); }}
            />
          ) : (
            <>
              <Sidebar
                actores={filtered}
                selected={selected}
                onSelect={setSelected}
                filters={filters}
                onFilterChange={handleFilterChange}
                regionesAplicacion={regionesAplicacion}
                regionesRepresentacion={regionesRepresentacion}
              />
              {selected ? <DetailPanel key={selected.id} actor={selected} /> : <EmptyState />}
            </>
          )}
        </div>
      </div>
    </>
  );
}
