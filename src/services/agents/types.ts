/**
 * Tipos para el sistema de agentes de GymBro
 */

export type AgentType =
  | 'orchestrator'   // Agente orquestador principal
  | 'nutrition'      // Experto en nutrición y dietAI
  | 'exercise'       // Experto en ejercicios y técnica BlueGym
  | 'training'       // Experto en entrenamientos y RIR
  | 'progress';      // Experto en análisis de progreso

export interface AgentContext {
  // Datos del usuario
  user?: {
    id: number;
    nombre: string;
    peso: number;
    altura: number;
    edad: number;
    physicalAssessment?: {
      estrategia: string;
      prioridades: string[];
      proteinaMeta: number;
      caloriasExtra: number;
      puntosFuertes: string[];
      areasMejora: string[];
      notas: string;
    };
  };

  // Contexto de ejercicios
  exercises?: unknown[];
  currentExercise?: unknown;

  // Contexto de entrenamiento
  currentWorkout?: unknown;
  workoutHistory?: unknown[];

  // Contexto de progreso
  progressData?: unknown[];

  // Contexto de nutrición
  nutritionPlan?: unknown;

  // Página actual donde se encuentra el usuario
  currentPage?: 'dashboard' | 'exercises' | 'workout' | 'progress' | 'education' | 'nutrition' | 'profile';
}

export interface AgentResponse {
  content: string;
  suggestedActions?: {
    label: string;
    action: string;
    data?: unknown;
  }[];
  needsSubAgent?: {
    type: AgentType;
    query: string;
  };
}

export interface Agent {
  type: AgentType;
  name: string;
  systemPrompt: string;
  process(query: string, context: AgentContext): Promise<AgentResponse>;
}
