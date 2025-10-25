---
inclusion: always
---

# Regra de Organização de Documentação

**IMPORTANTE**: Todos os arquivos markdown (.md) de documentação devem ser criados na pasta `docs/` na raiz do projeto.

## Diretrizes:

1. **Sempre criar arquivos .md em `docs/`**: Quando criar qualquer arquivo de documentação, guia, resumo, changelog, ou qualquer outro arquivo markdown, coloque-o em `docs/`

2. **Nunca criar .md na raiz**: A raiz do projeto deve conter apenas:
   - README.md (arquivo principal do projeto)
   - Arquivos de configuração (.env, package.json, tsconfig.json, etc.)
   - Código fonte (pasta src/)
   - Outros arquivos essenciais do projeto

3. **Tipos de documentos que vão em `docs/`**:
   - Guias (GUIA_*.md)
   - Resumos (RESUMO_*.md)
   - Exemplos (EXEMPLO_*.md, EXEMPLOS_*.md)
   - Changelogs (CHANGELOG.md)
   - Notas (NOTA_*.md)
   - Status e checklists (STATUS_*.md, CHECKLIST_*.md)
   - Correções documentadas (CORRECAO_*.md)
   - Integrações (INTEGRACAO_*.md)
   - Qualquer outro arquivo de documentação

4. **Ao criar novos arquivos**: Sempre use o caminho `docs/NOME_DO_ARQUIVO.md`

Esta organização mantém o projeto limpo e a documentação centralizada.
