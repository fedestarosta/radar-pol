import { useState, useMemo } from "react";
import actoresData from "./data/actores.json";
import partidosData from "./data/partidos.json";
import sesionesData from "./data/sesiones.json";

// ─── Helpers ────────────────────────────────────────────────────────────────

const getPartido = (id) => partidosData.find((p) => p.id === id);
const getSesion = (id) => sesionesData.find((s) => s.id === id);
const getActor = (id) => actoresData.find((a) => a.id === id);

const VOTO_LABEL = {
  afirmativo: { label: "Afirmativo", color: "#22c55e", bg: "#f0fdf4", text: "#15803d" },
  negativo: { label: "Negativo", color: "#ef4444", bg: "#fef2f2", text: "#b91c1c" },
  abstencion: { label: "Abstención", color: "#f59e0b", bg: "#fffbeb", text: "#92400e" },
  ausente: { label: "Ausente", color: "#94a3b8", bg: "#f8fafc", text: "#475569" },
};

const ESTADO_COLOR = {
  Promulgada: { bg: "#f0fdf4", text: "#15803d", border: "#bbf7d0" },
  "Media sanción": { bg: "#eff6ff", text: "#1d4ed8", border: "#bfdbfe" },
  "En comisión": { bg: "#fffbeb", text: "#92400e", border: "#fde68a" },
  Ingresado: { bg: "#f8fafc", text: "#475569", border: "#e2e8f0" },
  Apoyado: { bg: "#f0fdf4", text: "#15803d", border: "#bbf7d0" },
  "En vigor / impugnado": { bg: "#fef2f2", text: "#b91c1c", border: "#fecaca" },
};

const FRECUENCIA_COLOR = {
  alta: "#ef4444",
  media: "#f59e0b",
  baja: "#94a3b8",
};

const CONEXION_COLOR = {
  aliado_historico: { bg: "#f0fdf4", text: "#15803d", label: "Aliado histórico" },
  alianza_electoral: { bg: "#eff6ff", text: "#1d4ed8", label: "Alianza electoral" },
  alianza_coyuntural: { bg: "#fefce8", text: "#854d0e", label: "Alianza coyuntural" },
  tension_interna: { bg: "#fff7ed", text: "#c2410c", label: "Tensión interna" },
  rival_politico: { bg: "#fef2f2", text: "#b91c1c", label: "Rival político" },
  rival_historico: { bg: "#fdf2f8", text: "#9d174d", label: "Rival histórico" },
};

function initials(name) {
  return name
    .split(" ")
    .filter((w) => w.length > 2)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function Avatar({ nombre, size = 44, style = {} }) {
  const partido = actoresData.find((a) => a.nombre === nombre)?.partido_actual;
  const color = getPartido(partido)?.color_hex || "#6366f1";
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: color + "22",
        border: `2px solid ${color}44`,
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
        borderRadius: 20,
        background: p.color_hex + "18",
        color: p.color_hex,
        border: `1px solid ${p.color_hex}33`,
        fontWeight: 600,
        letterSpacing: "0.03em",
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
        gap: 8,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        color: "#94a3b8",
        marginBottom: 14,
        fontFamily: "'Syne', sans-serif",
      }}
    >
      <span style={{ fontSize: 14 }}>{icon}</span>
      {title}
    </div>
  );
}

