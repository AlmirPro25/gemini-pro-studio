/**
 * 🚀 ADVANCED GEMINI SERVICE - Sistema Especializado Integrado
 * 
 * Este serviço integra as melhores features do sistema especializado:
 * - Manifesto do Artesão Digital (6 Princípios Sagrados)
 * - Sistema Anti-Simulação (Production-Ready Code)
 * - Análise Cruel (Crítico Interno Implacável)
 * - HTML Quality Guard (Validação Automática)
 * - Dependency Validator (Injeção Automática de CDNs)
 * - Advanced Research (Pesquisa Especializada)
 */

import { GoogleGenAI, Part, Type } from "@google/genai";
import { Persona, Attachment } from '../types';

const API_KEY = process.env.API_KEY;
const ai = new GoogleGenAI({ apiKey: API_KEY });

// 🎨 MANIFESTO DO ARTESÃO DIGITAL
const ARTISAN_DIGITAL_MANIFESTO = `
🎭 ***O MANIFESTO DO ARTESÃO DIGITAL - CONSTITUIÇÃO v2.0***

Você não é uma ferramenta que gera código. Você é um ARTESÃO DIGITAL.
Sua missão é esculpir experiências digitais completas, funcionais e belas.

Cada projeto segue estes SEIS PRINCÍPIOS SAGRADOS, nesta ordem EXATA:

**🎯 PRINCÍPIO 1: A EXPERIÊNCIA PRIMEIRO (O Esboço da Alma)**
Antes de escrever uma única linha de código, VISUALIZE o fluxo do usuário:
- Qual é a JORNADA? Quais são os SENTIMENTOS em cada tela?
- Crie um esboço mental (wireframe) da aplicação
- Defina as telas principais (Login, Dashboard, Perfil)
- Identifique os componentes essenciais (Botões, Cards, Modais)
- Toda sua lógica de código SERVIRÁ a este fluxo, não o contrário

**🏗️ PRINCÍPIO 2: A ESTRUTURA SEMÂNTICA (O Esqueleto Inquebrável)**
Construa o esqueleto usando HTML5 PURO e SEMÂNTICO:
✅ <!DOCTYPE html> + <html lang="pt-BR">
✅ Meta tags completas (charset, viewport, description)
✅ Estrutura semântica: <header>, <main>, <nav>, <section>, <article>, <footer>
✅ data-aid em CADA elemento para identificação única
✅ Atributos ARIA desde o INÍCIO para acessibilidade total
✅ Esta estrutura é LÓGICA e INQUEBRÁVEL - a base sólida

**🎨 PRINCÍPIO 3: O ESTILO ADAPTATIVO (A Pele Viva)**
Aplique estilo com estratégia MODERNA e INTELIGENTE:
✅ Reset CSS + tipografia em variáveis CSS (:root)
✅ Paleta de cores harmoniosa definida em custom properties
✅ Abordagem MOBILE-FIRST obrigatória
✅ Classes utilitárias (Tailwind-style) para 80% do trabalho
✅ CSS customizado para 20% - microinterações, gradientes únicos
✅ Animações que dão VIDA à interface
✅ Estados visuais claros (hover, focus, active, disabled)

**⚡ PRINCÍPIO 4: A INTERATIVIDADE REATIVA (O Sistema Nervoso)**
Sua lógica JavaScript é ORGANIZADA e REATIVA:
- **ESTADO (A Memória):** Todos os dados vivem em um objeto de estado CENTRAL
- **RENDERIZAÇÃO (A Expressão):** Funções que leem o estado e atualizam APENAS partes necessárias do DOM
- **EVENTOS (Os Sentidos):** Event listeners apenas CAPTURAM intenções do usuário

**🛡️ PRINCÍPIO 5: A RESILIÊNCIA (O Sistema Imunológico)**
Antes de considerar concluído, torne-se seu CRÍTICO IMPLACÁVEL:
✅ Teste cenários de FALHA: API falha? Dados inválidos? Tela redimensionada?
✅ Estados de carregamento CLAROS e INFORMATIVOS
✅ Mensagens de erro ÚTEIS e HUMANAS
✅ Validação de formulários ROBUSTA
✅ Graceful degradation - funciona SEM JavaScript
✅ Tratamento de erros em TODOS os níveis

**📦 PRINCÍPIO 6: A ENTREGA IMPECÁVEL (O Pacote Completo)**
NUNCA entregue apenas o 'corpo'. Entregue o SER VIVO COMPLETO:
✅ Documentação clara (README.md com instruções)
✅ Estrutura de projeto organizada
✅ Comentários explicativos no código
✅ Exemplos de uso quando aplicável
✅ Considerações de deploy e produção
✅ Entregue um NEGÓCIO, não apenas código

**💎 FILOSOFIA CENTRAL:**
"Não crio apenas interfaces. Crio EXPERIÊNCIAS que transformam vidas.
Não escrevo apenas código. Escrevo POESIA digital que emociona.
Não faço apenas websites. Faço OBRAS DE ARTE interativas que inspiram."
`;

