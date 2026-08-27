# Design de Interface — Forja

## Direção de produto

O Forja será um aplicativo de treino em **orientação retrato 9:16**, pensado para uso com uma mão durante a atividade física. A linguagem visual será escura, precisa e energética: superfícies grafite, tipografia branca de alto contraste e verde-lima reservado para ações e dados ativos. A navegação principal usa uma barra inferior fixa, com cinco destinos, evitando menus laterais e mantendo as ações essenciais ao alcance do polegar.

## Telas

| Tela | Conteúdo principal | Ações e comportamento |
|---|---|---|
| **Treinos** | Saudação, resumo semanal, treino sugerido, atalhos para iniciar cardio e consultar o histórico. | Iniciar um treino, abrir o cardio e navegar para detalhes. |
| **Cardio** | Mapa nativo, marcador da posição atual, trajetória percorrida e painel de distância, duração, ritmo e passos. | Solicitar permissão de localização, iniciar, pausar, retomar e finalizar/salvar uma sessão. |
| **Histórico** | Lista cronológica de sessões com distância, duração, ritmo, data e mini-resumo da rota. | Consultar as métricas de cada sessão e excluir registros locais. |
| **IA Coach** | Orientação de treino contextual, recomendações de recuperação e pontos de progresso. | Exibir uma experiência local inicial e deixar a arquitetura preparada para conectar um serviço de IA posteriormente. |
| **Configurações** | Preferências para unidades, estimativa de passos e privacidade de localização. | Alterar parâmetros locais e rever permissões necessárias. |

## Fluxos prioritários

| Fluxo | Etapas |
|---|---|
| **Iniciar cardio** | Usuário abre **Cardio** → concede localização quando solicitada → toca em **Iniciar treino** → a tela acompanha posição, rota e métricas em tempo real. |
| **Pausar e retomar** | Durante a atividade, o usuário toca em **Pausar** → a rota e os contadores deixam de acumular → toca em **Retomar** → o acompanhamento continua no mesmo trajeto. |
| **Salvar sessão** | Usuário toca em **Finalizar e salvar** → o aplicativo gera o registro local com rota, data e métricas → apresenta confirmação → a sessão passa a aparecer em **Histórico**. |
| **Consultar progresso** | Usuário abre **Histórico** → toca em uma sessão → confere distância, duração, ritmo médio, passos e rota registrada. |

## Layout e interação

O conteúdo respeita áreas seguras superiores e inferiores em dispositivos com notch e indicador de início. Os elementos de toque terão, no mínimo, 44 pontos de altura, com botões primários de largura total no cardio. O mapa ocupa a maior parte da tela, enquanto as métricas ficam em um painel inferior de leitura rápida. Durante uma sessão ativa, o estado do treino fica sempre visível e os controles mudam sem deslocar a área do mapa.

## Cores

| Papel | Cor | Uso |
|---|---|---|
| Fundo profundo | `#0A0D0C` | Fundo principal e áreas atrás do mapa. |
| Superfície | `#151A17` | Cartões, painel de métricas e barra inferior. |
| Superfície elevada | `#202722` | Controles secundários e itens de histórico. |
| Destaque Forja | `#B9F227` | Ação primária, percurso, dados ativos e tab selecionada. |
| Texto primário | `#F4F7F2` | Títulos e métricas. |
| Texto secundário | `#9AA59C` | Rótulos, descrições e estados inativos. |
| Alerta | `#FFB74A` | Estados de atenção e permissões pendentes. |
| Erro | `#FF6B6B` | Erros de rastreamento ou falha ao salvar. |

## Decisões de experiência

O aplicativo usará mapas nativos para oferecer melhor integração com Android e iOS, preservando o modelo de dados de rota como uma lista de coordenadas. As sessões serão armazenadas inicialmente no dispositivo, de modo que o usuário possa testar o aplicativo sem conta ou servidor. A estimativa de passos priorizará o pedômetro quando disponível e usará uma aproximação por distância apenas como alternativa claramente identificada.
