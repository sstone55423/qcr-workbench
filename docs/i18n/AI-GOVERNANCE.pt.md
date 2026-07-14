# Governança de IA

> Tradução do original em inglês (`AI-GOVERNANCE.md`); a versão em inglês é a autoritativa.

O QCR Workbench pode, opcionalmente, usar modelos de IA. Sob o enquadramento do
NIST AI RMF, da ISO/IEC 42001 e do EU AI Act, esta aplicação é um
**implantador** (deployer) de modelos de uso geral de terceiros, não um
provedor: ela não distribui nenhum modelo, não treina nada, e é o usuário quem
seleciona e credencia todo modelo utilizado.

## Princípios (aplicados no código, não apenas em política)

1. **A IA nunca faz os cálculos.** Todo resultado quantitativo — decomposição
   FAIR, perda esperada, estatísticas de Monte Carlo, economia dos
   tratamentos — é calculado de forma determinística em `src/lib/qcr/`. Os
   prompts de IA *incorporam* os valores já calculados
   (`src/lib/qcr/aiFeatures.js`) e instruem o modelo a não inventar nem
   recalcular números. Uma indisponibilidade da IA não muda nada na análise.
2. **Humano no circuito para tudo que entra no modelo.** As premissas de escopo
   sugeridas pela IA ficam em estágio de revisão na interface e só entram no
   cenário quando o usuário aceita cada uma individualmente. A narrativa de IA
   é um rascunho rotulado anexado ao relatório; ela nunca modifica estimativas,
   resultados ou o escopo do cenário.
3. **Transparência e proveniência** (padrão do Art. 50 do EU AI Act). Toda
   saída de IA é exibida com um banner explícito de divulgação de IA; o
   provedor, o modelo e o carimbo de data/hora são registrados na narrativa
   armazenada, mostrados na interface, gravados no registro de auditoria e
   incluídos no bloco de divulgação do relatório baixado.
4. **Detecção de obsolescência.** A narrativa armazena um hash das entradas a
   partir das quais foi redigida; se o modelo ou as premissas mudarem depois, a
   interface marca a narrativa como desatualizada até que seja redigida
   novamente (e edições nas estimativas FAIR a apagam por completo).
5. **Privacidade por arquitetura.** As chamadas de IA vão diretamente do
   navegador para o provedor escolhido pelo usuário, com a chave do próprio
   usuário — sem proxy, sem intermediário, sem camada de registro. As opções
   totalmente locais (WebLLM sobre WebGPU, IA integrada do Chrome, Ollama
   local) são de primeira classe e mantêm todo o conteúdo no dispositivo.
   Consulte `DATA-PRIVACY.md`.
6. **Auditabilidade.** Cada geração de IA grava um `AuditEvent` (categoria
   `ai`) indicando o provedor, para que um revisor possa reconstruir o que foi
   assistido por IA.

## Para que a IA é usada

| Funcionalidade | Entrada enviada | Tratamento da saída |
|---|---|---|
| Rascunho de narrativa executiva | Texto de escopo do cenário + valores calculados | Armazenado com proveniência + hash das entradas; exibido com divulgação; anexado à exportação do relatório sob um título de divulgação explícito |
| Sugestões de premissas | Texto de escopo do cenário + premissas existentes | Em estágio de revisão; cada sugestão requer aceitação explícita do usuário |
| Sugestões de tratamentos | Texto de escopo do cenário + valores de linha de base calculados + nomes de tratamentos existentes | Em estágio de revisão; aceitar uma sugestão a abre pré-preenchida no formulário de tratamento para o analista revisar, ajustar e salvar explicitamente (com registro de auditoria); a economia do tratamento é sempre recalculada de forma determinística a partir do que é salvo |

## Para que a IA **não** é usada

- Estimar ou modificar os cinco fatores FAIR
- Qualquer cálculo, simulação ou comparação
- Nada automático ou agendado — toda chamada de IA é um clique do usuário

## Riscos residuais que o usuário aceita

- **Erro do modelo**: as narrativas podem caracterizar mal os resultados
  calculados; o banner de divulgação avisa isso, e os números nas tabelas do
  relatório permanecem autoritativos.
- **Exposição ao provedor**: usar um provedor de nuvem envia o texto do cenário
  a esse provedor, sob o acordo do próprio usuário com ele. Conteúdo
  regulamentado deve usar as opções no dispositivo.
