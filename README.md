# ⚡ SmartPLC — Digital Twin & Integração IT/OT

![Indústria 4.0](https://img.shields.io/badge/Ind%C3%BAstria-4.0-00f5a0?style=for-the-badge)
![Node-RED](https://img.shields.io/badge/Node--RED-Red?style=for-the-badge&logo=nodered&logoColor=white)
![Bootstrap](https://img.shields.io/badge/Bootstrap-5.3-7952B3?style=for-the-badge&logo=bootstrap&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)

> **Case de Estudo & Demonstração Técnica:** Uma plataforma integradora que conecta automação industrial (OT), sistemas de comunicação/gateways e desenvolvimento web (IT) para monitoramento em tempo real através de um **Digital Twin (Gêmeo Digital)**.

---

## 📌 Sobre o Projeto

O **SmartPLC** foi desenvolvido para demonstrar a aplicação prática da **convergência entre OT (Operational Technology) e IT (Information Technology)**. Mais do que uma interface visual, o projeto abrange o fluxo completo de dados: desde o nível de controle e simulação do processo industrial até a camada de aplicação Web, onde métricas são consolidadas em dashboards dinâmicos.

---

## 🏗️ Arquitetura do Sistema

┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│  TA / OT        │ ────> │  GW (Gateway)   │ ────> │  DATA           │ ────> │  IT (Web)       │
│  Automação &    │       │  Node-RED       │       │  Chart.js /     │       │  Dashboard Web  │
│  Simulação PLC  │       │  Comunicação    │       │  Tratamento     │       │  & Digital Twin │
└─────────────────┘       └─────────────────┘       └─────────────────┘       └─────────────────┘


* **TA (Automação):** Dispositivos, sensores e atuações de campo.
* **OT (Controle):** Lógica de controle e simulação do processo industrial.
* **GW (Node-RED):** Gateway responsável por intermediar os dados entre os protocolos industriais e os serviços Web.
* **IT (Web):** Aplicação frontend desenvolvida para consumo e exibição dos dados.
* **DATA (Chart.js):** Renderização de gráficos dinâmicos e métricas de desempenho em tempo real.
* **DT (Digital Twin):** Representação virtual interativa do estado dos ativos do processo.

---

## 🎯 Competências Demonstradas

1. **Integração entre OT e IT:** Conexão entre redes industriais e aplicações web.
2. **Lógica de Programação e Web Development:** Frontend moderno e responsivo.
3. **Automação Industrial e Simulação:** Modelagem de sinais e comportamentos de CLP/PLC.
4. **Visualização e Atualização de Dados:** Dashboards dinâmicos em tempo real.
5. **Comunicação entre Sistemas:** Arquitetura de fluxo de dados robusta e escalável.
6. **Pensamento Sistêmico:** Visão ponta a ponta, do chão de fábrica até a tomada de decisão.
7. **Conceitos de Indústria 4.0:** Digital Twin, IIoT e análise contínua de dados.

---

## 🛠️ Tecnologias Utilizadas

### Frontend & Dashboard (IT)
* **HTML5 & CSS3**
* **Bootstrap 5**
* **JavaScript (ES6+)**
* **Chart.js**

### Comunicação & Gateway (GW / OT)
* **Node-RED**
* **JSON / WebSockets / REST APIs**

---

## 🚀 Como Executar o Projeto

1. **Clonar o repositório:**
   ```bash
   git clone [https://github.com/YagoDinato/SmartPLC-Portifolio.git](https://github.com/YagoDinato/SmartPLC-Portifolio.git)
Navegar até a pasta do projeto:

Bash
cd SmartPLC-Portifolio
Abrir a interface:

Abra o arquivo index.html no seu navegador ou utilize a extensão Live Server no VS Code.

👥 Equipe de Desenvolvimento
Membro	Função	GitHub / Portfólio
Yago Dinato	Desenvolvedor / Automação & IT	@YagoDinato
Pedro M.	Desenvolvedor / Automação & IT	Portfólio
Juan	Desenvolvedor / Automação & IT	Portfólio
Ewerton	Desenvolvedor / Automação & IT	Portfólio
📄 Licença
Este projeto é um case de estudo e portfólio acadêmico/profissional. Todos os direitos reservados à equipe de desenvolvedores.