# ⚠️ Nota Importante sobre o Modelo Gratuito

## Modelo Correto

O modelo gratuito de geração de imagens é:

**`gemini-2.0-flash-exp`** (Flash 2.0 Experimental)

## ❌ Modelo Incorreto

~~`gemini-2.0-flash-exp-image`~~ - Este modelo **NÃO EXISTE**

## Por que a mudança?

O modelo `gemini-2.0-flash-exp` é um modelo experimental que suporta **múltiplas modalidades**, incluindo:
- Texto (TEXT)
- Imagens (IMAGE)

Para gerar imagens com este modelo, é necessário especificar **ambas as modalidades** na configuração:

```typescript
config: { 
  responseModalities: [Modality.TEXT, Modality.IMAGE] 
}
```

## Como Funciona Agora

### No Código

```typescript
// src/services/geminiService.ts
const config = modelId === 'gemini-2.0-flash-exp' 
  ? { responseModalities: [Modality.TEXT, Modality.IMAGE] }
  : { responseModalities: [Modality.IMAGE] };
```

### Na Interface

1. Selecione **"Flash 2.0 Experimental (GRÁTIS)"** no dropdown
2. Digite seu prompt
3. O sistema automaticamente configura as modalidades corretas
4. Imagem é gerada!

## Diferenças entre Modelos

| Modelo | Modalidades | Configuração |
|--------|-------------|--------------|
| `gemini-2.0-flash-exp` | TEXT + IMAGE | Ambas necessárias |
| `gemini-2.5-flash-image` | IMAGE | Apenas IMAGE |
| `imagen-4.0-generate-001` | IMAGE | Apenas IMAGE |

## Vantagens do Flash 2.0 Experimental

✅ **Totalmente gratuito**
✅ Suporta geração de imagens
✅ Suporta edição de imagens
✅ Pode retornar texto + imagem
✅ Modelo experimental com features novas

## Limitações

⚠️ Por ser experimental:
- Pode ter mudanças sem aviso
- Pode ser descontinuado no futuro
- Qualidade pode variar

## Recomendação

**Para uso em produção:**
- Use `imagen-4.0-generate-001` (pago, mas estável)

**Para testes e desenvolvimento:**
- Use `gemini-2.0-flash-exp` (grátis e funcional)

**Para edição de imagens:**
- Use `gemini-2.0-flash-exp` ou `gemini-2.5-flash-image`

---

**Status:** ✅ Corrigido e funcionando
**Data:** Agora
**Versão:** 1.0.0
