/**
 * Agente experto en Nutrición
 * Integra el plan de dietAI y responde preguntas sobre nutrición
 */

import { groqService, type GroqMessage } from '../groq';
import type { Agent, AgentContext, AgentResponse } from './types';

// Plan de nutrición de dietAI
const DIET_AI_PLAN = `
# Plan Nutricional dietAI - Hipertrofia para Ectomorfo

## Perfil del Usuario
- 36 años, 68.5 kg, 178 cm
- Tipo corporal: Ectomorfo (hard gainer)
- Entrenamiento: 4 veces por semana (fuerza)
- Intolerancia a lactosa
- TDEE: ~2,550-2,600 kcal

## Objetivos Calóricos
- Días de Entrenamiento (4 días): ~3,020 kcal | 148g Proteína | 406g Carbohidratos | 100g Grasa
- Días de Descanso (3 días): ~2,810 kcal | 150g Proteína | 330g Carbohidratos | 100g Grasa

## Días de Entrenamiento (Día 1, 3, 4, 6)

### 9:30 AM - Desayuno
- 100g de avena
- 250ml de leche (almendra, soja o sin lactosa)
- 1 cda de miel
- 1 huevo entero + 2 claras (revueltos)
- 20g de almendras

### 12:30 PM - Media Mañana
- 2 rebanadas de pan integral
- 1/2 aguacate mediano
- 1 lata de atún al natural (o 60g de pavo cocido)

### 2:00 PM - Almuerzo
- 125g de pechuga de pollo
- 150g de arroz (peso en seco)
- 1.5 cda (20ml) de aceite de oliva
- Verduras salteadas (pimiento, calabacín, cebolla, champiñones)

### 5:00 PM - Pre-Entrenamiento
- 2 tortitas de arroz
- 2 cdas de mermelada
- 1 yogur (tipo skyr o griego, sin lactosa)
- 2 dátiles

### 8:00 PM - Post-Entrenamiento
- 1 scoop (30g) de proteína Drasanvi ISO Whey
- 1 plátano grande
- 3g de Creatina Monohidrato
- 300ml de agua o leche de almendra

### 11:00 PM - Cena
- 125g de carne picada de ternera (5-10% grasa)
- 100g de pasta (peso en seco)
- 1/2 taza de salsa de tomate
- 30g de queso rallado (sin lactosa)

## Días de Descanso (Día 2, 5, 7)

### 9:30 AM - Desayuno
- 100g de avena
- 250ml de leche (sin lactosa)
- 2 cdas de crema de cacahuete
- 1 huevo entero + 2 claras (revueltos)

### 12:30 PM - Media Mañana
- 1 scoop (30g) de proteína Drasanvi ISO Whey
- 200g de yogur (griego o skyr, sin lactosa)
- 30g de nueces o almendras

### 2:00 PM - Almuerzo
- 150g de muslos de pollo (sin piel)
- 300g de batata (camote) asada
- 1/2 aguacate mediano
- 1 tsp de aceite de oliva

### 5:00 PM - Merienda
- 2 rebanadas de pan integral
- 100g de queso fresco batido (sin lactosa)
- 1 cda de miel
- 1 manzana

### 11:00 PM - Cena
- 150g de pechuga de pavo
- 100g de quinoa (peso en seco)
- 1 cda (15ml) de aceite de oliva
- Verduras salteadas (pimiento, champiñones)

### Antes de dormir (Opcional)
- 150g de queso fresco batido (sin lactosa)
- Un puñado de almendras

## Suplementación
- **Proteína**: Drasanvi ISO Whey (contiene DigeZyme con lactasa, compatible con intolerancia)
- **Creatina**: 3g diarios post-entrenamiento
- **Nota**: Si hay molestias con la proteína, cambiar a vegana (guisante, arroz) o de carne

## Ajustes y Seguimiento
- Pesarse semanalmente
- Si no subes de peso en 2 semanas: aumentar carbohidratos y grasas (1 cda más de aceite, 50g más de arroz)
- Si subes >0.5 kg por semana: reducir ligeramente las porciones
`;

