# Privacidade de Dados

> Tradução do original em inglês (`DATA-PRIVACY.md`); a versão em inglês é a autoritativa.

O QCR Workbench foi projetado para que **seus dados de risco não possam sair do
seu dispositivo sem uma ação sua**. Este documento é o inventário completo de
onde os dados residem e de todos os caminhos que eles podem percorrer.

## Onde os dados residem

| Dados | Localização | Proteção |
|---|---|---|
| Projetos, cenários, estimativas, tratamentos, trilha de auditoria | IndexedDB do navegador | AES-GCM-256, chave derivada da sua senha (PBKDF2-SHA-256, 250.000 iterações, salt aleatório) |
| Configurações do aplicativo, incl. chaves de API de IA | Mesmo armazenamento criptografado (registro `AppSettings`) | Mesma criptografia; nunca em localStorage nem em texto claro |
| Registro de armazenamentos (nomes de espaços de trabalho, dicas opcionais) | localStorage | Não secreto por design; **não** contém senhas nem dados de risco |
| Tema, preferências de UI independentes de idioma, minutos de bloqueio automático | localStorage | Não secreto; necessário antes de o cofre ser desbloqueado |
| E-mail opcional da tela de bloqueio | localStorage | Gravado **apenas** se você ativar "mostrar na tela de bloqueio"; apagado ao desativar |

A chave de criptografia derivada existe apenas na memória enquanto o cofre está
desbloqueado. Bloquear o cofre (manualmente ou via bloqueio automático) a
descarta. **Uma senha esquecida é irrecuperável** — não há redefinição, não há
e-mail de recuperação, não há fornecedor que possa ajudar. Exporte backups.

## Todos os caminhos de rede, exaustivamente

O aplicativo faz **zero** requisições por conta própria. Tudo o que segue é
iniciado pelo usuário:

1. **Chamadas de IA na nuvem** (opcional): quando você clica em uma ação de IA,
   o prompt — nomes de cenários, descrições, premissas e valores já
   calculados — vai **diretamente do seu navegador para o provedor que você
   configurou** (Anthropic, OpenAI, Google ou Alibaba), autenticado com a sua
   própria chave. Não há proxy. Use IA no dispositivo (WebLLM ou a IA integrada
   do Chrome) ou o Ollama local para manter até isso na sua máquina.
2. **Download do modelo no dispositivo** (opcional, uma única vez): ativar o
   WebLLM baixa os pesos quantizados do modelo do seu CDN público; o navegador
   os armazena em cache.
3. **Google Fonts**: as duas fontes tipográficas da interface são carregadas do
   CDN do Google.
4. **Nada mais.** Sem telemetria, sem analytics, sem relatórios de erro, sem
   verificações de atualização, sem API própria.

## Backups e exportações

- **Backup criptografado** (recomendado): um arquivo JSON criptografado com uma
  senha que você escolhe (mesmo esquema PBKDF2 + AES-GCM). Seguro para
  armazenar em qualquer lugar.
- **Backup não criptografado** (opcional, com aviso): JSON em texto claro de
  tudo, incluindo as chaves de API salvas. Oferecido apenas como salvaguarda de
  último recurso contra uma senha esquecida. Trate-o como um arquivo de senhas.
- **Relatório (.md), registro de auditoria (.txt/.doc)**: em texto claro por
  natureza — esse é o propósito da exportação. Compartilhe deliberadamente.

## Suas responsabilidades

- Escolha uma senha forte; ela é toda a fronteira de segurança.
- Se seus cenários contêm informações regulamentadas ou sigilosas, prefira IA
  no dispositivo ou nenhuma IA, e trate as exportações de acordo.
- Em máquinas compartilhadas, use o bloqueio automático (Configurações →
  Segurança) e bloqueie o cofre ao se afastar.

Para os detalhes de engenharia de segurança (CSP, parâmetros criptográficos,
enquadramento regulatório), consulte `SECURITY.md`.
