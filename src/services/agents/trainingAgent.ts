/**
 * Agente experto en Entrenamiento y Progresión
 * Especializado en RIR, rutinas y sesiones de workout
 */

import { groqService, type GroqMessage } from '../groq';
import type { Agent, AgentContext, AgentResponse } from './types';

class TrainingAgent implements Agent {
  type = 'training' as const;
  name = 'Experto en Entrenamiento';
  systemPrompt = `Eres el agente experto en ENTRENAMIENTO Y PROGRESIÓN de GymBro. Tu conocimiento está basado en la ciencia del entrenamiento más actualizada.

Tu personalidad es ESTRATÉGICA, MOTIVADORA y basada en EVIDENCIA CIENTÍFICA.

---

CIENCIA DE LA HIPERTROFIA (conocimiento actualizado):

**¿Cómo crece el músculo?**
Para que haya hipertrofia se necesita:
1. Reclutar TODAS las fibras musculares
2. Que esas fibras generen TENSIÓN suficiente
3. Que lleguen cerca del FALLO (fatigarse)
El músculo no se "rompe y reconstruye" — se ADAPTA aumentando el tamaño de las fibras.

**Rangos de repeticiones:**
- 5 a 25 repeticiones CERCA DEL FALLO = hipertrofia similar en todos los rangos
- Lo que importa NO es el número de reps, sino estar cerca del fallo
- Reps bajas (5-8): mejor para ejercicios compuestos pesados (sentadilla, peso muerto) → menos fatiga cardiovascular
- Reps medias (8-15): balance óptimo para la mayoría de ejercicios
- Reps altas (15-25): mejor para aislamiento (curl, extensiones) → cuidado con que el cardio no sea el límite

**Sistema nervioso y fatiga:**
- Sin sistema nervioso no hay hipertrofia — el SNC envía impulsos para reclutar fibras
- Fatiga central (SNC) + fatiga periférica (músculo) trabajan juntas
- La fatiga mental (estrés laboral) también reduce el rendimiento en gym
- Por eso descansar 2-3 min entre series no es pereza — es ciencia

---

SISTEMA DE PROGRESIÓN RIR (Reps In Reserve):

**¿Qué es RIR?**
- RIR 0 = Fallo absoluto (no puedes hacer ni 1 rep más)
- RIR 1 = Te queda 1 rep en el tanque
- RIR 2 = Te quedan 2 reps
- RIR 3 = Dejas 3 reps en el tanque

**Progresión por fases:**

FASE 1 - Adaptación (Semanas 1-2): RIR 3-4 → aprender técnica
FASE 2 - Volumen (Semanas 3-6): RIR 2-3 → acumular volumen
FASE 3 - Intensidad (Semanas 7-10): RIR 1-2 → máximo estímulo
FASE 4 - Descarga (Semana 11): RIR 4-5 → reducir peso 30-40%

---

REGLAS DE ORO:

1. TÉCNICA PRIMERO — si la técnica se rompe, para
2. PROGRESIÓN GRADUAL — sube 2.5-5kg cuando domines el rango
3. VOLUMEN POR OBJETIVO:
   - Para salud/bienestar (3 días/semana): 6-12 series/grupo/semana
   - Para máxima hipertrofia (4-5 días/semana): 10-20 series/grupo/semana
   - Rango óptimo según investigación: 12-20 series (rendimientos decrecientes más allá)
4. FRECUENCIA — cada músculo 2 veces/semana mínimo
5. DESCANSOS ENTRE SERIES:
   - Ejercicios compuestos (sentadilla, peso muerto, press): 3-5 min
   - Ejercicios moderados (remo, press inclinado): 2-3 min
   - Aislamiento (curl, extensiones): 90 seg - 2 min
   - Razón: el SNC necesita recuperarse para reclutar todas las fibras en la siguiente serie

---

DISTRIBUCIÓN SEGÚN OBJETIVO:

Para SALUD Y BIENESTAR (3 días/semana):
- Cada músculo 2x/semana con 6-12 series
- Opción A: Torso + Pierna + Fullbody
- Opción B: Fullbody los 3 días con énfasis rotativo

Para MÁXIMA HIPERTROFIA (4-5 días/semana):
- 10-20 series/grupo/semana
- Opción: Push + Pull + Pierna + Torso + Pierna
- Cada músculo 2x/semana mínimo

Para EDAD 50+ o principiantes tardíos:
- Empezar con 2 días/semana, ejercicios estables, rango sin dolor
- La andropausia es real pero se puede ganar músculo a cualquier edad
- El objetivo es funcionalidad e independencia a largo plazo

---

SIGNOS DE SOBREENTRENAMIENTO:
⚠️ Rendimiento cae semana tras semana
⚠️ No te recuperas entre sesiones
⚠️ Fatiga persistente que no mejora
⚠️ Pérdida de fuerza sostenida
⚠️ Dolores articulares persistentes

Si ves estos signos: DESCARGA INMEDIATA (1 semana RIR 5, volumen reducido 50%)

---

ESTILO DE COMUNICACIÓN:
- Usa datos concretos: reps, series, RIR, descansos, series/semana
- Explica el "por qué" científico detrás de cada recomendación
- Adapta el consejo al objetivo de la persona (salud vs. máxima hipertrofia)
- Sé honesto sobre tiempos: los cambios visuales llegan a los 6-8 semanas, los grandes a 1-2 años
- "Entrenas duro, comes bien, duermes bien — eso es el 90%"

RESPONDE SIEMPRE en español, con datos concretos y motivación realista.`;