function Card({ children, style = {} }) {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #f1f5f9",
        borderRadius: 16,
        padding: "18px 20px",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ─── Sidebar actor list ──────────────────────────────────────────────────────

function Sidebar({ actores, selected, onSelect, filters, onFilterChange }) {
  return (
    <aside
      style={{
        width: 280,
        flexShrink: 0,
        borderRight: "1px solid #f1f5f9",
        display: "flex",
        flexDirection: "column",
        background: "#fafafa",
      }}
    >
      {/* Filters */}
      <div
        style={{
          padding: "16px 16px 12px",
          borderBottom: "1px solid #f1f5f9",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        <select
          value={filters.partido}
          onChange={(e) => onFilterChange("partido", e.target.value)}
          style={selectStyle}
        >
          <option value="">Todas las fuerzas</option>
          {partidosData.map((p) => (
            <option key={p.id} value={p.id}>
              {p.sigla} — {p.nombre}
            </option>
          ))}
        </select>
        <select
          value={filters.nivel}
          onChange={(e) => onFilterChange("nivel", e.target.value)}
          style={selectStyle}
        >
          <option value="">Todos los niveles</option>
          <option value="nacional">Nacional</option>
          <option value="provincial">Provincial</option>
          <option value="municipal">Municipal</option>
        </select>
        <select
          value={filters.camara}
          onChange={(e) => onFilterChange("camara", e.target.value)}
          style={selectStyle}
        >
          <option value="">Todas las cámaras</option>
          <option value="Senado">Senado</option>
          <option value="Diputados">Diputados</option>
        </select>
      </div>

      {/* Count */}
      <div
        style={{
          padding: "10px 16px 6px",
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "#94a3b8",
          fontFamily: "'Syne', sans-serif",
        }}
      >
        {actores.length} actor{actores.length !== 1 ? "es" : ""}
      </div>

      {/* Actor list */}
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
                padding: "11px 16px",
                display: "flex",
                alignItems: "center",
                gap: 11,
                background: isSelected ? "#fff" : "transparent",
                border: "none",
                borderLeft: isSelected
                  ? `3px solid ${p?.color_hex || "#6366f1"}`
                  : "3px solid transparent",
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.15s",
              }}
            >
              <Avatar nombre={a.nombre} size={38} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#0f172a",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    fontFamily: "'Syne', sans-serif",
                  }}
                >
                  {a.nombre}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "#94a3b8",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    marginTop: 1,
                  }}
                >
                  {a.rol_actual}
                </div>
              </div>
              <PartidoBadge partidoId={a.partido_actual} small />
            </button>
          );
        })}
        {actores.length === 0 && (
          <div style={{ padding: 24, color: "#94a3b8", fontSize: 13, textAlign: "center" }}>
            Sin resultados
          </div>
        )}
      </div>
    </aside>
  );
}

// ─── Profile detail ──────────────────────────────────────────────────────────

