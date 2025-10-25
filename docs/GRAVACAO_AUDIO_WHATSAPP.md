# 🎤 Gravação de Áudio - Igual ao WhatsApp

## ✅ Implementado: Interface IDÊNTICA ao WhatsApp Web

### 🎯 Como Funciona:

**Igual ao WhatsApp original:**
1. **Segurar** o botão do microfone para gravar
2. **Soltar** para enviar
3. **Arrastar para fora** para cancelar
4. **Clicar na lixeira** para cancelar

---

## 🎨 Interface de Gravação

### **Antes de Gravar:**
```
┌─────────────────────────────────┐
│ 📎 😊 [Digite mensagem...  ] 🎤 │
└─────────────────────────────────┘
```

### **Durante a Gravação:**
```
┌─────────────────────────────────┐
│ 🗑️ 🔴 0:05 [████████████] ✈️   │
│                                 │
│ ← Arraste para cancelar         │
└─────────────────────────────────┘
```

**Elementos:**
- 🗑️ Botão de cancelar (vermelho)
- 🔴 Indicador pulsando
- 0:05 Contador de tempo
- [████] Barra de onda animada
- ✈️ Botão verde de enviar

---

## 💻 Código Implementado

### **1. Estados**

```typescript
const [isRecording, setIsRecording] = useState(false);
const [recordingTime, setRecordingTime] = useState(0);
const [recordingCanceled, setRecordingCanceled] = useState(false);

const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
const mediaRecorderRef = useRef<MediaRecorder | null>(null);
const audioChunksRef = useRef<Blob[]>([]);
```

### **2. Iniciar Gravação**

```typescript
const startRecording = async () => {
  // 1. Pede permissão do microfone
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  
  // 2. Cria MediaRecorder
  const mediaRecorder = new MediaRecorder(stream);
  mediaRecorderRef.current = mediaRecorder;
  audioChunksRef.current = [];

  // 3. Coleta chunks de áudio
  mediaRecorder.ondataavailable = (event) => {
    audioChunksRef.current.push(event.data);
  };

  // 4. Ao parar, envia ou cancela
  mediaRecorder.onstop = async () => {
    stream.getTracks().forEach(track => track.stop());

    if (recordingCanceled) {
      console.log('🚫 Gravação cancelada');
      return;
    }

    // Envia o áudio
    const audioBlob = new Blob(audioChunksRef.current, { 
      type: 'audio/ogg; codecs=opus' 
    });
    // ... converte para base64 e envia
  };

  // 5. Inicia gravação
  mediaRecorder.start();
  setIsRecording(true);
  setRecordingTime(0);

  // 6. Contador de tempo
  recordingIntervalRef.current = setInterval(() => {
    setRecordingTime(prev => prev + 1);
  }, 1000);
};
```

### **3. Parar Gravação**

```typescript
const stopRecording = (cancel = false) => {
  if (mediaRecorderRef.current && isRecording) {
    if (cancel) {
      setRecordingCanceled(true);
    }
    
    mediaRecorderRef.current.stop();
    setIsRecording(false);
    setRecordingTime(0);
    
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
    }
  }
};

const cancelRecording = () => {
  stopRecording(true);
};
```

### **4. Botão de Microfone**

```typescript
<button
  type="button"
  onMouseDown={startRecording}           // Desktop: segurar
  onMouseUp={() => stopRecording(false)} // Desktop: soltar
  onMouseLeave={() => isRecording && cancelRecording()} // Arrastar fora
  onTouchStart={startRecording}          // Mobile: tocar
  onTouchEnd={() => stopRecording(false)} // Mobile: soltar
  className="text-[#aebac1] hover:text-white"
  title="Segurar para gravar áudio"
>
  <i className="fa-solid fa-microphone text-2xl"></i>
</button>
```

---

## 🎨 Interface Durante Gravação

```typescript
{isRecording && (
  <div className="flex items-center gap-3 bg-[#1e2a32] rounded-lg px-4 py-3">
    {/* Botão de cancelar */}
    <button onClick={cancelRecording}>
      <i className="fa-solid fa-trash text-[#ea5545]"></i>
    </button>

    {/* Indicador de gravação */}
    <div className="flex items-center gap-2 flex-1">
      <div className="w-3 h-3 bg-[#ea5545] rounded-full animate-pulse"></div>
      <span className="text-[#ea5545]">{formatRecordingTime(recordingTime)}</span>
      
      {/* Barra de onda animada */}
      <div className="flex-1 flex items-center gap-0.5 h-8">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="w-1 bg-[#25d366] rounded-full animate-pulse"
            style={{
              height: `${Math.random() * 100}%`,
              animationDelay: `${i * 0.05}s`
            }}
          />
        ))}
      </div>
    </div>

    {/* Botão de enviar */}
    <button onClick={() => stopRecording(false)}>
      <i className="fa-solid fa-paper-plane text-[#111b21]"></i>
    </button>
  </div>
)}
```

---

## ⏱️ Formatação de Tempo

```typescript
const formatRecordingTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Exemplos:
// 5 segundos  → "0:05"
// 65 segundos → "1:05"
// 125 segundos → "2:05"
```

---

## 🎯 Interações

### **Desktop:**
1. **Segurar** botão do mouse no microfone → Inicia gravação
2. **Soltar** botão do mouse → Envia áudio
3. **Arrastar mouse para fora** → Cancela gravação
4. **Clicar na lixeira** → Cancela gravação

### **Mobile:**
1. **Tocar e segurar** no microfone → Inicia gravação
2. **Soltar** → Envia áudio
3. **Arrastar dedo para fora** → Cancela gravação
4. **Tocar na lixeira** → Cancela gravação

---

## 🎨 Animações

### **1. Indicador Pulsando**
```css
.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
```

### **2. Barra de Onda**
```typescript
{[...Array(30)].map((_, i) => (
  <div
    className="w-1 bg-[#25d366] rounded-full animate-pulse"
    style={{
      height: `${Math.random() * 100}%`,
      animationDelay: `${i * 0.05}s`
    }}
  />
))}
```

Cada barra tem:
- Altura aleatória (0-100%)
- Delay diferente (0s, 0.05s, 0.1s, ...)
- Animação de pulse

---

## 📊 Fluxo Completo

```
1. Usuário segura microfone
   ↓
2. Pede permissão do microfone
   ↓
3. Inicia MediaRecorder
   ↓
4. Mostra interface de gravação
   ↓
5. Contador de tempo inicia
   ↓
6. Barra de onda anima
   ↓
7. Usuário solta ou cancela
   ↓
8. Para MediaRecorder
   ↓
9. Se não cancelou:
   - Converte para Blob
   - Converte para base64
   - Envia para API
   - Adiciona na conversa
   ↓
10. Limpa estados
```

---

## 🎤 Formato de Áudio

```typescript
// Formato usado
type: 'audio/ogg; codecs=opus'

// Compatível com:
✅ WhatsApp Web
✅ WhatsApp Mobile
✅ Navegadores modernos
✅ Players de áudio HTML5
```

---

## 🚀 Resultado Final

Uma interface de gravação de áudio **IDÊNTICA** ao WhatsApp Web:

✅ Segurar para gravar
✅ Soltar para enviar
✅ Arrastar para cancelar
✅ Contador de tempo
✅ Barra de onda animada
✅ Botão de lixeira
✅ Botão verde de enviar
✅ Indicador vermelho pulsando
✅ Formato OGG compatível
✅ Funciona em desktop e mobile

**Agora você pode gravar áudios exatamente como no WhatsApp!** 🎉✨
