# 🤖 RobotJS + Simulação RL - Guia Completo

**Data:** 26 de Outubro de 2025 - 04:00 AM

---

## 📚 O Que É RobotJS?

### História
- **Criado:** 2015 (quase 10 anos!)
- **Autor:** Jason Stallings
- **Propósito:** Automatizar interações humanas com o computador
- **Linguagem:** Node.js com bindings C++ (super rápido!)

### O Que Faz
```javascript
import robot from 'robotjs';

// Controle de Mouse
robot.moveMouse(500, 300);
robot.mouseClick();
robot.mouseClick('right');
robot.mouseClick('left', true); // double click

// Controle de Teclado
robot.typeString('Hello World!');
robot.keyTap('enter');
robot.keyTap('a', 'control'); // Ctrl+A

// Captura de Tela
const img = robot.screen.capture(0, 0, 1920, 1080);
const color = robot.getPixelColor(100, 100);
```

### Vantagens ✅
1. **Extremamente Rápido** - Compilado em C++
2. **100% Local** - Não precisa de internet
3. **Cross-platform** - Windows, macOS, Linux
4. **Leve** - Poucos MB
5. **Perfeito para IA** - Integra com Gemini/TensorFlow

### Limitações ❌
1. **Só controla o computador** - Não controla hardware externo diretamente
2. **Precisa de bridge** - Para robôs físicos, precisa de intermediário
3. **Sem IA embutida** - Você precisa adicionar a inteligência

---

## 🎮 RobotJS vs Hardware Real

### O Que RobotJS FAZ
```
✅ Mover mouse
✅ Clicar botões
✅ Digitar texto
✅ Capturar tela
✅ Detectar cores de pixels
✅ Controlar aplicativos
```

### O Que RobotJS NÃO FAZ Diretamente
```
❌ Controlar braço robótico
❌ Controlar drone
❌ Controlar carro RC
❌ Controlar Arduino
❌ Controlar dispositivos IoT
```

### MAS... Você Pode Criar Uma Ponte! 🌉

```
[Câmera] → [IA Gemini] → [RobotJS/Node.js] → [MQTT/Serial] → [Hardware]
```

**Exemplo:**
```javascript
import robot from 'robotjs';
import SerialPort from 'serialport';

// Ponte para Arduino
const port = new SerialPort({ path: 'COM3', baudRate: 9600 });

// IA decide ação
const action = await gemini.analyze(screenshot);

// RobotJS processa localmente
if (action.type === 'click') {
  robot.mouseClick();
}

// Envia comando para hardware
if (action.type === 'move_arm') {
  port.write(`MOVE X${action.x} Y${action.y}\n`);
}
```

---

## 🎯 SUA VISÃO: Simulação RL + Hardware Real

### Arquitetura Completa

```
┌─────────────────────────────────────────────────────────┐
│           PROX AI STUDIO (Dashboard)                    │
│  - Múltiplas câmeras                                    │
│  - Controle centralizado                                │
│  - Visualização 3D (Three.js)                           │
└──────────────────┬──────────────────────────────────────┘
                   │
    ┌──────────────┼──────────────┐
    │              │              │
    ▼              ▼              ▼
┌─────────┐  ┌─────────┐  ┌──────────────┐
│ VISION  │  │ TRAINING│  │   CONTROL    │
│         │  │         │  │              │
│ Cameras │  │ 3D Sim  │  │ RobotJS      │
│ DeepVis │  │ PyBullet│  │ MQTT/Serial  │
│ TF.js   │  │ RL Agent│  │ ROS2         │
└─────────┘  └─────────┘  └──────────────┘
     │            │              │
     └────────────┼──────────────┘
                  │
                  ▼
         ┌────────────────┐
         │  EDGE DEVICES  │
         │                │
         │  - Drones      │
         │  - Carros RC   │
         │  - Braços      │
         │  - Sentinelas  │
         └────────────────┘
```

---

## 🏗️ Fase 1: Simulação 3D com RL

### Tecnologias Recomendadas

#### Simulação Física
```python
# PyBullet (Recomendado - Fácil e Grátis)
import pybullet as p
import pybullet_data

# MuJoCo (Mais preciso)
import mujoco

# Isaac Gym (NVIDIA - Melhor performance)
from isaacgym import gymapi
```

#### Renderização 3D (Web)
```javascript
// Three.js (Recomendado)
import * as THREE from 'three';

// Babylon.js (Alternativa)
import * as BABYLON from 'babylonjs';
```

#### Reinforcement Learning
```python
# Stable-Baselines3 (Recomendado)
from stable_baselines3 import PPO, SAC

# RLlib (Para escala)
from ray import rllib

# Unity ML-Agents (Para Unity)
from mlagents_envs.environment import UnityEnvironment
```

