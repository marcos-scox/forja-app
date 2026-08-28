# Project TODO

- [x] Analisar a estrutura e os fluxos existentes do repositório forja-app.
- [x] Definir os modelos de sessão de cardio, rota e configurações locais.
- [x] Substituir a estrutura web por telas Expo/React Native com navegação inferior nativa.
- [x] Aplicar tema escuro mobile first, áreas seguras e controles acessíveis.
- [x] Implementar a tela de treinos e o resumo semanal.
- [x] Implementar o mapa nativo de cardio com posição e rota em tempo real.
- [x] Integrar permissões de localização, GPS contínuo e controle de tela ativa durante treino.
- [x] Implementar distância, cronômetro, ritmo e passos com fallback por distância.
- [x] Implementar iniciar, pausar, retomar e finalizar/salvar sessões.
- [x] Persistir histórico de cardio e preferências no dispositivo.
- [x] Criar telas de histórico, IA Coach e configurações.
- [x] Escrever testes de métricas e persistência e executar verificação de tipos/lint.
- [x] Criar ícone de aplicativo exclusivo e configurar a marca do Forja.
- [x] Atualizar o repositório GitHub com a migração.
- [x] Gerar e disponibilizar o APK Android instalável.
- [x] Otimizar os ativos de ícone para concluir o checkpoint de publicação.
- [x] Adicionar ao README o link canônico de download do APK Android.
- [x] Remover o link do APK legado e substituí-lo pelo fluxo da versão nativa.
- [x] Validar o pacote Expo Android antes da geração do APK real.
- [x] Publicar o APK Android nativo e substituir o instalador legado na release do GitHub.
- [x] Configurar uma automação no GitHub para compilar e publicar o APK Android nativo.
- [x] Adicionar o workflow GitHub Actions para gerar o APK Android com Gradle.
- [x] Executar o workflow, validar o APK gerado e anexá-lo a uma nova release GitHub.
- [x] Recuperar no projeto ativo as alterações de IA Coach e cardio já enviadas ao GitHub.
- [x] Revalidar o projeto ativo recuperado e salvar um novo checkpoint antes da próxima release.
- [x] Gerar a release Android v2.1.0 a partir do checkpoint recuperado.

## Melhoria de precisão do cardio

- [x] Remover o card de treino diário da tela inicial.
- [x] Transformar IA Coach em assistente de corrida, caminhada e exercícios.
- [x] Adicionar configuração segura de provedores de IA: Manus, OpenAI, Groq, Gemini e Claude.
- [x] Acelerar a atualização de posição, distância e ritmo no cardio.
- [x] Corrigir a captura de passos com fallback mais confiável.
- [x] Validar testes, tipos, lint e export Android da melhoria.

## Correção do README público

- [x] Corrigir o link v2.0.0 exibido no README público para apontar para o APK v2.1.0.
- [x] Confirmar a leitura do README diretamente no GitHub após o push.

## Agenda e selfie pós-corrida

- [x] Adicionar ao modelo de sessão a data local e a URI opcional da selfie.
- [x] Criar agenda mensal na tela Treinos com dias de corrida destacados.
- [x] Adicionar captura ou seleção de selfie ao finalizar uma corrida.
- [x] Persistir e exibir a selfie no detalhe da sessão do histórico.
- [x] Validar permissões de câmera/galeria, testes e export Android. A nova release continua pendente de publicação.
