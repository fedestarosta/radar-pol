# Radar Político AR — MVP

Plataforma de perfiles de actores políticos argentinos.

## Stack

- React 18 + Vite
- Datos en JSON (sin backend)
- Fuente: Syne (Google Fonts)

## Estructura del proyecto

```
radar-politico/
├── src/
│   ├── data/
│   │   ├── actores.json      ← perfiles completos
│   │   ├── partidos.json     ← fuerzas políticas
│   │   └── sesiones.json     ← sesiones parlamentarias
│   ├── App.jsx               ← toda la app (componentes + lógica)
│   └── main.jsx              ← entry point
├── index.html
├── vite.config.js
└── package.json
```

## Levantar en local

```bash
npm install
npm run dev
```

Abre http://localhost:5173

## Agregar un actor nuevo

Editá `src/data/actores.json` y agregá un objeto con esta estructura:

```json
{
  "id": "slug-unico",
  "nombre": "Nombre Completo",
  "foto_url": null,
  "partido_actual": "id-del-partido",
  "rol_actual": "Cargo actual",
  "camara": "Senado | Diputados | null",
  "provincia": "Provincia",
  "bloque": "Nombre del bloque",
  "nivel": "nacional | provincial | municipal",
  "biografia": "Texto libre...",
  "etiquetas": ["Tag1", "Tag2"],
  "exposicion_mediatica": 75,
  "influencia_interna": 60,
  "citas_destacadas": ["Frase 1", "Frase 2"],
  "activo": true,
  "conexiones": [
    {
      "actor_id": "id-de-otro-actor",
      "tipo": "aliado_historico | alianza_electoral | alianza_coyuntural | tension_interna | rival_politico | rival_historico",
      "intensidad": 80,
      "descripcion": "Descripción de la relación",
      "desde": "2019"
    }
  ],
  "afinidades": [
    { "partido_id": "lla", "score": 10, "fundamento": "Por qué" }
  ],
  "proyectos": [
    {
      "id": "p-unico",
      "titulo": "Título del proyecto",
      "expediente": "S-0001/24",
      "camara": "Senado",
      "estado": "En comisión | Media sanción | Promulgada | Ingresado",
      "fecha": "2024-01-15",
      "tematica": "Economía",
      "url_hcdn": "https://..."
    }
  ],
  "votaciones": [
    {
      "id": "v-unico",
      "sesion_id": "id-de-sesion",
      "voto": "afirmativo | negativo | abstencion | ausente",
      "fecha": "2024-05-08",
      "tema": "Nombre del tema",
      "resultado_sesion": "Aprobado"
    }
  ],
  "agenda_publica": [
    {
      "id": "a-unico",
      "tema": "Nombre del tema",
      "frecuencia": "alta | media | baja",
      "encuadre": "Cómo lo encuadra este actor",
      "palabras_clave": ["kw1", "kw2"]
    }
  ],
  "noticias": [
    {
      "id": "n-unico",
      "titulo": "Título de la noticia",
      "medio": "Infobae",
      "url": "https://...",
      "fecha": "2024-05-24",
      "categoria": "Política"
    }
  ]
}
```

## Próximos pasos (Fase 2)

- [ ] Reemplazar JSON local por Google Sheets via API
- [ ] Scraping de noticias via RSS (Infobae, La Nación, Clarín)
- [ ] Grafo de conexiones con D3.js
- [ ] Vista comparativa entre dos actores
- [ ] Deploy en Vercel

## Próximos pasos (Fase 3)

- [ ] Base de datos (Supabase)
- [ ] Login / perfiles privados
- [ ] Tier de suscripción
- [ ] Integración con datos del HCDN (votaciones oficiales)