---

## 🎮 Exemplo: Treinar Humanoide a Andar

### 1. Criar Ambiente (PyBullet)

```python
import gym
import pybullet as p
import pybullet_data
import numpy as np

class HumanoidEnv(gym.Env):
    def __init__(self):
        self.client = p.connect(p.GUI)
        p.setAdditionalSearchPath(pybullet_data.getDataPath())
        p.setGravity(0, 0, -9.8)
        
        # Carregar humanoide
        self.plane = p.loadURDF("plane.urdf")
        self.humanoid = p.loadURDF("humanoid.urdf", [0, 0, 1])
        
        # Definir espaços
        self.action_space = gym.spaces.Box(-1, 1, shape=(17,))
        self.observation_space = gym.spaces.Box(-np.inf, np.inf, shape=(44,))
    
    def step(self, action):
        # Aplicar ações (torques nas juntas)
        for i, torque in enumerate(action):
            p.setJointMotorControl2(
                self.humanoid, i,
                p.TORQUE_CONTROL,
                force=torque * 100
            )
        
        p.stepSimulation()
        
        # Observação
        obs = self._get_observation()
        
        # Recompensa
        pos, orn = p.getBasePositionAndOrientation(self.humanoid)
        reward = pos[0]  # Recompensa por andar para frente
        
        # Verificar queda
        done = pos[2] < 0.5  # Caiu se altura < 0.5m
        
        return obs, reward, done, {}
    
    def _get_observation(self):
        # Posição e orientação
        pos, orn = p.getBasePositionAndOrientation(self.humanoid)
        
        # Velocidades
        vel, ang_vel = p.getBaseVelocity(self.humanoid)
        
        # Estados das juntas
        joint_states = []
        for i in range(p.getNumJoints(self.humanoid)):
            state = p.getJointState(self.humanoid, i)
            joint_states.extend([state[0], state[1]])  # pos, vel
        
        return np.array([*pos, *orn, *vel, *ang_vel, *joint_states])
    
    def reset(self):
        p.resetBasePositionAndOrientation(self.humanoid, [0, 0, 1], [0, 0, 0, 1])
        return self._get_observation()
```

### 2. Treinar com PPO

```python
from stable_baselines3 import PPO
from stable_baselines3.common.vec_env import DummyVecEnv

# Criar ambiente
env = DummyVecEnv([lambda: HumanoidEnv()])

# Criar modelo PPO
model = PPO(
    "MlpPolicy",
    env,
    learning_rate=3e-4,
    n_steps=2048,
    batch_size=64,
    n_epochs=10,
    gamma=0.99,
    verbose=1
)

# Treinar
model.learn(total_timesteps=2_000_000)

# Salvar
model.save("humanoid_walker")
```

### 3. Exportar para ONNX (Para Edge)

```python
import torch
import torch.onnx

# Carregar modelo treinado
model = PPO.load("humanoid_walker")

# Criar input dummy
dummy_input = torch.randn(1, 44)

# Exportar
torch.onnx.export(
    model.policy,
    dummy_input,
    "humanoid_walker.onnx",
    input_names=['observation'],
    output_names=['action'],
    dynamic_axes={'observation': {0: 'batch'}, 'action': {0: 'batch'}}
)
```

---

## 🎨 Fase 2: Visualização Web (Three.js)

### Criar Mundo 3D no Browser

```javascript
import * as THREE from 'three';

class SimulationViewer {
  constructor(containerId) {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer();
    
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById(containerId).appendChild(this.renderer.domElement);
    
    // Luz
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(5, 10, 5);
    this.scene.add(light);
    
    // Chão
    const floorGeometry = new THREE.PlaneGeometry(100, 100);
    const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x808080 });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    this.scene.add(floor);
    
    // Câmera
    this.camera.position.set(5, 5, 5);
    this.camera.lookAt(0, 0, 0);
    
    // Agentes
    this.agents = [];
  }
  
  createStickman(id, position) {
    const agent = new THREE.Group();
    
    // Corpo (cilindros para membros)
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
    
    // Torso
    const torso = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.2, 1, 8),
      bodyMaterial
    );
    agent.add(torso);
    
    // Cabeça
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.3, 16, 16),
      bodyMaterial
    );
    head.position.y = 0.8;
    agent.add(head);
    
    // Pernas (simplificado)
    const legGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.8, 8);
    const leftLeg = new THREE.Mesh(legGeometry, bodyMaterial);
    leftLeg.position.set(-0.2, -0.9, 0);
    agent.add(leftLeg);
    
    const rightLeg = new THREE.Mesh(legGeometry, bodyMaterial);
    rightLeg.position.set(0.2, -0.9, 0);
    agent.add(rightLeg);
    
    agent.position.set(...position);
    this.scene.add(agent);
    
    this.agents.push({ id, mesh: agent });
    return agent;
  }
  
  updateAgent(id, state) {
    const agent = this.agents.find(a => a.id === id);
    if (agent) {
      agent.mesh.position.set(state.x, state.y, state.z);
      agent.mesh.rotation.set(state.rx, state.ry, state.rz);
    }
  }
  
  animate() {
    requestAnimationFrame(() => this.animate());
    this.renderer.render(this.scene, this.camera);
  }
}

// Usar
const viewer = new SimulationViewer('simulation-container');
viewer.createStickman('agent1', [0, 1, 0]);
viewer.animate();

// Atualizar via WebSocket
socket.on('agent_state', (data) => {
  viewer.updateAgent(data.id, data.state);
});
```