function ProfileHeader({ actor }) {
  const p = getPartido(actor.partido_actual);
  return (
    <div
      style={{
        display: "flex",
        gap: 20,
        alignItems: "flex-start",
        padding: "24px 28px 20px",
        borderBottom: "1px solid #f1f5f9",
        background: "#fff",
      }}
    >
      <Avatar nombre={actor.nombre} size={60} />
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <h2
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: "#0f172a",
              fontFamily: "'Syne', sans-serif",
              margin: 0,
            }}
          >
            {actor.nombre}
          </h2>
          <PartidoBadge partidoId={actor.partido_actual} />
        </div>
        <div style={{ fontSize: 13, color: "#64748b", marginTop: 3 }}>
          {actor.rol_actual} · {actor.provincia || "Nacional"}
          {actor.camara ? ` · ${actor.camara}` : ""}
        </div>
        <p style={{ fontSize: 13, color: "#475569", marginTop: 10, lineHeight: 1.6, maxWidth: 700 }}>
          {actor.biografia}
        </p>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
          {actor.etiquetas.map((e) => (
            <span
              key={e}
              style={{
                fontSize: 11,
                padding: "3px 9px",
                borderRadius: 20,
                background: "#f8fafc",
                color: "#475569",
                border: "1px solid #e2e8f0",
              }}
            >
              {e}
            </span>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", gap: 12, flexShrink: 0 }}>
        <MetricPill label="Exposición mediática" value={actor.exposicion_mediatica} />
        <MetricPill label="Influencia interna" value={actor.influencia_interna} />
      </div>
    </div>
  );
}

function MetricPill({ label, value }) {
  const color = value >= 80 ? "#ef4444" : value >= 50 ? "#f59e0b" : "#22c55e";
  return (
    <div
      style={{
        textAlign: "center",
        padding: "10px 14px",
        background: "#fafafa",
        border: "1px solid #f1f5f9",
        borderRadius: 12,
        minWidth: 80,
      }}
    >
      <div
        style={{
          fontSize: 24,
          fontWeight: 700,
          color,
          fontFamily: "'Syne', sans-serif",
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 4, lineHeight: 1.3 }}>{label}</div>
    </div>
  );
}

function CitasSection({ citas }) {
  return (
    <Card>
      <SectionTitle icon="💬" title="Citas destacadas" />
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {citas.map((c, i) => (
          <div
            key={i}
            style={{
              padding: "10px 14px",
              borderLeft: "3px solid #e2e8f0",
              background: "#fafafa",
              borderRadius: "0 8px 8px 0",
              fontSize: 13,
              color: "#334155",
              fontStyle: "italic",
              lineHeight: 1.5,
            }}
          >
            "{c}"
          </div>
        ))}
      </div>
    </Card>
  );
}

function ProyectosSection({ proyectos }) {
  return (
    <Card>
      <SectionTitle icon="📋" title="Proyectos legislativos" />
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {proyectos.length === 0 && (
          <div style={{ color: "#94a3b8", fontSize: 13 }}>Sin proyectos registrados.</div>
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
                background: "#fafafa",
                borderRadius: 10,
                border: "1px solid #f1f5f9",
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", lineHeight: 1.4 }}>
                  {p.titulo}
                </div>
                <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 3 }}>
                  {p.expediente} · {p.camara} · {p.fecha}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
                <span
                  style={{
                    fontSize: 10,
                    padding: "3px 8px",
                    borderRadius: 20,
                    background: sc.bg,
                    color: sc.text,
                    border: `1px solid ${sc.border}`,
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                  }}
                >
                  {p.estado}
                </span>
                <span
                  style={{
                    fontSize: 10,
                    color: "#94a3b8",
                    padding: "2px 7px",
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: 20,
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
  );
}

function VotacionesSection({ votaciones }) {
  return (
    <Card>
      <SectionTitle icon="🗳️" title="Registro de votaciones" />
      {votaciones.length === 0 && (
        <div style={{ color: "#94a3b8", fontSize: 13 }}>Sin votaciones registradas.</div>
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
                borderBottom: "1px solid #f8fafc",
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  padding: "3px 9px",
                  borderRadius: 20,
                  background: vv.bg,
                  color: vv.text,
                  fontWeight: 700,
                  minWidth: 80,
                  textAlign: "center",
                  border: `1px solid ${vv.color}33`,
                  fontFamily: "'Syne', sans-serif",
                }}
              >
                {vv.label}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: "#334155", fontWeight: 500 }}>{v.tema}</div>
                {ses && (
                  <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 1 }}>
                    {ses.camara} · {v.fecha} · Resultado: {v.resultado_sesion}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function AgendaSection({ agenda }) {
  return (
    <Card>
      <SectionTitle icon="📣" title="Conversación pública" />
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {agenda.map((item) => (
          <div
            key={item.id}
            style={{
              padding: "11px 14px",
              background: "#fafafa",
              borderRadius: 10,
              border: "1px solid #f1f5f9",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
              <div
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: FRECUENCIA_COLOR[item.frecuencia],
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", fontFamily: "'Syne', sans-serif" }}>
                {item.tema}
              </span>
              <span
                style={{
                  fontSize: 10,
                  color: FRECUENCIA_COLOR[item.frecuencia],
                  marginLeft: "auto",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {item.frecuencia}
              </span>
            </div>
            <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.5, marginBottom: 7 }}>
              {item.encuadre}
            </div>
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
              {item.palabras_clave.map((k) => (
                <span
                  key={k}
                  style={{
                    fontSize: 10,
                    padding: "2px 7px",
                    borderRadius: 20,
                    background: "#f1f5f9",
                    color: "#64748b",
                    border: "1px solid #e2e8f0",
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
  );
}

function AfinidadSection({ afinidades }) {
  const sorted = [...afinidades].sort((a, b) => b.score - a.score);
  return (
    <Card>
      <SectionTitle icon="🧭" title="Afinidad con fuerzas políticas" />
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {sorted.map((af) => {
          const p = getPartido(af.partido_id);
          if (!p) return null;
          return (
            <div key={af.partido_id}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 4,
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#0f172a",
                    minWidth: 140,
                    fontFamily: "'Syne', sans-serif",
                  }}
                >
                  {p.sigla}
                </span>
                <div
                  style={{
                    flex: 1,
                    height: 6,
                    background: "#f1f5f9",
                    borderRadius: 10,
                    overflow: "hidden",
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
              <div style={{ fontSize: 11, color: "#94a3b8", paddingLeft: 150 }}>{af.fundamento}</div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function ConexionesSection({ conexiones }) {
  return (
    <Card>
      <SectionTitle icon="🔗" title="Conexiones con otros actores" />
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {conexiones.map((c, i) => {
          const otro = getActor(c.actor_id);
          const ct = CONEXION_COLOR[c.tipo] || { bg: "#f8fafc", text: "#475569", label: c.tipo };
          return (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
                padding: "10px 12px",
                background: "#fafafa",
                borderRadius: 10,
                border: "1px solid #f1f5f9",
              }}
            >
              {otro && <Avatar nombre={otro.nombre} size={34} />}
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", fontFamily: "'Syne', sans-serif" }}>
                    {otro ? otro.nombre : c.actor_id}
                  </span>
                  {otro && <PartidoBadge partidoId={otro.partido_actual} small />}
                  <span
                    style={{
                      fontSize: 10,
                      padding: "2px 8px",
                      borderRadius: 20,
                      background: ct.bg,
                      color: ct.text,
                      fontWeight: 600,
                      border: `1px solid ${ct.text}22`,
                    }}
                  >
                    {ct.label}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 4, lineHeight: 1.5 }}>
                  {c.descripcion}
                </div>
                <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>Desde {c.desde}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                <div
                  style={{
                    width: 40,
                    height: 4,
                    background: "#f1f5f9",
                    borderRadius: 10,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${c.intensidad}%`,
                      height: "100%",
                      background: c.intensidad > 70 ? "#ef4444" : c.intensidad > 40 ? "#f59e0b" : "#22c55e",
                      borderRadius: 10,
                    }}
                  />
                </div>
                <span style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600 }}>{c.intensidad}</span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function NoticiasSection({ noticias }) {
  return (
    <Card>
      <SectionTitle icon="📰" title="Noticias recientes" />
      <div style={{ display: "flex", flexDirection: "column" }}>
        {noticias.map((n, i) => (
          <div
            key={n.id}
            style={{
              display: "flex",
              gap: 12,
              padding: "9px 0",
              borderBottom: i < noticias.length - 1 ? "1px solid #f8fafc" : "none",
              alignItems: "flex-start",
            }}
          >
            <div
              style={{
                fontSize: 10,
                color: "#94a3b8",
                minWidth: 56,
                paddingTop: 2,
                fontFamily: "'Syne', sans-serif",
              }}
            >
              {n.fecha.slice(5).replace("-", "/")}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: "#334155", lineHeight: 1.4 }}>{n.titulo}</div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                {n.medio} · {n.categoria}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
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
        gap: 12,
        color: "#94a3b8",
        padding: 40,
      }}
    >
      <div style={{ fontSize: 48 }}>🗺️</div>
      <div
        style={{
          fontSize: 18,
          fontWeight: 700,
          color: "#334155",
          fontFamily: "'Syne', sans-serif",
        }}
      >
        Seleccioná un actor político
      </div>
      <div style={{ fontSize: 13, color: "#94a3b8" }}>
        Usá los filtros y elegí un perfil de la lista
      </div>
    </div>
  );
}

// ─── Detail panel ────────────────────────────────────────────────────────────

function DetailPanel({ actor }) {
  const [tab, setTab] = useState("resumen");

  const tabs = [
    { id: "resumen", label: "Resumen" },
    { id: "legislativo", label: "Actividad legislativa" },
    { id: "discurso", label: "Discurso" },
    { id: "relaciones", label: "Relaciones" },
    { id: "prensa", label: "Prensa" },
  ];

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflowY: "auto" }}>
      <ProfileHeader actor={actor} />

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: 0,
          borderBottom: "1px solid #f1f5f9",
          padding: "0 20px",
          background: "#fff",
        }}
      >
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: "10px 16px",
              fontSize: 12,
              fontWeight: 600,
              background: "none",
              border: "none",
              borderBottom: tab === t.id ? "2px solid #0f172a" : "2px solid transparent",
              cursor: "pointer",
              color: tab === t.id ? "#0f172a" : "#94a3b8",
              fontFamily: "'Syne', sans-serif",
              letterSpacing: "0.02em",
              transition: "all 0.15s",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div
        style={{
          flex: 1,
          padding: "20px",
          background: "#f8fafc",
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
        {tab === "prensa" && <NoticiasSection noticias={actor.noticias} />}
      </div>
    </div>
  );
}

// ─── Topbar ──────────────────────────────────────────────────────────────────

function Topbar({ search, onSearch }) {
  return (
    <header
      style={{
        height: 52,
        borderBottom: "1px solid #f1f5f9",
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
          fontSize: 15,
          color: "#0f172a",
          letterSpacing: "-0.02em",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span style={{ fontSize: 18 }}>🗺️</span>
        RADAR POLÍTICO AR
        <span
          style={{
            fontSize: 10,
            background: "#f1f5f9",
            color: "#94a3b8",
            padding: "2px 7px",
            borderRadius: 20,
            fontWeight: 600,
          }}
        >
          MVP · β
        </span>
      </div>
      <div style={{ flex: 1 }} />
      <input
        type="text"
        placeholder="Buscar actor..."
        value={search}
        onChange={(e) => onSearch(e.target.value)}
        style={{
          ...selectStyle,
          width: 220,
          padding: "6px 12px",
        }}
      />
    </header>
  );
}

// ─── Root ────────────────────────────────────────────────────────────────────

const selectStyle = {
  fontSize: 12,
  padding: "6px 10px",
  borderRadius: 8,
  border: "1px solid #e2e8f0",
  background: "#fff",
  color: "#334155",
  outline: "none",
  fontFamily: "inherit",
  width: "100%",
};

export default function App() {
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({ partido: "", nivel: "", camara: "" });

  const filtered = useMemo(() => {
    return actoresData.filter((a) => {
      if (filters.partido && a.partido_actual !== filters.partido) return false;
      if (filters.nivel && a.nivel !== filters.nivel) return false;
      if (filters.camara && a.camara !== filters.camara) return false;
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
        href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&display=swap"
        rel="stylesheet"
      />
      <div
        style={{
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          fontFamily: "'Syne', -apple-system, sans-serif",
          background: "#f8fafc",
          color: "#0f172a",
          fontSize: 14,
        }}
      >
        <Topbar search={search} onSearch={setSearch} />
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          <Sidebar
            actores={filtered}
            selected={selected}
            onSelect={setSelected}
            filters={filters}
            onFilterChange={handleFilterChange}
          />
          {selected ? <DetailPanel key={selected.id} actor={selected} /> : <EmptyState />}
        </div>
      </div>
    </>
  );
}
