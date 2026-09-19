/**
 * Clasificador de Especialidades / Áreas Tecnológicas
 */

export type TechCategory = 
  | 'software_dev'
  | 'data_ai'
  | 'qa_testing'
  | 'it_support'
  | 'ui_ux_product';

export interface CategoryDetectionResult {
  category: TechCategory;
  categoryLabel: string;
}

export function detectTechCategory(title: string = '', description: string = ''): CategoryDetectionResult {
  const text = `${title} ${description}`.toLowerCase();

  // 1. Datos e Inteligencia Artificial
  if (
    text.includes('data') ||
    text.includes('datos') ||
    text.includes('machine learning') ||
    text.includes('inteligencia artificial') ||
    text.includes('ai engineer') ||
    text.includes('prompt engineer') ||
    text.includes('power bi') ||
    text.includes('powerbi') ||
    text.includes('tableau') ||
    text.includes('business intelligence') ||
    text.includes('analista bi') ||
    text.includes('bi analyst') ||
    text.includes('etl') ||
    text.includes('big data') ||
    text.includes('analytics') ||
    text.includes('data engineer') ||
    text.includes('ingeniero de datos') ||
    text.includes('cientifico de datos') ||
    text.includes('data scientist') ||
    text.includes('deep learning') ||
    text.includes('nlp') ||
    text.includes('analista de datos') ||
    text.includes('database') ||
    text.includes('dba') ||
    text.includes('sql developer')
  ) {
    return {
      category: 'data_ai',
      categoryLabel: 'Datos & IA'
    };
  }

  // 2. Control de Calidad & Testing (QA)
  if (
    text.includes('qa') ||
    text.includes('tester') ||
    text.includes('testing') ||
    text.includes('calidad de software') ||
    text.includes('automation') ||
    text.includes('automatizador') ||
    text.includes('cypress') ||
    text.includes('selenium') ||
    text.includes('postman') ||
    text.includes('control de calidad') ||
    text.includes('pruebas de software')
  ) {
    return {
      category: 'qa_testing',
      categoryLabel: 'QA & Testing'
    };
  }

  // 3. Soporte TI, Infraestructura & Redes
  if (
    text.includes('soporte tecnico') ||
    text.includes('soporte técnico') ||
    text.includes('soporte ti') ||
    text.includes('help desk') ||
    text.includes('mesa de ayuda') ||
    text.includes('infraestructura') ||
    text.includes('sysadmin') ||
    text.includes('administrador de sistemas') ||
    text.includes('redes') ||
    text.includes('ciberseguridad') ||
    text.includes('seguridad informatica') ||
    text.includes('devops') ||
    text.includes('cloud engineer') ||
    text.includes('sre')
  ) {
    return {
      category: 'it_support',
      categoryLabel: 'Soporte & Cloud'
    };
  }

  // 4. Diseño UI/UX & Producto
  if (
    text.includes('ux') ||
    text.includes('ui') ||
    text.includes('product designer') ||
    text.includes('diseñador web') ||
    text.includes('diseño de interfaces') ||
    text.includes('product owner') ||
    text.includes('scrum master')
  ) {
    return {
      category: 'ui_ux_product',
      categoryLabel: 'UI/UX & Producto'
    };
  }

  // 5. Desarrollo de Software (Predeterminado)
  return {
    category: 'software_dev',
    categoryLabel: 'Desarrollo'
  };
}