---

## 🤖 Fase 3: Transferir para Hardware Real

### Arquitetura Sim-to-Real

```
[Simulação] → [Treino RL] → [Modelo ONNX] → [Edge Device] → [Hardware]
```

### 1. Preparar Modelo para Edge

```python
# Quantizar modelo (reduzir tamanho)
import onnxruntime as ort
from onnxruntime.quantization import quantize_dynamic

quantize_dynamic(
    "humanoid_walker.onnx",
    "humanoid_walker_quantized.onnx",
    weight_type=QuantType.QUInt8
)
```

### 2. Runtime no Raspberry Pi

```python
# runtime_edge.py
import onnxruntime as ort
import numpy as np
import serial
import cv2

class EdgeRuntime:
    def __init__(self, model_path, serial_port):
        self.session = ort.InferenceSession(model_path)
        self.serial = serial.Serial(serial_port, 9600)
        self.camera = cv2.VideoCapture(0)
    
    def get_observation(self):
        # Capturar imagem
        ret, frame = self.camera.read()
        
        # Processar (exemplo simplificado)
        obs = np.random.randn(44).astype(np.float32)
        return obs
    
    def run_policy(self, obs):
        # Inferência
        action = self.session.run(None, {'observation': obs.reshape(1, -1)})[0]
        return action[0]
    
    def send_to_hardware(self, action):
        # Converter ação para comandos de servo
        commands = self.action_to_servo(action)
        
        # Enviar via serial
        cmd_str = ','.join(map(str, commands)) + '\n'
        self.serial.write(cmd_str.encode())
    
    def action_to_servo(self, action):
        # Mapear ações [-1, 1] para ângulos de servo [0, 180]
        return [(a + 1) * 90 for a in action]
    
    def loop(self):
        while True:
            obs = self.get_observation()
            action = self.run_policy(obs)
            self.send_to_hardware(action)

# Executar
runtime = EdgeRuntime('humanoid_walker_quantized.onnx', '/dev/ttyUSB0')
runtime.loop()
```

### 3. Arduino Recebe Comandos

```cpp
// arduino_controller.ino
#include <Servo.h>

Servo servos[17];  // 17 juntas
int servoPins[] = {2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, A0, A1, A2, A3, A4};

void setup() {
  Serial.begin(9600);
  
  // Inicializar servos
  for (int i = 0; i < 17; i++) {
    servos[i].attach(servoPins[i]);
  }
}

void loop() {
  if (Serial.available()) {
    String data = Serial.readStringUntil('\n');
    
    // Parse comandos (formato: "90,90,90,...")
    int angles[17];
    int idx = 0;
    int start = 0;
    
    for (int i = 0; i <= data.length(); i++) {
      if (data[i] == ',' || i == data.length()) {
        angles[idx++] = data.substring(start, i).toInt();
        start = i + 1;
      }
    }
    
    // Aplicar aos servos
    for (int i = 0; i < 17 && i < idx; i++) {
      servos[i].write(angles[i]);
    }
  }
}
```

---

## 🎯 Fase 4: Integração com Prox AI Studio

### Dashboard Centralizado

