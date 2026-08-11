# FORJA — Painel de Treino & Saúde

App de treino transformado em **PWA (Progressive Web App)** instalável, com o código separado em pastas.

## Estrutura de pastas

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

### 1. Abrir localmente
Não dá pra abrir `index.html` direto clicando duas vezes (o navegador bloqueia o Service Worker em arquivos `file://`). É preciso servir por http. Duas formas simples:

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

### 2. Hospedar de verdade
Suba a pasta inteira (mantendo a estrutura) em qualquer hospedagem de arquivo estático: GitHub Pages, Netlify, Vercel, Cloudflare Pages, ou o servidor que você já usa. Não precisa de backend — é só HTML/CSS/JS.

### 3. Instalar como app
Depois de aberto pelo navegador (Chrome, Edge ou navegadores baseados em Chromium no Android/desktop):
- Vai aparecer um ícone de "Instalar app" na barra de endereço, ou
- Menu → "Instalar FORJA" / "Adicionar à tela inicial"

No iPhone (Safari): Compartilhar → "Adicionar à Tela de Início".

Depois de instalado, o app abre em tela cheia (sem barra do navegador), com ícone próprio, e funciona offline (a agenda, anotações e tudo que já foi carregado antes continuam acessíveis sem internet — só o Assistente de IA precisa de conexão, porque depende da API da Groq).

## Observações técnicas

- **Sem build step**: não tem Webpack, Vite, npm install nem nada disso. É HTML/CSS/JS puro, então qualquer editor ou hospedagem estática funciona direto.
- **Tailwind e fontes**: continuam vindo de CDN (`cdn.tailwindcss.com` e Google Fonts), então é necessário estar online na primeira visita para o visual carregar certinho. Depois disso, o Service Worker guarda o "esqueleto" do app (HTML, CSS e JS) em cache para as próximas vezes, mesmo sem internet.
- **Dados do usuário**: tudo (treinos, anotações, perfil, tema escolhido) continua salvo no `localStorage` do navegador, exatamente como antes — nada mudou nessa parte, só a organização dos arquivos.
- **Chave da API da Groq**: está embutida em `js/app.js`, igual estava no arquivo único. Se for publicar esse projeto publicamente, qualquer pessoa que abrir o código-fonte consegue ver essa chave.
