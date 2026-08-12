# FORJA — Painel de Treino & Saúde

**FORJA** é um painel de treino e saúde transformado em **PWA (Progressive Web App)** instalável, feito em HTML, CSS e JavaScript puro. Ele reúne agenda semanal de treinos, biblioteca de exercícios, monitoramento de cardio, anotações pós-treino, assistente de IA (IA Coach) e acompanhamento de progresso — tudo rodando direto no navegador, sem precisar de backend.

> **Download:** baixe o app completo neste link: [📥 Baixar FORJA (forja-app.zip)](https://github.com/marcos-scox/forja-app/archive/refs/heads/master.zip)
>
> Ou clone o repositório: `git clone https://github.com/marcos-scox/forja-app.git`

## Instalação no Android (APK)

Se preferir usar o FORJA como aplicativo Android, baixe o APK assinado na página de releases:

> **📲 Baixar APK:** [forja-app.apk (v1.0.0)](https://github.com/marcos-scox/forja-app/releases/download/v1.0.0/forja-app.apk)
>
> O arquivo também está incluído no repositório, em `apk/forja-app.apk`.

Para instalar:

1. Baixe o arquivo `forja-app.apk` no seu celular
2. Abra o arquivo — o Android vai pedir permissão para **instalar apps de fontes desconhecidas** do navegador/gerenciador de arquivos que você usou
3. Confirme a instalação e pronto: o ícone do **FORJA** vai aparecer na tela inicial

O app abre automaticamente a versão web do painel (funciona como uma Trusted Web Activity). Para usar o **IA Coach**, configure sua chave da Groq em **Configurações** dentro do app.

> Observação: o APK foi gerado com um keystore local de teste. Se você for distribuir o app na Play Store, assine novamente com sua própria chave.

## Captura do app

![FORJA — Painel de Treino & Saúde](icons/icon-512.png)

## Funcionalidades

| Recurso | Descrição |
| --- | --- |
| **Início** | Saudação personalizada, progresso semanal com gráfico circular e treino do dia |
| **Agenda** | Monte o treino de cada dia da semana; a rotina se repete e os check-ins zeram sozinhos na virada do dia |
| **Cardio** | Cronômetro e acompanhamento de atividades cardiovasculares |
| **Biblioteca** | Catálogo de exercícios para montar os treinos |
| **Anotações** | Registro pós-treino para acompanhar evolução e percepções |
| **IA Coach** | Assistente de IA (Groq) para dúvidas sobre treino, execução de exercícios e hábitos |
| **Configurações** | Meta semanal, temas visuais, reset automático e gerenciamento de dados |

## Estrutura do projeto

```
forja-app/
├── index.html          → HTML principal (estrutura da página)
├── manifest.json        → metadados do app instalável (nome, ícones, cores)
├── sw.js                 → Service Worker (cache offline + suporte à instalação)
├── css/
│   └── styles.css        → todo o CSS do painel
├── js/
│   └── app.js             → toda a lógica (agenda, biblioteca, IA, localStorage etc.)
└── icons/
    ├── icon-16.png, icon-32.png     → favicon
    ├── icon-180.png                  → ícone para iOS (apple-touch-icon)
    ├── icon-192.png, icon-512.png    → ícones padrão do PWA
    └── icon-maskable-512.png         → ícone "maskable" (Android adaptativo)
```

## Como usar

### 1. Baixar e abrir localmente

Depois de baixar o ZIP (link acima) e extrair, não dá pra abrir `index.html` direto clicando duas vezes — o navegador bloqueia o Service Worker em arquivos `file://`. É preciso servir por HTTP. Duas formas simples:

**Com Python** (já vem em praticamente qualquer sistema):

```bash
cd forja-app
python3 -m http.server 8080
```

Depois abra `http://localhost:8080` no navegador.

**Com Node** (se preferir):

```bash
npx serve forja-app
```

### 2. Hospedar na internet (opcional)

Suba a pasta inteira (mantendo a estrutura) em qualquer hospedagem de arquivos estáticos — **GitHub Pages**, Netlify, Vercel ou Cloudflare Pages. Não precisa de backend: é só HTML/CSS/JS. Para ativar o GitHub Pages neste repositório, vá em **Settings → Pages → Branch: `master` → Save**.

### 3. Instalar como app

Depois de aberto pelo navegador (Chrome, Edge ou navegadores baseados em Chromium no Android/desktop):

- Vai aparecer um ícone de "Instalar app" na barra de endereço, ou
- Menu → "Instalar FORJA" / "Adicionar à tela inicial"

No iPhone (Safari): Compartilhar → "Adicionar à Tela de Início".

Depois de instalado, o app abre em tela cheia (sem barra do navegador), com ícone próprio, e **funciona offline** — a agenda, anotações e tudo que já foi carregado antes continuam acessíveis sem internet. Só o Assistente de IA precisa de conexão, porque depende da API da Groq.

## Configurando o IA Coach (chave da Groq)

O IA Coach usa a API da [Groq](https://groq.com). Por segurança, **nenhuma chave de API fica no código-fonte**. Para ativar o assistente:

1. Crie uma chave gratuita em [console.groq.com/keys](https://console.groq.com/keys)
2. Abra o FORJA → **Configurações → IA Coach (chave Groq)**
3. Cole a chave (começa com `gsk_...`) e clique em **Salvar chave**

A chave fica armazenada apenas no `localStorage` do seu navegador e nunca aparece no código. Se a chave não estiver configurada, o IA Coach avisa e orienta a configurá-la.

> Alternativamente, edite `js/app.js` e coloque sua chave diretamente na constante `GROQ_KEY_DEFAULT` — mas atenção: **não faça isso se o projeto for público**, pois a chave ficaria visível no código-fonte.

## Observações técnicas

- **Sem build step**: não tem Webpack, Vite, `npm install` nem nada disso. É HTML/CSS/JS puro, então qualquer editor ou hospedagem estática funciona direto.
- **Tailwind e fontes**: continuam vindo de CDN (`cdn.tailwindcss.com` e Google Fonts), então é necessário estar online na primeira visita para o visual carregar certinho. Depois disso, o Service Worker guarda o "esqueleto" do app (HTML, CSS e JS) em cache para as próximas vezes, mesmo sem internet.
- **Dados do usuário**: tudo (treinos, anotações, cardio, perfil, tema escolhido e a chave da Groq) continua salvo no `localStorage` do navegador.

## Licença

Distribuído livremente para uso pessoal.
