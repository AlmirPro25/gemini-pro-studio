# 🖼️ Guia da Galeria de Imagens

## O que é?

A Galeria de Imagens é um espaço centralizado onde você pode visualizar, organizar e gerenciar **todas as imagens** que passaram pelo seu Gemini Pro Studio - tanto as geradas pela IA quanto as que você enviou.

## 🎯 Como Acessar

1. Clique em **"Galeria de Imagens"** na sidebar (ícone 🖼️)
2. Ou use o atalho `Ctrl+G` (em breve)

## 📋 Funcionalidades

### 1. Visualização em Grid

- **Grid responsivo** que se adapta ao tamanho da tela
- **2-5 colunas** dependendo da resolução
- **Hover effects** para ver ações rápidas
- **Badges** indicando se é IA ou Upload

### 2. Filtros Poderosos

#### Por Tipo
- **Todas**: Mostra todas as imagens
- **Geradas pela IA**: Apenas imagens criadas pelos modelos
- **Enviadas por mim**: Apenas imagens que você fez upload

#### Por Data
- **Mais Recentes**: Ordem cronológica inversa (padrão)
- **Mais Antigas**: Ordem cronológica
- **Por Tipo**: Agrupa por origem (IA/Upload)

#### Por Busca
- Digite qualquer palavra do **prompt**
- Busca em tempo real
- Case-insensitive

**Exemplo:**
```
Busca: "gato"
Encontra: "Um gato astronauta...", "Gato persa branco..."
```

### 3. Seleção Múltipla

#### Como Selecionar
- Clique no **checkbox** no canto superior esquerdo de cada imagem
- Selecione quantas quiser
- Contador aparece no header

#### Ações em Lote
- **Baixar Selecionadas**: Download de todas as selecionadas
- **Limpar Seleção**: Desmarca todas

### 4. Visualização em Tela Cheia

#### Abrir Visualizador
- Clique em qualquer imagem
- Modal de tela cheia abre

#### Controles do Visualizador
- **Zoom**: 50% - 200%
  - Botões +/- ou scroll do mouse
  - Resetar com clique no percentual
- **Info**: Mostrar/ocultar informações
- **Download**: Baixar imagem
- **Usar como Referência**: Adiciona ao próximo prompt
- **Editar**: Abre editor de imagem

#### Atalhos de Teclado
- `ESC` - Fechar visualizador
- `+` - Aumentar zoom
- `-` - Diminuir zoom
- `0` - Resetar zoom
- `I` - Toggle info panel

### 5. Ações Rápidas

#### No Grid (Hover)
Passe o mouse sobre uma imagem para ver:
- **Download** 📥 - Baixar imagem
- **Usar como Referência** ✨ - Adicionar ao chat

#### No Visualizador
- **Download** - Salvar no computador
- **Usar como Referência** - Volta ao chat com a imagem
- **Editar** - Abre editor com a imagem carregada

## 🎨 Casos de Uso

### 1. Encontrar Imagem Antiga
```
1. Abra a galeria
2. Use a busca: "logo empresa"
3. Filtre por "Geradas pela IA"
4. Ordene por "Mais Antigas"
5. Encontre a imagem
```

### 2. Download em Lote
```
1. Filtre por "Geradas pela IA"
2. Selecione todas as que quer
3. Clique em "Baixar Selecionadas"
4. Todas são baixadas automaticamente
```

### 3. Criar Variação
```
1. Encontre a imagem base
2. Clique nela (abre visualizador)
3. Clique em "Editar"
4. Sistema volta ao chat com a imagem
5. Digite o que quer mudar
6. Nova variação é gerada!
```

### 4. Usar como Referência
```
1. Encontre a imagem de referência
2. Clique em "Usar como Referência"
3. Volta ao chat
4. Imagem é adicionada automaticamente
5. Digite seu novo prompt
```

### 5. Comparar Gerações
```
1. Busque por um prompt específico
2. Veja todas as variações geradas
3. Compare lado a lado
4. Escolha a melhor
```

## 📊 Informações Exibidas

