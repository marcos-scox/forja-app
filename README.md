# Forja

O **Forja** é a versão mobile nativa do projeto de treinos. A aplicação foi reestruturada com Expo e React Native para priorizar uma experiência de treino em celulares Android e iOS, com navegação inferior, interface escura e um módulo de cardio baseado em GPS.

## Recursos implementados

| Área | Entrega |
|---|---|
| Navegação | Barra inferior com Treinos, Cardio, Histórico, IA Coach e Ajustes. |
| Cardio | Localização em tempo real, mapa Leaflet com OpenStreetMap, rota, distância, cronômetro, ritmo e passos. |
| Sessões | Controles para iniciar, pausar, retomar e finalizar/salvar. |
| Histórico | Sessões armazenadas localmente com métricas e trajeto consultável. |
| Movimento | Pedômetro nativo quando disponível; estimativa por distância como alternativa. |
| Privacidade | As sessões e preferências da versão atual ficam no dispositivo do usuário. |

## Desenvolvimento

Instale as dependências e use os comandos abaixo no diretório do projeto:

```bash
pnpm install
pnpm dev
pnpm check
pnpm lint
pnpm test
```

O rastreamento de localização e o pedômetro requerem um dispositivo físico com as permissões concedidas. A interface web serve apenas para desenvolvimento visual; o mapa e os sensores são exercitados no aplicativo Android/iOS.

## Baixar APK Android

O instalador Android disponível na release atual pode ser baixado diretamente pelo link abaixo:

[**Baixar FORJA APK para Android**](https://github.com/marcos-scox/forja-app/releases/download/v1.0.0/forja-app.apk)

> O link aponta para o arquivo publicado na release `v1.0.0` do repositório. Depois de gerar uma nova versão pelo fluxo de publicação, envie o novo APK a uma release do GitHub e atualize este endereço para que ele continue apontando para o build mais recente.

## Dados locais

As sessões de cardio são salvas no armazenamento local com a rota como uma sequência de coordenadas, distância em metros, duração em milissegundos, ritmo médio e origem da contagem de passos. O projeto não requer conta, servidor ou sincronização para o fluxo básico de cardio.

## Estrutura principal

| Caminho | Responsabilidade |
|---|---|
| `app/(tabs)` | Telas da navegação inferior. |
| `hooks/use-cardio-tracker.ts` | Ciclo de vida do GPS, pedômetro, rota e métricas da sessão ativa. |
| `components/map/leaflet-map.tsx` | Mapa Leaflet/OpenStreetMap embarcado em uma visualização nativa. |
| `lib/forja` | Tipos, cálculos de métricas, persistência local e estado compartilhado. |
| `tests` | Testes de métricas e armazenamento local. |

## Permissões Android

O aplicativo solicita localização aproximada/precisa para registrar o treino e reconhecimento de atividade para acessar o pedômetro quando suportado pelo aparelho. A localização é usada somente na sessão ativa iniciada pelo usuário.
