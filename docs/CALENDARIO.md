# Calendário de aquecimento — CityJobs

Objetivo: dar ritmo diário à conta (@cityjobs.sp) e aos grupos de WhatsApp,
gerando presença e prova social antes/enquanto chegam clientes pagantes.

## Cadência recomendada
- **4–6 Stories/dia** por região na fase de aquecimento (teto de segurança: 18/dia por conta).
- **Horários de pico (BRT):** 08h, 12h, 18h — onde Stories rendem mais.
- Mix de nichos ao longo do dia (não repetir o mesmo nicho em sequência).

## Como funciona (já automático)
1. Vaga aprovada + com `scheduledFor` → o agendador in-process publica sozinho no horário (checa a cada 5 min).
2. Botão **"📅 Agendar fila nos picos"** (admin → Agenda) distribui as vagas sem horário nos próximos slots de pico, 1 por slot.
3. Ao publicar, a Agenda já mostra a **mensagem pronta do grupo de WhatsApp** certo (botão "Copiar p/ grupo").
4. Token do Instagram renova sozinho a cada 24h (+60 dias).

## Grade sugerida (1 região)
| Slot  | Nicho sugerido      | Grupo WhatsApp        |
|-------|---------------------|-----------------------|
| 08h   | Logística/Transporte| Transporte            |
| 12h   | Restaurante         | Gastronomia           |
| 18h   | Varejo              | Varejo                |
| (extra) | Saúde / Escritório| Saúde / Administrativo|

## Regras de qualidade
- Só publicar vaga **real** (empresa + contato verdadeiros). Vaga fictícia com
  contato falso engana candidato e queima a marca — não usar em conta pública.
- Sempre variar arte/fundo (o agente já gera fundo IA distinto por nicho/brief).
- Acompanhar respostas nos grupos; remover quem furar a regra (só admin posta).

## Próximo nível (quando houver volume)
- Segunda região (nova comunidade + novo Instagram).
- Digest diário no "Avisos" da comunidade puxando pros grupos por área.