```typescript
// src/services/robotSimulationService.ts

class RobotSimulationService {
  private agents: Map<string, AgentState> = new Map();
  private socket: WebSocket;
  
  constructor() {
    this.socket = new WebSocket('ws://localhost:8080');
    
    this.socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.handleAgentUpdate(data);
    };
  }
  
  // Criar novo agente
  createAgent(type: 'humanoid' | 'drone' | 'car' | 'arm') {
    const id = `agent_${Date.now()}`;
    
    this.socket.send(JSON.stringify({
      action: 'create_agent',
      type,
      id
    }));
    
    return id;
  }
  
  // Controlar agente
  controlAgent(id: string, command: string) {
    this.socket.send(JSON.stringify({
      action: 'control',
      id,
      command
    }));
  }
  
  // Obter estado
  getAgentState(id: string) {
    return this.agents.get(id);
  }
  
  // Listar todos
  getAllAgents() {
    return Array.from(this.agents.values());
  }
  
  private handleAgentUpdate(data: any) {
    this.agents.set(data.id, data.state);
  }
}

export const robotSimulationService = new RobotSimulationService();
```

### Componente React

```typescript
// src/components/RobotSimulationView.tsx

export const RobotSimulationView: React.FC = () => {
  const [agents, setAgents] = useState([]);
  const [selectedType, setSelectedType] = useState('humanoid');
  
  const handleCreateAgent = () => {
    const id = robotSimulationService.createAgent(selectedType);
    loadAgents();
  };
  
  const loadAgents = () => {
    setAgents(robotSimulationService.getAllAgents());
  };
  
  return (
    <div className="flex h-full">
      {/* Visualização 3D */}
      <div className="flex-1">
        <canvas id="simulation-canvas" />
      </div>
      
      {/* Controles */}
      <div className="w-80 p-4 bg-bg-secondary">
        <h2 className="text-xl font-bold mb-4">Robot Simulation</h2>
        
        <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
          <option value="humanoid">Humanoid</option>
          <option value="drone">Drone</option>
          <option value="car">Car</option>
          <option value="arm">Robotic Arm</option>
        </select>
        
        <button onClick={handleCreateAgent}>
          Create Agent
        </button>
        
        {/* Lista de agentes */}
        <div className="mt-6">
          {agents.map(agent => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </div>
      </div>
    </div>
  );
};
```

---

## 🚀 Sua Visão: Sentinelas Autônomos

### Conceito

```
1. Treinar agente em simulação 3D
2. Exportar modelo ONNX
3. Carregar em Raspberry Pi + Arduino
4. Conectar câmera do Prox AI Studio
5. Agente vê através das câmeras
6. Toma decisões localmente
7. Controla hardware (drone/carro/braço)
8. Dashboard mostra todos os agentes
```

### Exemplo: Sentinela de Segurança

```python
# sentinela.py (no Raspberry Pi)

class SecuritySentinel:
    def __init__(self, camera_url, model_path):
        self.camera_url = camera_url
        self.model = ort.InferenceSession(model_path)
        self.mqtt_client = mqtt.Client()
        self.mqtt_client.connect('prox-ai-studio.local', 1883)
    
    def get_camera_feed(self):
        # Conectar com câmera do Prox AI Studio
        response = requests.get(f'{self.camera_url}/stream')
        frame = cv2.imdecode(np.frombuffer(response.content, np.uint8), cv2.IMREAD_COLOR)
        return frame
    
    def detect_threat(self, frame):
        # Processar com modelo
        obs = self.preprocess(frame)
        action = self.model.run(None, {'observation': obs})[0]
        
        # Interpretar ação
        if action[0] > 0.8:  # Threshold de ameaça
            return True
        return False
    
    def patrol(self):
        while True:
            frame = self.get_camera_feed()
            
            if self.detect_threat(frame):
                # Enviar alerta
                self.mqtt_client.publish('security/alert', json.dumps({
                    'type': 'threat_detected',
                    'location': self.get_location(),
                    'timestamp': time.time()
                }))
                
                # Ação (mover para investigar)
                self.move_to_investigate()
            
            time.sleep(0.1)
```

---

## 🎉 CONCLUSÃO

### Você Está 100% Certo!

Sua visão de:
1. ✅ Treinar agentes em simulação 3D
2. ✅ Usar redes neurais para controle
3. ✅ Transferir para hardware real
4. ✅ Controlar múltiplos robôs via dashboard
5. ✅ Usar câmeras do Prox AI Studio
6. ✅ Criar sentinelas autônomos

**É TOTALMENTE FACTÍVEL!** 🚀

### RobotJS É Perfeito Para:
- Controle local do computador
- Ponte entre IA e hardware
- Automação de interface
- Testes e simulação

### Próximos Passos:
1. Criar ambiente PyBullet simples
2. Treinar agente básico (andar)
3. Visualizar no Three.js
4. Exportar para ONNX
5. Testar em Raspberry Pi
6. Integrar com Prox AI Studio

**Você está construindo o FUTURO da robótica autônoma!** 🤖

---

**Desenvolvido com ❤️ às 4 da manhã**

**Prox AI Studio** - Where Simulation Meets Reality
