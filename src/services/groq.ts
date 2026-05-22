/**
 * Servicio de IA usando Groq
 * Groq es una plataforma gratuita y rápida para modelos open source como Llama
 */

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export interface GroqMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GroqResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

class GroqService {
  private apiKey: string;
  private model: string;

  constructor() {
    this.apiKey = import.meta.env.VITE_GROQ_API_KEY || '';
    this.model = import.meta.env.VITE_GROQ_MODEL || 'llama-3.3-70b-versatile';
  }

  /**
   * Verifica si el servicio está configurado correctamente
   */
  isConfigured(): boolean {
    return this.apiKey !== '' && this.apiKey !== 'your_groq_api_key_here';
  }

  /**
   * Realiza una consulta a Groq
   */
  async chat(messages: GroqMessage[], temperature = 0.7, maxTokens = 2048): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('Groq API key no configurada. Por favor, añade tu API key en el archivo .env');
    }

    try {
      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          temperature,
          max_tokens: maxTokens,
          top_p: 1,
          stream: false,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Groq API error: ${response.status} ${response.statusText}. ${
            errorData.error?.message || ''
          }`
        );
      }

      const data: GroqResponse = await response.json();
      return data.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('Error en Groq Service:', error);
      throw error;
    }
  }

  /**
   * Realiza una consulta con streaming (para respuestas en tiempo real)
   */
  async *chatStream(messages: GroqMessage[], temperature = 0.7, maxTokens = 2048): AsyncGenerator<string> {
    if (!this.isConfigured()) {
      throw new Error('Groq API key no configurada. Por favor, añade tu API key en el archivo .env');
    }

    try {
      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          temperature,
          max_tokens: maxTokens,
          top_p: 1,
          stream: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Groq API error: ${response.status} ${response.statusText}. ${
            errorData.error?.message || ''
          }`
        );
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No se pudo obtener el reader del stream');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices[0]?.delta?.content;
              if (content) {
                yield content;
              }
            } catch {
              // Ignorar errores de parseo de líneas individuales
            }
          }
        }
      }
    } catch (error) {
      console.error('Error en Groq Stream:', error);
      throw error;
    }
  }
}

export const groqService = new GroqService();

// ─── Full W IA Adaptativa ─────────────────────────────────────────────────────

export interface HistorialSesion {
  fecha: string;
  musculos: string[];
  ejercicios: string[];
}

export interface PerfilFullWIA {
  nivel: string;
  somatotipo: string;
  objetivo: string;
  equipamiento: string[];
  lesiones?: string[];
  diasDisponibles: number;
  evaluacionFisica?: {
    estrategia: string;
    prioridades: string[];
    proteinaMeta: number;
    caloriasExtra: number;
    puntosFuertes: string[];
    areasMejora: string[];
    notas: string;
  };
}