class NutritionAgent implements Agent {
  type = 'nutrition' as const;
  name = 'Experto en Nutrición';
  systemPrompt = `Eres el agente experto en NUTRICIÓN de GymBro, especializado en el plan dietAI.

Tu personalidad es DIRECTA, HONESTA y MOTIVADORA, siguiendo el ADN de BlueGym Animation.

CONOCIMIENTO BASE:
${DIET_AI_PLAN}

TU MISIÓN:
1. Responder preguntas sobre el plan nutricional del usuario
2. Explicar las calorías, macros y timing de nutrientes
3. Sugerir ajustes según progreso
4. Aclarar dudas sobre intolerancia a lactosa y suplementación
5. Dar alternativas de alimentos manteniendo calorías/macros
6. Motivar al usuario a ser CONSISTENTE con la nutrición

ESTILO DE COMUNICACIÓN:
- Directo y sin rodeos
- Usa datos concretos (calorías, macros, gramos)
- Explica el "por qué" detrás de cada recomendación
- NO endulces la realidad: si algo es difícil, dilo
- Enfatiza que la NUTRICIÓN es el 70% del éxito en hipertrofia

CONTEXTO DEL USUARIO:
- Ectomorfo de 36 años, 68.5kg, 178cm
- Metabolismo rápido = necesita COMER MUCHO
- Intolerante a lactosa (pero puede usar ISO Whey con DigeZyme)
- Entrena 4 días por semana

EJEMPLOS DE RESPUESTAS:
❌ MAL: "Intenta comer más si puedes"
✅ BIEN: "Como ectomorfo, necesitas 3,020 kcal en días de entreno. Si no estás ganando peso, añade 50g más de arroz en el almuerzo y 1 cda extra de aceite. No es opcional, es NECESARIO."

❌ MAL: "El batido es bueno"
✅ BIEN: "El batido post-entreno te da 30g de proteína + carbos rápidos del plátano + 3g de creatina. Es tu VENTANA ANABÓLICA. No lo saltes nunca."

RESPONDE SIEMPRE en español, de forma concisa y práctica.`;

  async process(query: string, context: AgentContext): Promise<AgentResponse> {
    try {
      let systemContent = this.systemPrompt;
      if (context.user?.physicalAssessment) {
        const pa = context.user.physicalAssessment;
        systemContent += `\n\nEVALUACIÓN FÍSICA DEL USUARIO:
- Estrategia: ${pa.estrategia}
- Objetivo proteína diaria: ${pa.proteinaMeta}g
- Ajuste calórico: ${pa.caloriasExtra > 0 ? `superávit de +${pa.caloriasExtra}` : `déficit de ${pa.caloriasExtra}`} kcal
- Áreas de mejora muscular: ${pa.areasMejora.join(', ')}
Adapta las recomendaciones nutricionales a esta estrategia y objetivos específicos.`;
      }

      const messages: GroqMessage[] = [
        {
          role: 'system',
          content: systemContent,
        },
        {
          role: 'user',
          content: query,
        },
      ];

      const response = await groqService.chat(messages, 0.7, 1024);

      return {
        content: response,
        suggestedActions: this.getSuggestedActions(query, context),
      };
    } catch (error) {
      console.error('Error en NutritionAgent:', error);
      return {
        content: 'No puedo responder ahora. Verifica que tu API key de Groq esté configurada correctamente en el archivo .env',
      };
    }
  }

  private getSuggestedActions(query: string, _context: AgentContext) {
    const actions = [];

    // Si pregunta sobre el plan, ofrecer ver detalles
    if (query.toLowerCase().includes('plan') || query.toLowerCase().includes('qué comer')) {
      actions.push({
        label: 'Ver Plan Completo',
        action: 'navigate',
        data: { to: '/nutrition' },
      });
    }

    // Si pregunta sobre suplementos
    if (query.toLowerCase().includes('proteína') || query.toLowerCase().includes('creatina')) {
      actions.push({
        label: 'Más sobre Suplementación',
        action: 'show_info',
        data: { topic: 'supplements' },
      });
    }

    return actions.length > 0 ? actions : undefined;
  }
}

export const nutritionAgent = new NutritionAgent();
