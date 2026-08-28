# Forja

O **Forja** é a versão mobile nativa do projeto de treinos. A aplicação foi reestruturada com Expo e React Native para priorizar uma experiência de treino em celulares Android e iOS, com navegação inferior, interface escura e um módulo de cardio baseado em GPS.

## Recursos implementados

| Área | Entrega |
|---|---|
| Navegação | Barra inferior com Treinos, Cardio, Histórico, IA Coach e Ajustes. |
| Cardio | Localização em tempo real, mapa Leaflet com OpenStreetMap, rota, distância, cronômetro, ritmo e passos. |
| Sessões | Controles para iniciar, pausar, retomar e finalizar/salvar. |
| Histórico | Sessões armazenadas localmente com métricas e trajeto consultável. |
| Movimento | Rastreamento baseado somente em GPS; o pedômetro não é usado para evitar passos falsos quando o usuário está parado. |
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

O APK da versão **Expo/React Native** é gerado e hospedado pelo próprio GitHub. A versão nativa atual está disponível aqui:

[**Baixar FORJA v2.5.0 para Android**](https://github.com/marcos-scox/forja-app/releases/download/v2.5.0/FORJA-v2.5.0.apk)

No repositório, abra a aba **Actions**, selecione **Gerar APK Android nativo** e use **Run workflow** para gerar versões futuras. Ao finalizar, o GitHub cria a release escolhida e anexa o arquivo `FORJA-vX.Y.Z.apk` para download.

> **Não use o APK da release `v1.0.0`**, pois ele pertence à antiga versão web/PWA. Use a release `v2.5.0` ou superior para instalar o aplicativo mobile nativo.

O primeiro APK é assinado para distribuição de teste e pode ser instalado diretamente em aparelhos Android. Para publicar em lojas, configure uma chave de assinatura de produção nas credenciais do repositório antes de gerar uma release de distribuição final.

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