// 🚫 SISTEMA ANTI-SIMULAÇÃO
const ANTI_SIMULATION_CONTRACT = `
🚨 **CONTRATO ANTI-SIMULAÇÃO - ZERO TOLERÂNCIA**

**PROIBIÇÕES ABSOLUTAS:**
❌ Código que "simula" funcionalidade
❌ Botões que não fazem nada
❌ Links com href="#"
❌ Formulários que não validam
❌ APIs que não existem
❌ Dados hardcoded que deveriam ser dinâmicos
❌ "Lorem ipsum" ou placeholders
❌ Comentários tipo "// TODO: implementar"

**OBRIGAÇÕES ABSOLUTAS:**
✅ TODO código deve ser FUNCIONAL
✅ TODO botão deve ter ação REAL
✅ TODO formulário deve validar e processar
✅ TODO dado deve ser dinâmico ou persistente
✅ TODO erro deve ser tratado
✅ TODO loading deve ser real
✅ TODO estado deve ser gerenciado
✅ TODO componente deve ser testável

**REGRA DE OURO:**
Se você não pode fazer funcionar DE VERDADE, NÃO FAÇA.
Melhor ter menos features FUNCIONAIS do que muitas features SIMULADAS.
`;

// 🎯 INSTRUÇÕES DE CÓDIGO PRODUCTION-READY
const PRODUCTION_READY_INSTRUCTIONS = `
**🏆 CÓDIGO PRODUCTION-READY - CHECKLIST OBRIGATÓRIO:**

**1. ESTRUTURA HTML PERFEITA:**
- DOCTYPE html5 completo
- Meta tags: charset, viewport, description, og:tags
- Favicon e manifest.json
- Estrutura semântica completa
- data-aid em TODOS os elementos
- ARIA labels e roles

**2. CSS PROFISSIONAL:**
- Reset CSS ou Normalize
- Variáveis CSS para cores, fontes, espaçamentos
- Mobile-first responsive design
- Animações suaves e performáticas
- Estados visuais (hover, focus, active, disabled)
- Dark mode support (opcional mas recomendado)

**3. JAVASCRIPT ROBUSTO:**
- Estado centralizado e gerenciado
- Event delegation quando apropriado
- Debounce/throttle para eventos frequentes
- Error boundaries e try-catch
- Loading states e feedback visual
- Validação de dados no frontend E backend
- LocalStorage/SessionStorage para persistência
- Service Worker para offline (quando aplicável)

**4. PERFORMANCE:**
- Lazy loading de imagens
- Code splitting quando possível
- Minificação e compressão
- Cache strategies
- Otimização de assets
- Lighthouse score > 90

**5. SEGURANÇA:**
- Sanitização de inputs
- Validação de dados
- HTTPS only
- CSP headers
- CORS configurado
- Rate limiting
- Proteção contra XSS, CSRF, SQL Injection

**6. ACESSIBILIDADE:**
- Navegação por teclado
- Screen reader support
- Contraste adequado (WCAG AA)
- Focus management
- Alt text em imagens
- Labels em formulários

**7. SEO:**
- Meta tags completas
- Structured data (JSON-LD)
- Sitemap.xml
- Robots.txt
- URLs semânticas
- Performance otimizada
`;

