/**
 * 🧪 TEST DATA GENERATOR SERVICE
 * 
 * Gera dados de teste automaticamente baseado em código,
 * schemas, ou especificações.
 */

import { GoogleGenAI, Type } from "@google/genai";

const API_KEY = process.env.API_KEY;
const ai = new GoogleGenAI({ apiKey: API_KEY });

const testDataSchema = {
  type: Type.OBJECT,
  properties: {
    testCases: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          description: { type: Type.STRING },
          input: { type: Type.OBJECT },
          expectedOutput: { type: Type.OBJECT },
          category: { type: Type.STRING }
        }
      }
    },
    mockData: {
      type: Type.ARRAY,
      items: { type: Type.OBJECT }
    },
    fixtures: {
      type: Type.OBJECT
    }
  }
};

const testDataSystemInstruction = `You are an expert test data generator. Your goal is to create realistic, comprehensive test data for software testing.

**PRINCIPLES:**
1. **Realistic Data**: Generate data that mimics real-world scenarios
2. **Edge Cases**: Include boundary conditions and edge cases
3. **Variety**: Cover different scenarios (happy path, error cases, edge cases)
4. **Consistency**: Maintain data consistency across related fields
5. **Privacy**: Never use real PII - generate fake but realistic data

**DATA TYPES TO GENERATE:**

**User Data:**
- Names: Realistic but fake (use faker-style generation)
- Emails: Valid format, fake domains
- Phones: Valid format, fake numbers
- Addresses: Realistic but fake

**Business Data:**
- Products: Realistic names, prices, descriptions
- Orders: Valid order structures
- Transactions: Realistic amounts, dates

**Technical Data:**
- API Responses: Valid JSON structures
- Database Records: Proper schema compliance
- File Uploads: Simulated file data

**TEST CATEGORIES:**
1. **Happy Path**: Normal, expected scenarios
2. **Edge Cases**: Boundary conditions, limits
3. **Error Cases**: Invalid inputs, failures
4. **Performance**: Large datasets, stress tests
5. **Security**: Injection attempts, XSS, etc.

**RESPONSE FORMAT:**
Always return structured JSON with:
- testCases: Array of test scenarios
- mockData: Sample data for mocking
- fixtures: Reusable test fixtures`;

export interface TestCase {
  name: string;
  description: string;
  input: any;
  expectedOutput: any;
  category: 'happy-path' | 'edge-case' | 'error-case' | 'performance' | 'security';
}

export interface TestDataResult {
  testCases: TestCase[];
  mockData: any[];
  fixtures: Record<string, any>;
}

/**
 * Gera dados de teste baseado em código
 */