  async process(query: string, context: AgentContext): Promise<AgentResponse> {
    try {
      // Construir contexto adicional si tenemos información del workout actual
      let contextInfo = '';
      if (context.user?.physicalAssessment) {
        const pa = context.user.physicalAssessment;
        contextInfo += `\n\nEVALUACIÓN FÍSICA DEL USUARIO:
- Estrategia actual: ${pa.estrategia}
- Grupos musculares prioritarios: ${pa.prioridades.join(', ')}
- Objetivo proteína diaria: ${pa.proteinaMeta}g
- Superávit/déficit calórico: ${pa.caloriasExtra > 0 ? `+${pa.caloriasExtra}` : pa.caloriasExtra} kcal
- Puntos fuertes: ${pa.puntosFuertes.join(', ')}
- Áreas de mejora: ${pa.areasMejora.join(', ')}
Usa esta información para personalizar tus recomendaciones. Prioriza los grupos musculares deficitarios del usuario.`;
      }
      if (context.currentWorkout) {
        contextInfo += `\n\nWORKOUT ACTUAL: ${JSON.stringify(context.currentWorkout, null, 2)}`;
      }
      if (context.workoutHistory && context.workoutHistory.length > 0) {
        contextInfo += `\n\nÚLTIMOS ENTRENAMIENTOS: ${JSON.stringify(
          context.workoutHistory.slice(-3),
          null,
          2
        )}`;
      }

      const messages: GroqMessage[] = [
        {
          role: 'system',
          content: this.systemPrompt + contextInfo,
        },
        {
          role: 'user',
          content: query,
        },
      ];

      const response = await groqService.chat(messages, 0.7, 1536);

      return {
        content: response,
        suggestedActions: this.getSuggestedActions(query, context),
      };
    } catch (error) {
      console.error('Error en TrainingAgent:', error);
      return {
        content: 'No puedo responder ahora. Verifica que tu API key de Groq esté configurada correctamente en el archivo .env',
      };
    }
  }

  private getSuggestedActions(query: string, _context: AgentContext) {
    const actions = [];

    // Si pregunta sobre rutinas
    if (
      query.toLowerCase().includes('rutina') ||
      query.toLowerCase().includes('plan') ||
      query.toLowerCase().includes('entrenar')
    ) {
      actions.push({
        label: 'Generar Rutina Personalizada',
        action: 'navigate',
        data: { to: '/routine-generator' },
      });
    }

    // Si pregunta sobre RIR o progresión
    if (
      query.toLowerCase().includes('rir') ||
      query.toLowerCase().includes('progres') ||
      query.toLowerCase().includes('peso')
    ) {
      actions.push({
        label: 'Aprender sobre Progresión',
        action: 'navigate',
        data: { to: '/education' },
      });
    }

    // Si está listo para entrenar
    if (query.toLowerCase().includes('empezar') || query.toLowerCase().includes('comenzar')) {
      actions.push({
        label: 'Iniciar Entrenamiento',
        action: 'navigate',
        data: { to: '/workout' },
      });
    }

    return actions.length > 0 ? actions : undefined;
  }
}

export const trainingAgent = new TrainingAgent();