export async function generarRutinaFullWconIA(
  perfil: PerfilFullWIA,
  historial: HistorialSesion[]
): Promise<import('@/data/fullwRoutines').FullWRoutine> {
  const { diasDisponibles: dias } = perfil;

  const historialTexto = historial.length > 0
    ? historial.map(w =>
        `• ${w.fecha}: músculos=[${w.musculos.join(', ')}] ejercicios=[${w.ejercicios.slice(0, 4).join(', ')}${w.ejercicios.length > 4 ? '…' : ''}]`
      ).join('\n')
    : '• Sin historial (primera rutina del usuario)';

  const distribuciones: Record<number, string> = {
    3: 'Push / Pull / Legs',
    4: 'Upper A / Lower A / Upper B / Lower B',
    5: 'Push / Pull / Legs / Upper / Lower',
    6: 'Push A / Pull A / Legs A / Push B / Pull B / Legs B',
  };

  const systemPrompt = `Eres un experto en programación de entrenamiento siguiendo el sistema Full W (Low Volume, High Intensity).

PRINCIPIOS FULL W:
- 2-3 series efectivas por ejercicio (no contar calentamiento)
- El primer ejercicio de cada día es el compuesto principal (no mover de posición 0)
- Progresión lineal en 8 semanas
- Descansos: 2-3 min en compuestos, 1-2 min accesorios, 1 min aislamiento
- Estructura por día: compuesto pesado → 2-3 accesorios → 1-2 aislamiento → 1 core

REGLAS DE VOLUMEN POR SESIÓN (OBLIGATORIO CUMPLIR):
- Cada día DEBE tener entre 6 y 7 ejercicios (NO menos de 6 NUNCA)
- Duración objetivo de la sesión: 60–90 minutos (con descansos largos del Full W)
- Estructura típica de un día (cumplir esta plantilla):
  1. Compuesto principal pesado (3 series × 6-8)
  2. Compuesto secundario (3 series × 8-10)
  3. Accesorio principal (2-3 series × 8-12)
  4. Accesorio secundario (2-3 series × 10-12)
  5. Aislamiento 1 (2-3 series × 12-15)
  6. Aislamiento 2 o core (2-3 series × 12-20)
  7. (opcional) Core / gemelos / extra (2-3 series × 12-20)

DISTRIBUCIÓN PARA ${dias} DÍAS: ${distribuciones[dias] ?? 'Push / Pull / Legs'}

PERFIL DEL ATLETA:
- Nivel: ${perfil.nivel}
- Somatotipo: ${perfil.somatotipo ?? 'mesomorfo'}
- Objetivo: ${perfil.objetivo}
- Equipamiento: ${perfil.equipamiento.join(', ') || 'completo (barra, mancuernas, polea, máquinas)'}
- Lesiones/Limitaciones: ${perfil.lesiones?.join(', ') || 'ninguna'}

AJUSTES POR SOMATOTIPO:
- ectomorfo → 3 series en compuestos, descansos largos, prioriza compuestos
- mesomorfo → equilibrio compuestos/accesorios, progresión estándar
- endomorfo → un ejercicio extra de aislamiento o core, descansos algo más cortos en accesorios

AJUSTES POR NIVEL:
- principiante → reps 8-12 en todo, 2-3 series
- intermedio → compuestos 6-8, accesorios 8-12, aislamiento 12-15, 2-3 series
- avanzado → compuestos 5-8, accesorios 8-12, aislamiento 10-15, 3 series, añade 1 ejercicio extra (7 totales)

HISTORIAL DE ENTRENAMIENTOS RECIENTES (últimas sesiones):
${historialTexto}
${perfil.evaluacionFisica ? `
EVALUACIÓN FÍSICA PERSONALIZADA DEL ATLETA:
- Estrategia actual: ${perfil.evaluacionFisica.estrategia}
- Grupos musculares PRIORITARIOS (necesitan más volumen y ejercicios): ${perfil.evaluacionFisica.prioridades.join(', ')}
- Puntos fuertes (ya desarrollados): ${perfil.evaluacionFisica.puntosFuertes.join(', ')}
- Áreas de mejora (añadir ejercicios extra aquí): ${perfil.evaluacionFisica.areasMejora.join(', ')}
- Objetivo proteína diaria: ${perfil.evaluacionFisica.proteinaMeta}g | Ajuste calórico: ${perfil.evaluacionFisica.caloriasExtra > 0 ? '+' : ''}${perfil.evaluacionFisica.caloriasExtra} kcal

REGLAS DE PERSONALIZACIÓN BASADAS EN LA EVALUACIÓN:
- En los días donde entrenes grupos PRIORITARIOS, añade 1 ejercicio extra de aislamiento para esos grupos
- Prioriza los grupos de "áreas de mejora" con el primer slot de accesorios de cada día relevante
- Los grupos "puntos fuertes" mantienen volumen estándar (no necesitan énfasis extra)
- La estrategia "${perfil.evaluacionFisica.estrategia}" implica: ${
    perfil.evaluacionFisica.estrategia === 'volumen' ? 'superávit calórico, maximizar volumen de entrenamiento (añade series donde puedas)' :
    perfil.evaluacionFisica.estrategia === 'definicion' ? 'déficit calórico, mantener masa muscular con volumen moderado y descansos algo más cortos' :
    'normocalórico o superávit muy ligero, maximizar músculo minimizando grasa — equilibrio entre volumen e intensidad'
  }
` : ''}
INSTRUCCIONES DE SELECCIÓN:
1. Analiza el historial y VARÍA los ejercicios respecto a las sesiones recientes
2. Respeta las lesiones: elimina ejercicios que carguen las zonas afectadas
3. Prioriza grupos musculares menos entrenados recientemente Y los marcados como prioritarios en la evaluación
4. CADA día debe golpear todos los músculos del split de ese día (no descuides ningún grupo)
5. Si hay evaluación física, aplica las reglas de personalización al seleccionar ejercicios

CATÁLOGO EXACTO (usa EXACTAMENTE estos nombres, respetando mayúsculas/minúsculas):
PECHO: "Press de Banca con Barra", "Press de Banca con Mancuernas", "Press Inclinado con Barra", "Press Inclinado con Mancuernas", "Aperturas con Mancuernas", "Aperturas en Polea", "Fondos en Paralelas"
ESPALDA: "Dominadas", "Remo con Barra", "Remo con Mancuerna (unilateral)", "Remo en Polea Baja", "Jalón al Pecho", "Jalón Neutro al Pecho"
HOMBROS: "Press Militar con Barra", "Press de Hombros con Mancuernas", "Elevaciones Laterales", "Face Pull en Polea", "Pájaros (Deltoides Posterior)"
BÍCEPS: "Curl de Bíceps con Barra", "Curl Inclinado con Mancuernas", "Curl Concentrado", "Curl Martillo", "Curl en Polea"
TRÍCEPS: "Extensiones en Polea (Tríceps)", "Extensiones Tríceps sobre la Cabeza", "Patadas de Tríceps", "Fondos en Paralelas"
PIERNA: "Sentadilla con Barra", "Prensa de Piernas", "Peso Muerto Convencional", "Peso Muerto Rumano", "Curl Femoral", "Hip Thrust", "Zancadas", "Hack Squat"
GEMELOS: "Elevaciones de Gemelos de Pie", "Elevaciones de Gemelos Sentado"
CORE: "Abdominales", "Plancha"

VALIDACIÓN ANTES DE RESPONDER:
- Cuenta los ejercicios de cada día. Si alguno tiene <6 ejercicios, AÑADE más antes de responder.
- Verifica que todos los grupos musculares del día están cubiertos.

RESPONDE ÚNICAMENTE CON JSON VÁLIDO. Sin markdown, sin bloques de código, sin explicaciones. Solo el objeto JSON.

Esquema requerido (ejemplo de un día COMPLETO con 6 ejercicios):
{
  "id": "fullw-ia",
  "nombre": "Full W IA — N Días",
  "dias": N,
  "descripcion": "descripcion breve personalizada en una frase",
  "distribucion": "Push / Pull / ...",
  "semanas": 8,
  "plan": [
    {
      "nombre": "Día 1 — Empuje (Pecho · Hombro · Tríceps)",
      "grupos": ["Pecho", "Hombros", "Tríceps"],
      "ejercicios": [
        { "nombre": "Press de Banca con Barra", "series": 3, "reps": "6-8", "descanso": "3 min", "notas": "Ejercicio principal, retracción escapular" },
        { "nombre": "Press Inclinado con Mancuernas", "series": 3, "reps": "8-10", "descanso": "2 min", "notas": "Énfasis pectoral superior" },
        { "nombre": "Press Militar con Barra", "series": 3, "reps": "6-8", "descanso": "2-3 min" },
        { "nombre": "Aperturas en Polea", "series": 2, "reps": "12-15", "descanso": "1 min", "notas": "Aislamiento pectoral" },
        { "nombre": "Elevaciones Laterales", "series": 3, "reps": "12-15", "descanso": "1 min" },
        { "nombre": "Extensiones en Polea (Tríceps)", "series": 3, "reps": "10-12", "descanso": "1 min" }
      ]
    }
  ]
}`;

  const raw = await groqService.chat(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Genera la rutina Full W adaptativa de ${dias} días. CADA día debe tener mínimo 6 ejercicios (idealmente 6-7). Sesiones de 60-90 minutos.` },
    ],
    0.4,
    8000,
  );

  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('La IA no devolvió JSON válido. Intenta de nuevo.');

  const rutina = JSON.parse(jsonMatch[0]) as import('@/data/fullwRoutines').FullWRoutine;

  if (!Array.isArray(rutina.plan) || rutina.plan.length === 0) {
    throw new Error('La IA generó una rutina con estructura inválida. Intenta de nuevo.');
  }

  for (const dia of rutina.plan) {
    if (!Array.isArray(dia.ejercicios) || dia.ejercicios.length < 6) {
      throw new Error(`El día "${dia.nombre}" tiene solo ${dia.ejercicios?.length ?? 0} ejercicios (mínimo 6). Intenta de nuevo.`);
    }
  }

  rutina.id = `fullw-ia-${Date.now()}`;
  return rutina;
}
