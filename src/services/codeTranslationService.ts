/**
 * 🔄 CODE TRANSLATION SERVICE
 * 
 * Traduz código entre diferentes linguagens de programação
 * mantendo funcionalidade e boas práticas.
 */

import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.API_KEY;
const ai = new GoogleGenAI({ apiKey: API_KEY });

// Mapeamento de linguagens suportadas
export const SUPPORTED_LANGUAGES = {
  typescript: { name: 'TypeScript', extensions: ['.ts', '.tsx'] },
  javascript: { name: 'JavaScript', extensions: ['.js', '.jsx'] },
  python: { name: 'Python', extensions: ['.py'] },
  java: { name: 'Java', extensions: ['.java'] },
  csharp: { name: 'C#', extensions: ['.cs'] },
  go: { name: 'Go', extensions: ['.go'] },
  rust: { name: 'Rust', extensions: ['.rs'] },
  cpp: { name: 'C++', extensions: ['.cpp', '.hpp'] },
  php: { name: 'PHP', extensions: ['.php'] },
  ruby: { name: 'Ruby', extensions: ['.rb'] },
  swift: { name: 'Swift', extensions: ['.swift'] },
  kotlin: { name: 'Kotlin', extensions: ['.kt'] },
};

const translationSystemInstruction = `You are an expert code translator specialized in converting code between programming languages while maintaining:

**CORE PRINCIPLES:**
1. **Functional Equivalence**: The translated code must do EXACTLY the same thing
2. **Idiomatic Code**: Use language-specific best practices and idioms
3. **Performance**: Optimize for the target language's strengths
4. **Type Safety**: Preserve or enhance type safety when possible
5. **Error Handling**: Adapt error handling to target language conventions
6. **Dependencies**: Suggest equivalent libraries and packages

**TRANSLATION RULES:**

**TypeScript/JavaScript ↔ Python:**
- async/await → asyncio
- Promise → Future/coroutine
- Array methods → list comprehensions
- Classes → dataclasses or regular classes
- npm packages → pip packages

**Python ↔ Java:**
- List comprehensions → Stream API
- Decorators → Annotations
- Duck typing → Interfaces
- pip packages → Maven/Gradle dependencies

**JavaScript ↔ Go:**
- Promises → Goroutines + Channels
- Classes → Structs + Methods
- npm packages → Go modules

**Any → Rust:**
- Focus on memory safety
- Use Result<T, E> for error handling
- Leverage ownership system
- Use Cargo for dependencies

**RESPONSE FORMAT:**
Provide a JSON response with:
{
  "translatedCode": "...",
  "explanation": "Key differences and adaptations made",
  "dependencies": ["list", "of", "required", "packages"],
  "notes": ["Important considerations for the developer"],
  "equivalentLibraries": {
    "originalLib": "targetLib"
  }
}`;

export interface TranslationResult {
  translatedCode: string;
  explanation: string;
  dependencies: string[];
  notes: string[];
  equivalentLibraries: Record<string, string>;
}

/**
 * Traduz código de uma linguagem para outra
 */
