"""
pipeline_videos.py
─────────────────────────────────────────────────────────────────────────────
Pipeline: YouTube scraping → Whisper transcripción → Claude extracción

USO:
    python pipeline_videos.py --actor "Cristina Kirchner" --max 3
    python pipeline_videos.py --actor "Javier Milei" --max 2 --desde 2024

REQUISITOS (instalar una sola vez):
    pip install yt-dlp openai-whisper anthropic

NECESITÁS:
    - ffmpeg instalado (ver README abajo)
    - ANTHROPIC_API_KEY en variable de entorno (ver README abajo)

SALIDA:
    - Audio descargado en  /videos/<actor>/
    - Transcripción en     /transcripciones/<actor>/
    - Análisis JSON en     /analisis/<actor>/
    - JSON listo para pegar en actores.json
"""

import os
import sys
import json
import argparse
import re
import subprocess
from pathlib import Path

# Forzar UTF-8 en Windows para que los emojis no rompan la consola
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")
from datetime import datetime

# ── Verificar dependencias antes de importar ─────────────────────────────────
def check_deps():
    missing = []
    try:
        import yt_dlp
    except ImportError:
        missing.append("yt-dlp")
    try:
        import whisper
    except ImportError:
        missing.append("openai-whisper")
    try:
        import anthropic
    except ImportError:
        missing.append("anthropic")
    if missing:
        print(f"\n❌ Faltan dependencias: {', '.join(missing)}")
        print(f"   Corré: pip install {' '.join(missing)}\n")
        sys.exit(1)

check_deps()

import yt_dlp
import whisper
import anthropic
import imageio_ffmpeg

# Agregar el ffmpeg bundled de imageio al PATH si no hay uno en el sistema
_ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
os.environ["PATH"] = str(Path(_ffmpeg_exe).parent) + os.pathsep + os.environ.get("PATH", "")
FFMPEG_LOCATION = str(Path(_ffmpeg_exe).parent)

# ── Config ───────────────────────────────────────────────────────────────────
BASE_DIR = Path(__file__).parent.parent
VIDEOS_DIR = BASE_DIR / "videos"
TRANS_DIR  = BASE_DIR / "transcripciones"
ANAL_DIR   = BASE_DIR / "analisis"

for d in [VIDEOS_DIR, TRANS_DIR, ANAL_DIR]:
    d.mkdir(parents=True, exist_ok=True)

CANALES_AR = [
    "LN+", "Infobae", "TN", "C5N", "A24",
    "ElDestape", "Clarín", "Perfil", "Canal26"
]

QUERY_TEMPLATES = [
    '"{actor}" entrevista {año}',
    '"{actor}" discurso {año}',
    '"{actor}" conferencia de prensa {año}',
]

# ── 1. Buscar videos en YouTube ───────────────────────────────────────────────
def buscar_videos(actor: str, max_results: int = 3, desde_año: int = None) -> list[dict]:
    """Busca entrevistas del actor en YouTube y devuelve metadatos."""
    año = desde_año or datetime.now().year
    resultados = []
    vistos = set()

    print(f"\n🔍 Buscando videos de '{actor}'...")

    for template in QUERY_TEMPLATES:
        if len(resultados) >= max_results:
            break

        query = template.format(actor=actor, año=año)

        ydl_opts = {
            "quiet": True,
            "no_warnings": True,
            "extract_flat": True,
            "playlistend": max_results * 2,
        }

        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(f"ytsearch{max_results * 2}:{query}", download=False)
                entries = info.get("entries", []) if info else []

                for entry in entries:
                    if not entry:
                        continue
                    vid_id = entry.get("id")
                    if not vid_id or vid_id in vistos:
                        continue
                    # Filtrar por duración (entre 3 y 90 minutos)
                    duration = entry.get("duration", 0) or 0
                    if not (180 <= duration <= 5400):
                        continue
                    vistos.add(vid_id)
                    resultados.append({
                        "id": vid_id,
                        "titulo": entry.get("title", ""),
                        "canal": entry.get("channel", entry.get("uploader", "")),
                        "url": f"https://www.youtube.com/watch?v={vid_id}",
                        "duracion_seg": duration,
                        "fecha_subida": entry.get("upload_date", ""),
                    })
                    if len(resultados) >= max_results:
                        break
        except Exception as e:
            print(f"   ⚠️  Error buscando '{query}': {e}")
            continue

    print(f"   ✅ {len(resultados)} videos encontrados")
    for v in resultados:
        mins = v['duracion_seg'] // 60
        print(f"      • [{mins} min] {v['titulo'][:70]} — {v['canal']}")

    return resultados[:max_results]