export async function generateTestDataFromCode(
  code: string,
  language: string,
  testType: 'unit' | 'integration' | 'e2e' = 'unit'
): Promise<TestDataResult> {
  const prompt = `Generate comprehensive test data for this ${language} code:

\`\`\`${language}
${code}
\`\`\`

**Test Type:** ${testType}

Generate:
1. Test cases covering all scenarios (happy path, edge cases, errors)
2. Mock data for dependencies
3. Reusable fixtures

Focus on:
- Realistic data
- Edge cases and boundary conditions
- Error scenarios
- Performance test data (if applicable)`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: testDataSystemInstruction,
        responseMimeType: "application/json",
        responseSchema: testDataSchema,
        temperature: 0.7
      }
    });

    const result = JSON.parse(response.text || '{}');
    
    return {
      testCases: result.testCases || [],
      mockData: result.mockData || [],
      fixtures: result.fixtures || {}
    };
  } catch (error) {
    console.error('Error generating test data:', error);
    throw new Error(`Failed to generate test data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Gera dados de teste baseado em schema (TypeScript interface, JSON Schema, etc.)
 */
export async function generateTestDataFromSchema(
  schema: string,
  schemaType: 'typescript' | 'json-schema' | 'graphql' | 'openapi',
  count: number = 10
): Promise<any[]> {
  const prompt = `Generate ${count} realistic test data samples based on this ${schemaType} schema:

${schema}

Requirements:
1. Generate ${count} diverse samples
2. Use realistic values (names, emails, dates, etc.)
3. Include edge cases (min/max values, empty strings, etc.)
4. Maintain data consistency
5. Follow schema constraints

Return array of objects matching the schema.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: testDataSystemInstruction,
        responseMimeType: "application/json",
        temperature: 0.8 // Higher temperature for more variety
      }
    });

    const result = JSON.parse(response.text || '[]');
    return Array.isArray(result) ? result : [];
  } catch (error) {
    console.error('Error generating test data from schema:', error);
    throw new Error(`Failed to generate test data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Gera dados de teste para API endpoints
 */
export async function generateAPITestData(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
  requestSchema?: string,
  responseSchema?: string
): Promise<{
  requests: any[];
  responses: any[];
  errorCases: any[];
}> {
  const prompt = `Generate test data for API endpoint:

**Endpoint:** ${endpoint}
**Method:** ${method}

${requestSchema ? `**Request Schema:**\n${requestSchema}\n` : ''}
${responseSchema ? `**Response Schema:**\n${responseSchema}\n` : ''}

Generate:
1. Valid request payloads (5 examples)
2. Expected response payloads (5 examples)
3. Error cases (invalid requests, edge cases)

Return JSON: { "requests": [...], "responses": [...], "errorCases": [...] }`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: testDataSystemInstruction,
        responseMimeType: "application/json",
        temperature: 0.7
      }
    });

    const result = JSON.parse(response.text || '{}');
    
    return {
      requests: result.requests || [],
      responses: result.responses || [],
      errorCases: result.errorCases || []
    };
  } catch (error) {
    console.error('Error generating API test data:', error);
    throw new Error(`Failed to generate API test data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Gera dados de teste para banco de dados
 */
export async function generateDatabaseTestData(
  tableSchema: string,
  count: number = 100,
  includeRelations: boolean = true
): Promise<{
  records: any[];
  seedScript: string;
}> {
  const prompt = `Generate ${count} realistic database records for this schema:

${tableSchema}

Requirements:
1. Generate ${count} diverse records
2. ${includeRelations ? 'Include related records for foreign keys' : 'Standalone records only'}
3. Use realistic data
4. Maintain referential integrity
5. Include edge cases

Also generate a seed script (SQL or ORM) to insert the data.

Return JSON: { "records": [...], "seedScript": "..." }`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: testDataSystemInstruction,
        responseMimeType: "application/json",
        temperature: 0.7
      }
    });

    const result = JSON.parse(response.text || '{}');
    
    return {
      records: result.records || [],
      seedScript: result.seedScript || ''
    };
  } catch (error) {
    console.error('Error generating database test data:', error);
    throw new Error(`Failed to generate database test data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Gera dados de teste para performance/load testing
 */
export async function generateLoadTestData(
  scenario: string,
  userCount: number = 100,
  duration: number = 60
): Promise<{
  users: any[];
  scenarios: any[];
  metrics: any;
}> {
  const prompt = `Generate load test data for this scenario:

**Scenario:** ${scenario}
**Users:** ${userCount}
**Duration:** ${duration} seconds

Generate:
1. User profiles (${userCount} users)
2. Test scenarios (user journeys)
3. Expected metrics and thresholds

Return JSON: { "users": [...], "scenarios": [...], "metrics": {...} }`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: testDataSystemInstruction,
        responseMimeType: "application/json",
        temperature: 0.6
      }
    });

    const result = JSON.parse(response.text || '{}');
    
    return {
      users: result.users || [],
      scenarios: result.scenarios || [],
      metrics: result.metrics || {}
    };
  } catch (error) {
    console.error('Error generating load test data:', error);
    throw new Error(`Failed to generate load test data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Gera fixtures para testes
 */
export async function generateTestFixtures(
  description: string,
  fixtureType: 'json' | 'csv' | 'xml' | 'yaml'
): Promise<string> {
  const prompt = `Generate test fixture data:

**Description:** ${description}
**Format:** ${fixtureType}

Generate realistic, comprehensive fixture data in ${fixtureType} format.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: testDataSystemInstruction,
        temperature: 0.7
      }
    });

    return response.text || '';
  } catch (error) {
    console.error('Error generating fixtures:', error);
    throw new Error(`Failed to generate fixtures: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export default {
  generateTestDataFromCode,
  generateTestDataFromSchema,
  generateAPITestData,
  generateDatabaseTestData,
  generateLoadTestData,
  generateTestFixtures
};