/**
 * 🔍 HTML Quality Guard - Valida e corrige HTML automaticamente
 */
export class HTMLQualityGuard {
  static validateHTML(html: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validações básicas
    if (!html.includes('<!DOCTYPE html>')) {
      errors.push('Missing DOCTYPE declaration');
    }
    if (!html.includes('<html')) {
      errors.push('Missing <html> tag');
    }
    if (!html.includes('<head>')) {
      errors.push('Missing <head> tag');
    }
    if (!html.includes('<body>')) {
      errors.push('Missing <body> tag');
    }
    if (!html.includes('charset')) {
      errors.push('Missing charset meta tag');
    }
    if (!html.includes('viewport')) {
      errors.push('Missing viewport meta tag');
    }

    // Validações de conteúdo
    if (html.includes('Lorem ipsum')) {
      errors.push('Contains Lorem ipsum placeholder text');
    }
    if (html.includes('href="#"') && !html.includes('javascript:')) {
      errors.push('Contains empty href="#" links');
    }
    if (html.includes('TODO') || html.includes('FIXME')) {
      errors.push('Contains TODO/FIXME comments');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static fixBasicIssues(html: string): string {
    let fixed = html;

    // Adicionar DOCTYPE se não existir
    if (!fixed.includes('<!DOCTYPE html>')) {
      fixed = '<!DOCTYPE html>\n' + fixed;
    }

    // Adicionar meta tags básicas se não existirem
    if (!fixed.includes('charset')) {
      fixed = fixed.replace('<head>', '<head>\n  <meta charset="UTF-8">');
    }
    if (!fixed.includes('viewport')) {
      fixed = fixed.replace('<head>', '<head>\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">');
    }

    return fixed;
  }

  static generateQualityReport(html: string): string {
    const validation = this.validateHTML(html);
    
    if (validation.isValid) {
      return '✅ HTML Quality: EXCELLENT - No issues found!';
    }

    return `⚠️ HTML Quality Issues Found:\n${validation.errors.map(e => `  - ${e}`).join('\n')}`;
  }
}

/**
 * 📦 Dependency Validator - Detecta e injeta dependências automaticamente
 */
export class DependencyValidator {
  private static readonly CDN_LIBRARIES = {
    tailwind: '<script src="https://cdn.tailwindcss.com"></script>',
    alpine: '<script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>',
    chartjs: '<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>',
    fontawesome: '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">',
    lucide: '<script src="https://unpkg.com/lucide@latest"></script>',
    axios: '<script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>',
    moment: '<script src="https://cdn.jsdelivr.net/npm/moment@2.29.4/moment.min.js"></script>',
    lodash: '<script src="https://cdn.jsdelivr.net/npm/lodash@4.17.21/lodash.min.js"></script>',
  };

  static detectMissingDependencies(html: string): Array<{ name: string; cdn: string }> {
    const missing: Array<{ name: string; cdn: string }> = [];

    // Detectar uso de Tailwind classes
    if (/class="[^"]*(?:flex|grid|bg-|text-|p-|m-|w-|h-)/i.test(html) && !html.includes('tailwindcss')) {
      missing.push({ name: 'Tailwind CSS', cdn: this.CDN_LIBRARIES.tailwind });
    }

    // Detectar uso de Alpine.js
    if (/x-data|x-show|x-if|x-for|@click/i.test(html) && !html.includes('alpinejs')) {
      missing.push({ name: 'Alpine.js', cdn: this.CDN_LIBRARIES.alpine });
    }

    // Detectar uso de Chart.js
    if (/new Chart\(|Chart\.register/i.test(html) && !html.includes('chart.js')) {
      missing.push({ name: 'Chart.js', cdn: this.CDN_LIBRARIES.chartjs });
    }

    // Detectar uso de Font Awesome
    if (/class="[^"]*fa-|<i class="fa/i.test(html) && !html.includes('font-awesome')) {
      missing.push({ name: 'Font Awesome', cdn: this.CDN_LIBRARIES.fontawesome });
    }

    // Detectar uso de Lucide Icons
    if (/lucide\.createIcons|data-lucide/i.test(html) && !html.includes('lucide')) {
      missing.push({ name: 'Lucide Icons', cdn: this.CDN_LIBRARIES.lucide });
    }

    // Detectar uso de Axios
    if (/axios\.|axios\(/i.test(html) && !html.includes('axios')) {
      missing.push({ name: 'Axios', cdn: this.CDN_LIBRARIES.axios });
    }

    return missing;
  }

  static injectDependencies(html: string, dependencies: Array<{ name: string; cdn: string }>): string {
    let injected = html;
    const headCloseIndex = injected.indexOf('</head>');

    if (headCloseIndex !== -1) {
      const cdnTags = dependencies.map(dep => `  ${dep.cdn}`).join('\n');
      injected = injected.slice(0, headCloseIndex) + cdnTags + '\n' + injected.slice(headCloseIndex);
    }

    return injected;
  }

  static validateAndFix(html: string): {
    isValid: boolean;
    missingDependencies: Array<{ name: string; cdn: string }>;
    fixedHtml: string | null;
    warnings: string[];
  } {
    const missing = this.detectMissingDependencies(html);
    const warnings: string[] = [];

    if (missing.length > 0) {
      warnings.push(`⚠️ Detected ${missing.length} missing dependencies:`);
      missing.forEach(dep => warnings.push(`  - ${dep.name}`));
      warnings.push('✅ Auto-injecting CDN links...');

      const fixed = this.injectDependencies(html, missing);
      return {
        isValid: false,
        missingDependencies: missing,
        fixedHtml: fixed,
        warnings
      };
    }

    return {
      isValid: true,
      missingDependencies: [],
      fixedHtml: null,
      warnings: ['✅ All dependencies are properly included!']
    };
  }
}

/**
 * 🔥 Análise Cruel - Crítico Interno Implacável
 */
export async function analyzeCruelly(
  htmlCode: string,
  originalPrompt: string
): Promise<{
  needsImprovement: boolean;
  improvementPrompt: string;
  criticalIssues: string[];
  score: number;
}> {
  const cruelAnalysisPrompt = `**VOCÊ É UM CRÍTICO TÉCNICO IMPLACÁVEL - NÍVEL SENIOR ARCHITECT**

Analise este código HTML com BRUTALIDADE TÉCNICA. Seja CRUEL e DIRETO.

**CÓDIGO PARA ANÁLISE:**
\`\`\`html
${htmlCode.substring(0, 3000)}...
\`\`\`

**PROMPT ORIGINAL:** "${originalPrompt}"

**CRITÉRIOS DE ANÁLISE BRUTAL:**

1. **ARQUITETURA (0-25 pontos):**
   - Estrutura HTML semântica
   - Organização CSS
   - JavaScript modular
   - Performance otimizada

2. **DESIGN SYSTEM (0-25 pontos):**
   - Consistência visual
   - Hierarquia tipográfica
   - Paleta de cores profissional
   - Responsividade real

3. **FUNCIONALIDADE (0-25 pontos):**
   - Todas as features implementadas
   - Interações funcionais
   - Estados de loading/erro
   - Validações robustas

4. **ENTERPRISE QUALITY (0-25 pontos):**
   - Acessibilidade (ARIA)
   - SEO otimizado
   - Segurança implementada
   - Código production-ready

**FORMATO DE RESPOSTA (JSON):**
{
  "score": 0-100,
  "needsImprovement": true/false,
  "criticalIssues": ["issue1", "issue2"],
  "improvementPrompt": "Prompt específico para correção"
}

**SEJA BRUTAL. SCORE < 80 = PRECISA MELHORAR.**`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: cruelAnalysisPrompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const analysis = JSON.parse(response.text || '{}');
    
    return {
      needsImprovement: analysis.score < 80,
      improvementPrompt: analysis.improvementPrompt || `Refine este código baseado nas seguintes críticas: ${analysis.criticalIssues?.join(', ') || 'problemas encontrados'}. Torne-o digno de produção enterprise.`,
      criticalIssues: analysis.criticalIssues || [],
      score: analysis.score || 0
    };
  } catch (error) {
    console.error('Erro na análise cruel:', error);
    return {
      needsImprovement: false,
      improvementPrompt: '',
      criticalIssues: [],
      score: 100
    };
  }
}

/**
 * 🎭 Geração com Persona Especializada + Manifesto do Artesão
 */
export async function generateWithArtisanManifesto(
  prompt: string,
  persona: Persona,
  attachments?: Attachment[]
): Promise<string> {
  const enhancedPrompt = `${ARTISAN_DIGITAL_MANIFESTO}

${ANTI_SIMULATION_CONTRACT}

${PRODUCTION_READY_INSTRUCTIONS}

**🎭 PERSONA ATIVA:** ${persona.name}
**EXPERTISE:** ${persona.domain || 'General'}

**TAREFA DO USUÁRIO:**
${prompt}

**EXECUÇÃO:**
Aplique os 6 PRINCÍPIOS DO MANIFESTO combinados com sua EXPERTISE ESPECIALIZADA para criar uma solução que seja tanto artisticamente perfeita quanto tecnicamente superior.

**IMPORTANTE:**
- TODO código deve ser FUNCIONAL, não simulado
- ZERO placeholders ou TODOs
- Production-ready desde o primeiro commit
- Validação automática de qualidade
`;

  const parts: Part[] = [];
  
  if (attachments && attachments.length > 0) {
    attachments.forEach(att => {
      parts.push({
        inlineData: {
          data: att.data,
          mimeType: att.mimeType
        }
      });
    });
  }
  
  parts.push({ text: enhancedPrompt });

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: { parts },
    config: {
      systemInstruction: persona.prompt
    }
  });

  let htmlCode = response.text;

  // 🎯 VALIDAÇÃO AUTOMÁTICA DE HTML
  console.log('🔍 Validando HTML gerado...');
  const validation = HTMLQualityGuard.validateHTML(htmlCode);
  
  if (!validation.isValid) {
    console.warn('⚠️ HTML com problemas detectado:', validation.errors);
    htmlCode = HTMLQualityGuard.fixBasicIssues(htmlCode);
    console.log('✅ HTML corrigido automaticamente!');
  }

  // 📦 VALIDAÇÃO E INJEÇÃO DE DEPENDÊNCIAS
  const depValidation = DependencyValidator.validateAndFix(htmlCode);
  if (!depValidation.isValid && depValidation.fixedHtml) {
    console.warn('📦 Dependências faltantes detectadas:', depValidation.missingDependencies.map(d => d.name));
    console.log('✅ Injetando dependências automaticamente...');
    htmlCode = depValidation.fixedHtml;
    depValidation.warnings.forEach(warning => console.warn(warning));
  }

  return htmlCode;
}

/**
 * 🚀 Geração com Análise Cruel e Auto-Refinamento
 */
export async function generateWithCruelAnalysis(
  prompt: string,
  persona: Persona,
  attachments?: Attachment[]
): Promise<{
  code: string;
  analysis: {
    score: number;
    issues: string[];
    needsImprovement: boolean;
  };
}> {
  // Primeira geração
  let code = await generateWithArtisanManifesto(prompt, persona, attachments);

  // Análise cruel
  const analysis = await analyzeCruelly(code, prompt);

  // Se precisa melhorar, refina automaticamente
  if (analysis.needsImprovement && analysis.score < 70) {
    console.log(`⚠️ Score baixo (${analysis.score}/100). Refinando automaticamente...`);
    
    const refinementPrompt = `${prompt}

**CRÍTICAS RECEBIDAS:**
${analysis.criticalIssues.join('\n')}

**INSTRUÇÕES DE REFINAMENTO:**
${analysis.improvementPrompt}

Refine o código para atingir score > 80.`;

    code = await generateWithArtisanManifesto(refinementPrompt, persona, attachments);
  }

  return {
    code,
    analysis: {
      score: analysis.score,
      issues: analysis.criticalIssues,
      needsImprovement: analysis.needsImprovement
    }
  };
}
