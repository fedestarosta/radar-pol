# Pipeline de Videos — Setup

## 1. Instalar dependencias Python

Abrí Anaconda Prompt y corré:

```bash
pip install yt-dlp openai-whisper anthropic
```

Whisper es pesado (~500MB la primera vez que lo usás, lo descarga solo).

---

## 2. Instalar ffmpeg (OBLIGATORIO para el audio)

Whisper y yt-dlp necesitan ffmpeg para procesar audio.

**Opción A — Con Anaconda (más fácil):**
```bash
conda install -c conda-forge ffmpeg
```

**Opción B — Manual:**
1. Bajá ffmpeg de https://ffmpeg.org/download.html → Windows builds
2. Descomprimí en `C:\ffmpeg`
3. Agregá `C:\ffmpeg\bin` al PATH de Windows:
   - Buscá "Variables de entorno" en el menú inicio
   - En "Variables del sistema" → PATH → Editar → Nuevo → `C:\ffmpeg\bin`
4. Reiniciá PowerShell y verificá con `ffmpeg -version`

---

## 3. Conseguir tu API key de Anthropic

1. Andá a https://console.anthropic.com
2. Settings → API Keys → Create Key
3. Copiá la clave (empieza con `sk-ant-...`)

**Setear la variable de entorno (en Anaconda Prompt):**
```bash
# Windows — temporal (solo para esta sesión)
set ANTHROPIC_API_KEY=sk-ant-tu-clave-aqui

# Windows — permanente (recomendado)
setx ANTHROPIC_API_KEY "sk-ant-tu-clave-aqui"
```

---

## 4. Usar el pipeline

Navegá a la carpeta del proyecto:
```bash
cd "C:\Users\federico.starosta\Documents\GitHub\radar-pol"
```

### Buscar y procesar videos automáticamente:
```bash
# 2 videos de Milei de 2024
python scripts/pipeline_videos.py --actor "Javier Milei" --max 2 --desde 2024

# 3 videos de Kirchner
python scripts/pipeline_videos.py --actor "Cristina Kirchner" --max 3

# Solo ver qué videos encontraría (sin descargar)
python scripts/pipeline_videos.py --actor "Mauricio Macri" --solo-buscar
```

### Procesar un video específico (recomendado para empezar):
```bash
python scripts/pipeline_videos.py --actor "Javier Milei" --url "https://www.youtube.com/watch?v=VIDEO_ID"
```

---

## 5. Dónde quedan los archivos

```
radar-pol/
├── videos/
│   └── javier_milei/
│       └── abc123_titulo.mp3        ← audio descargado
├── transcripciones/
│   └── javier_milei/
│       └── abc123.txt               ← texto transcripto
└── analisis/
    └── javier_milei/
        ├── resultado.json           ← análisis completo
        └── patch_actores.json       ← listo para pegar en actores.json
```

---

## 6. Incorporar el análisis a la app

Abrí `analisis/<actor>/patch_actores.json` y copiá:
- `citas_destacadas_nuevas` → al array `citas_destacadas` del actor
- `agenda_publica_nuevos` → al array `agenda_publica` del actor
- `videos` → nuevo campo `videos` del actor (hay que agregarlo al schema)

---

## Costos estimados

| Servicio | Costo |
|----------|-------|
| yt-dlp (descarga) | Gratis |
| Whisper (transcripción) | Gratis — corre local |
| Claude API (análisis) | ~$0.01–0.05 por video |

Un video de 30 minutos ≈ 5000 tokens ≈ $0.02 con Claude Sonnet.

---

## Problemas comunes

**"ffmpeg not found"** → Instalá ffmpeg (paso 2)

**"No se encontraron videos"** → Probá con `--url` pasando un link directo de YouTube

**"ANTHROPIC_API_KEY not found"** → Seteá la variable de entorno (paso 3)

**Whisper tarda mucho** → Normal en la primera transcripción. Para videos largos puede tardar 5-10 min en CPU. Si tenés GPU Nvidia, se acelera automáticamente.
