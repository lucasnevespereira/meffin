# Connect Meffin to Claude or ChatGPT

[Version française](connect-ai-assistant.fr.md)

Ask your AI assistant where your money goes, compare months, or have it save a grocery list in Meffin. It takes about two minutes, once, from a computer.

You need one address:

```
https://meffin.app/api/mcp
```

Self-hosting? Use your own origin, for example `https://budget.example.com/api/mcp`. The same steps and a copy button are on [meffin.app/en/ai-connector](https://meffin.app/en/ai-connector).

## Claude

Works on every plan. The Free plan allows one custom connector.

1. Open [Customize → Connectors](https://claude.ai/customize/connectors).
2. Click **+ Add**, then **Add custom connector**.
3. Name it **Meffin** and paste the address as the URL.
4. Click **Continue**. Choose **Sign in now**, keep **Use Claude's published identity**, then click **Add**.
5. A Meffin page opens. Sign in, then click **Allow access**.
6. In a chat, click **+** → **Connectors** and turn Meffin on.

On Team or Enterprise, an owner adds Meffin in [Organization settings → Connectors](https://claude.ai/admin-settings/connectors). Each member then clicks **Connect**.

Once added, Meffin also works in the Claude mobile apps.

## ChatGPT

Needs a paid plan.

1. Open ChatGPT settings → **Plugins** ([chatgpt.com/plugins](https://chatgpt.com/plugins)).
2. Click **Add**, then **Add MCP server**. Not "Create plugin".
3. Name it **Meffin**. Under **Type**, pick **Streamable HTTP**.
4. Paste the address in the **URL** field. Leave **Bearer token env var** and the headers empty, then click **Save**. The form does not ask you to sign in. That's expected.
5. In the **MCPs** tab, click **Authenticate** next to Meffin. Sign in, then click **Allow access**. Meffin may ask "Connect Codex?". That's expected: it's the name ChatGPT uses.
6. In a new chat, type **@** and pick Meffin.

Don't leave the type on **STDIO**. That is for programs on your computer, and Meffin would never ask you to sign in. If you already did, open Meffin in the **MCPs** tab, click **Uninstall**, and start again.

## Try asking

- "Using Meffin, where did I spend the most this month, and how could I save?"
- "Compare my spending over the last three months in Meffin."
- "Plan groceries for €60 and save the list in Meffin."

## What the assistant can do

It can read the budget, transactions, and lists your account can see. A partner's private transactions stay hidden. The only thing it can create is a new shopping list. It cannot edit transactions, make payments, or move money.

## Troubleshooting

- **Can't find the add option.** Claude Team/Enterprise: ask an owner. ChatGPT: you need a paid plan, and your workspace admin may need to allow it.
- **Meffin doesn't show up in my chat.** Claude: **+** → **Connectors**, turn Meffin on. ChatGPT: start a new chat, type **@**, pick Meffin.
- **Never asked to sign in, or the connection fails.** ChatGPT: check the type is Streamable HTTP and click **Authenticate**. Otherwise remove the connector and add it again.

## Disconnect

In Meffin, open **My Profile** → **Connect an AI assistant** and click **Disconnect**. Access stops right away. Also remove the connector from your assistant.