export async function translateCode(
  sourceCode: string,
  fromLanguage: string,
  toLanguage: string,
  context?: string
): Promise<TranslationResult> {
  const prompt = `Translate the following ${fromLanguage} code to ${toLanguage}:

${context ? `**Context:** ${context}\n\n` : ''}

**Source Code (${fromLanguage}):**
\`\`\`${fromLanguage}
${sourceCode}
\`\`\`

**Requirements:**
1. Maintain exact functionality
2. Use ${toLanguage} best practices and idioms
3. Optimize for ${toLanguage} performance characteristics
4. Provide clear explanation of key changes
5. List all required dependencies
6. Note any important considerations

Provide the translation in JSON format.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: translationSystemInstruction,
        responseMimeType: "application/json",
        temperature: 0.3, // Lower temperature for more consistent translations
      }
    });

    const result = JSON.parse(response.text || '{}');
    
    return {
      translatedCode: result.translatedCode || '',
      explanation: result.explanation || '',
      dependencies: result.dependencies || [],
      notes: result.notes || [],
      equivalentLibraries: result.equivalentLibraries || {}
    };
  } catch (error) {
    console.error('Error translating code:', error);
    throw new Error(`Failed to translate code: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Detecta a linguagem de um código automaticamente
 */
export function detectLanguage(code: string): string {
  // Padrões de detecção
  const patterns = {
    typescript: /interface\s+\w+|type\s+\w+\s*=|:\s*(string|number|boolean)/,
    javascript: /const\s+\w+\s*=|let\s+\w+\s*=|function\s+\w+/,
    python: /def\s+\w+|import\s+\w+|class\s+\w+.*:/,
    java: /public\s+class|private\s+\w+|import\s+java\./,
    csharp: /using\s+System|namespace\s+\w+|public\s+class/,
    go: /package\s+\w+|func\s+\w+|import\s+\(/,
    rust: /fn\s+\w+|use\s+std::|impl\s+\w+/,
    cpp: /#include\s+<|std::|namespace\s+\w+/,
    php: /<\?php|namespace\s+\w+|use\s+\w+/,
    ruby: /def\s+\w+|class\s+\w+|require\s+/,
    swift: /func\s+\w+|var\s+\w+:\s*\w+|import\s+Foundation/,
    kotlin: /fun\s+\w+|val\s+\w+|import\s+kotlin/,
  };

  for (const [lang, pattern] of Object.entries(patterns)) {
    if (pattern.test(code)) {
      return lang;
    }
  }

  return 'unknown';
}

/**
 * Traduz múltiplos arquivos de código
 */
export async function translateProject(
  files: Array<{ path: string; content: string }>,
  fromLanguage: string,
  toLanguage: string
): Promise<Array<{ path: string; content: string; explanation: string }>> {
  const results = [];

  for (const file of files) {
    try {
      const translation = await translateCode(
        file.content,
        fromLanguage,
        toLanguage,
        `File: ${file.path}`
      );

      // Adaptar extensão do arquivo
      const newPath = file.path.replace(
        new RegExp(`\\.(${SUPPORTED_LANGUAGES[fromLanguage as keyof typeof SUPPORTED_LANGUAGES]?.extensions.join('|').replace(/\./g, '')})$`),
        SUPPORTED_LANGUAGES[toLanguage as keyof typeof SUPPORTED_LANGUAGES]?.extensions[0] || '.txt'
      );

      results.push({
        path: newPath,
        content: translation.translatedCode,
        explanation: translation.explanation
      });
    } catch (error) {
      console.error(`Error translating ${file.path}:`, error);
      results.push({
        path: file.path,
        content: file.content,
        explanation: `Translation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  }

  return results;
}

/**
 * Sugere melhorias ao traduzir código
 */
export async function translateWithImprovements(
  sourceCode: string,
  fromLanguage: string,
  toLanguage: string
): Promise<TranslationResult & { improvements: string[] }> {
  const baseTranslation = await translateCode(sourceCode, fromLanguage, toLanguage);

  const improvementPrompt = `Analyze this ${toLanguage} code and suggest improvements:

\`\`\`${toLanguage}
${baseTranslation.translatedCode}
\`\`\`

Suggest improvements for:
1. Performance optimization
2. Code readability
3. Error handling
4. Type safety
5. Best practices

Return JSON: { "improvements": ["improvement 1", "improvement 2", ...] }`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: improvementPrompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.5
      }
    });

    const result = JSON.parse(response.text || '{"improvements":[]}');

    return {
      ...baseTranslation,
      improvements: result.improvements || []
    };
  } catch (error) {
    console.error('Error getting improvements:', error);
    return {
      ...baseTranslation,
      improvements: []
    };
  }
}

export default {
  translateCode,
  detectLanguage,
  translateProject,
  translateWithImprovements,
  SUPPORTED_LANGUAGES
};