# ── 2. Descargar audio ────────────────────────────────────────────────────────
def descargar_audio(video: dict, actor_slug: str) -> Path | None:
    """Descarga solo el audio del video en formato mp3."""
    out_dir = VIDEOS_DIR / actor_slug
    out_dir.mkdir(parents=True, exist_ok=True)

    # Nombre seguro para archivo
    safe_title = re.sub(r'[^\w\-_]', '_', video['titulo'])[:60]
    out_path = out_dir / f"{video['id']}_{safe_title}.mp3"

    if out_path.exists():
        print(f"   ⏭️  Audio ya existe, saltando descarga")
        return out_path

    print(f"   ⬇️  Descargando audio: {video['titulo'][:60]}...")

    ydl_opts = {
        "format": "bestaudio/best",
        "outtmpl": str(out_dir / f"{video['id']}_{safe_title}.%(ext)s"),
        "postprocessors": [{
            "key": "FFmpegExtractAudio",
            "preferredcodec": "mp3",
            "preferredquality": "64",
        }],
        "ffmpeg_location": FFMPEG_LOCATION,
        "quiet": True,
        "no_warnings": True,
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([video['url']])
        print(f"   ✅ Audio descargado")
        return out_path
    except Exception as e:
        print(f"   ❌ Error descargando: {e}")
        return None


# ── 3. Transcribir con Whisper ────────────────────────────────────────────────
def transcribir(audio_path: Path, actor_slug: str, video_id: str) -> str | None:
    """Transcribe el audio con Whisper local."""
    trans_dir = TRANS_DIR / actor_slug
    trans_dir.mkdir(parents=True, exist_ok=True)
    trans_path = trans_dir / f"{video_id}.txt"

    if trans_path.exists():
        print(f"   ⏭️  Transcripción ya existe, cargando...")
        return trans_path.read_text(encoding="utf-8")

    print(f"   🎙️  Transcribiendo con Whisper (modelo 'small', puede tardar unos minutos)...")
    print(f"        💡 La primera vez descarga el modelo (~500MB)")

    try:
        model = whisper.load_model("small")
        result = model.transcribe(
            str(audio_path),
            language="es",
            fp16=False,  # fp16=False para compatibilidad con CPU
            verbose=False,
        )
        texto = result["text"].strip()
        trans_path.write_text(texto, encoding="utf-8")
        print(f"   ✅ Transcripción guardada ({len(texto)} caracteres)")
        return texto
    except Exception as e:
        print(f"   ❌ Error transcribiendo: {e}")
        return None


# ── 4. Analizar con Claude API ────────────────────────────────────────────────
def analizar_con_claude(transcripcion: str, actor: str, video_meta: dict) -> dict | None:
    """Usa Claude para extraer frases clave, temas y posiciones."""

    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        print("   ❌ No encontré ANTHROPIC_API_KEY en las variables de entorno")
        print("      Seteala con: set ANTHROPIC_API_KEY=tu-clave-aqui")
        return None

    print(f"   🤖 Analizando con Claude...")

    # Truncar si es muy larga (Claude tiene límite de tokens)
    max_chars = 80000
    texto = transcripcion[:max_chars]
    if len(transcripcion) > max_chars:
        print(f"   ⚠️  Transcripción truncada a {max_chars} caracteres")

    prompt = f"""Analizá esta transcripción de una entrevista/discurso de {actor}.

VIDEO: {video_meta.get('titulo', '')}
CANAL: {video_meta.get('canal', '')}
FECHA: {video_meta.get('fecha_subida', '')}

TRANSCRIPCIÓN:
{texto}

Respondé ÚNICAMENTE con un JSON válido con esta estructura exacta (sin texto adicional, sin markdown):
{{
  "citas_destacadas": [
    "frase textual 1 (máximo 20 palabras, que sea representativa)",
    "frase textual 2",
    "frase textual 3"
  ],
  "temas_agenda": [
    {{
      "tema": "nombre del tema",
      "frecuencia": "alta|media|baja",
      "encuadre": "cómo lo plantea el actor en este video (1 oración)",
      "palabras_clave": ["kw1", "kw2", "kw3"]
    }}
  ],
  "posicion_general": "resumen de 2-3 oraciones sobre la posición política expresada en este video",
  "tono": "confrontativo|moderado|propositivo|defensivo|técnico",
  "temas_principales": ["tema1", "tema2", "tema3"]
}}"""

    try:
        client = anthropic.Anthropic(api_key=api_key)
        message = client.messages.create(
            model="claude-opus-4-8",
            max_tokens=1500,
            messages=[{"role": "user", "content": prompt}]
        )
        raw = message.content[0].text.strip()

        # Limpiar posible markdown
        raw = re.sub(r'^```json\s*', '', raw)
        raw = re.sub(r'\s*```$', '', raw)

        analysis = json.loads(raw)
        print(f"   ✅ Análisis completado — {len(analysis.get('citas_destacadas', []))} citas, {len(analysis.get('temas_agenda', []))} temas")
        return analysis
    except json.JSONDecodeError as e:
        print(f"   ❌ Error parseando respuesta de Claude: {e}")
        return None
    except Exception as e:
        print(f"   ❌ Error llamando a Claude API: {e}")
        return None


# ── 5. Guardar resultado ──────────────────────────────────────────────────────
def guardar_resultado(actor: str, actor_slug: str, videos: list, analisis: list):
    """Guarda el resultado consolidado como JSON listo para usar."""
    anal_dir = ANAL_DIR / actor_slug
    anal_dir.mkdir(parents=True, exist_ok=True)

    # JSON detallado por video
    resultado = {
        "actor": actor,
        "procesado_en": datetime.now().isoformat(),
        "videos": []
    }

    for video, anal in zip(videos, analisis):
        entrada = {**video, "analisis": anal}
        resultado["videos"].append(entrada)

    out_path = anal_dir / "resultado.json"
    out_path.write_text(json.dumps(resultado, ensure_ascii=False, indent=2), encoding="utf-8")

    # JSON con el formato listo para pegar en actores.json
    patch = generar_patch_actor(actor, resultado)
    patch_path = anal_dir / "patch_actores.json"
    patch_path.write_text(json.dumps(patch, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"\n💾 Resultados guardados en: {anal_dir}")
    print(f"   • resultado.json       — análisis completo")
    print(f"   • patch_actores.json   — listo para copiar en actores.json")

    return patch


def generar_patch_actor(actor: str, resultado: dict) -> dict:
    """Genera el fragmento JSON para actualizar actores.json."""
    todas_citas = []
    todos_temas = {}

    for video in resultado["videos"]:
        anal = video.get("analisis")
        if not anal:
            continue

        # Citas: deduplicar
        for cita in anal.get("citas_destacadas", []):
            if cita not in todas_citas:
                todas_citas.append(cita)

        # Videos en formato para actores.json
        pass

    videos_patch = []
    for video in resultado["videos"]:
        videos_patch.append({
            "id": f"yt-{video['id']}",
            "youtube_id": video["id"],
            "titulo": video["titulo"],
            "canal": video["canal"],
            "url": video["url"],
            "fecha": video.get("fecha_subida", ""),
            "duracion_seg": video.get("duracion_seg", 0),
            "tono": video.get("analisis", {}).get("tono", ""),
            "temas_principales": video.get("analisis", {}).get("temas_principales", []),
            "posicion_general": video.get("analisis", {}).get("posicion_general", ""),
        })

    # Temas de agenda deduplicados
    agenda_patch = []
    vistos = set()
    for video in resultado["videos"]:
        for tema in video.get("analisis", {}).get("temas_agenda", []):
            key = tema["tema"].lower()
            if key not in vistos:
                vistos.add(key)
                agenda_patch.append({
                    "id": f"yt-{re.sub(r'[^a-z0-9]', '-', key)[:20]}",
                    **tema
                })

    return {
        "_instrucciones": f"Copiá estos campos al actor '{actor}' en actores.json",
        "citas_destacadas_nuevas": todas_citas[:5],
        "videos": videos_patch,
        "agenda_publica_nuevos": agenda_patch,
    }


# ── Main ──────────────────────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(
        description="Pipeline: YouTube → Whisper → Claude para actores políticos AR"
    )
    parser.add_argument("--actor", required=True, help='Nombre del actor, ej: "Cristina Kirchner"')
    parser.add_argument("--max", type=int, default=2, help="Máximo de videos a procesar (default: 2)")
    parser.add_argument("--desde", type=int, default=None, help="Año mínimo de búsqueda, ej: 2024")
    parser.add_argument("--solo-buscar", action="store_true", help="Solo busca videos, no descarga ni transcribe")
    parser.add_argument("--url", type=str, default=None, help="URL de YouTube específica (saltea la búsqueda)")
    args = parser.parse_args()

    actor = args.actor
    actor_slug = re.sub(r'[^\w]', '_', actor.lower())

    print(f"\n{'='*60}")
    print(f"  RADAR POLÍTICO — Pipeline de videos")
    print(f"  Actor: {actor}")
    print(f"  Máximo: {args.max} videos")
    print(f"{'='*60}")

    # Si pasaron una URL específica, usarla directo
    if args.url:
        videos = [{
            "id": args.url.split("v=")[-1].split("&")[0],
            "titulo": "Video manual",
            "canal": "Manual",
            "url": args.url,
            "duracion_seg": 0,
            "fecha_subida": "",
        }]
    else:
        videos = buscar_videos(actor, args.max, args.desde)

    if not videos:
        print("\n❌ No se encontraron videos. Probá con --url para pasar un link directo.")
        return

    if args.solo_buscar:
        print("\n✅ Modo solo-buscar. Para procesar, corré sin --solo-buscar")
        return

    analisis_lista = []

    for i, video in enumerate(videos, 1):
        print(f"\n── Video {i}/{len(videos)}: {video['titulo'][:60]} ──")

        # Descargar audio
        audio_path = descargar_audio(video, actor_slug)
        if not audio_path:
            analisis_lista.append(None)
            continue

        # Transcribir
        transcripcion = transcribir(audio_path, actor_slug, video["id"])
        if not transcripcion:
            analisis_lista.append(None)
            continue

        # Analizar con Claude
        anal = analizar_con_claude(transcripcion, actor, video)
        analisis_lista.append(anal)

    # Guardar resultados
    patch = guardar_resultado(actor, actor_slug, videos, analisis_lista)

    print(f"\n{'='*60}")
    print(f"  ✅ Pipeline completado")
    print(f"")
    print(f"  Citas extraídas:")
    for cita in patch.get("citas_destacadas_nuevas", []):
        print(f"    • \"{cita[:80]}\"")
    print(f"")
    print(f"  Temas detectados:")
    for tema in patch.get("agenda_publica_nuevos", []):
        print(f"    • [{tema['frecuencia']}] {tema['tema']}")
    print(f"{'='*60}\n")


if __name__ == "__main__":
    main()