### No Grid
- **Preview** da imagem
- **Badge** de tipo (IA/Upload)
- **Prompt** (no hover)
- **Ações rápidas** (no hover)

### No Visualizador
- **Imagem em alta resolução**
- **Prompt completo**
- **Tipo de arquivo** (JPEG, PNG, etc.)
- **Nome do arquivo**
- **Zoom atual**

## 🔧 Compressão Automática

### O que é?

Todas as imagens são **automaticamente comprimidas** antes de serem salvas, economizando espaço e melhorando performance.

### Como Funciona?

1. **Detecção**: Sistema detecta imagens > 2MB
2. **Redimensionamento**: Máximo 1920x1920 (mantém aspect ratio)
3. **Compressão**: Qualidade 85% (ótimo balanço)
4. **Economia**: Até 80% de redução de tamanho

### Logs no Console

```javascript
Compressed camera_123.jpg: 8.5 MB → 1.2 MB
Compressed screenshot_456.png: 12.3 MB → 2.1 MB
```

### Configuração

Você pode ajustar em `src/utils/imageCompression.ts`:
```typescript
{
  maxWidth: 1920,      // Largura máxima
  maxHeight: 1920,     // Altura máxima
  quality: 0.85,       // Qualidade (0-1)
  maxSizeMB: 5,        // Tamanho máximo alvo
}
```

## 💡 Dicas e Truques

### 1. Organize por Projeto
Use a busca para filtrar imagens de um projeto específico:
```
Busca: "projeto X"
```

### 2. Encontre Estilos
Busque por estilos artísticos:
```
Busca: "cartoon"
Busca: "fotorrealista"
Busca: "aquarela"
```

### 3. Download Organizado
1. Filtre por tipo
2. Ordene por data
3. Baixe em lote
4. Organize em pastas no PC

### 4. Reutilize Prompts
1. Encontre uma imagem que gostou
2. Veja o prompt no visualizador
3. Copie e modifique
4. Gere nova variação

### 5. Comparação Visual
1. Abra galeria
2. Busque por tema
3. Compare visualmente
4. Escolha a melhor

## 🚨 Limitações

### Armazenamento
- **localStorage**: ~5-10MB total
- **Compressão automática** ajuda
- Imagens antigas podem ser removidas automaticamente

### Performance
- **Muitas imagens** (>100) podem deixar lento
- Use filtros para reduzir
- Considere limpar histórico antigo

### Navegadores
- **Chrome/Edge**: Funciona perfeitamente
- **Firefox**: Funciona perfeitamente
- **Safari**: Pode ter limitações de storage

## 🎯 Atalhos Rápidos

| Ação | Como Fazer |
|------|------------|
| Abrir galeria | Sidebar → Galeria de Imagens |
| Buscar | Digite na caixa de busca |
| Filtrar | Use os dropdowns |
| Selecionar | Clique no checkbox |
| Visualizar | Clique na imagem |
| Download | Botão de download |
| Editar | Visualizador → Editar |
| Usar como ref | Botão de varinha mágica ✨ |

## 📈 Estatísticas

A galeria mostra:
- **Total de imagens** encontradas
- **Imagens selecionadas** (quando aplicável)
- **Filtros ativos** (visual)

## 🔮 Próximas Funcionalidades

- [ ] Tags personalizadas
- [ ] Favoritos
- [ ] Coleções
- [ ] Exportar galeria completa
- [ ] Importar de outras fontes
- [ ] Edição básica (crop, rotate)
- [ ] Comparação lado a lado
- [ ] Slideshow
- [ ] Compartilhamento

---

## 🎉 Conclusão

A Galeria de Imagens transforma o Gemini Pro Studio em um **gerenciador completo de imagens geradas por IA**, permitindo que você:

✅ Nunca perca uma imagem gerada
✅ Encontre rapidamente o que precisa
✅ Reutilize e itere sobre criações anteriores
✅ Organize seu trabalho visual
✅ Economize espaço com compressão automática

**Explore e aproveite!** 🚀
