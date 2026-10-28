# Connect Meffin to Claude or ChatGPT

[Version française](connect-ai-assistant.fr.md)

Ask your AI assistant where your money goes, compare months, or have it save a grocery list in Meffin. It takes about two minutes, once, from a computer.

You need one address:

```
https://meffin.app/api/mcp
```

The same steps, with a copy button, are on [meffin.app/en/ai-connector](https://meffin.app/en/ai-connector).

## Claude

Works on every plan. The Free plan allows one custom connector.

1. Open [Customize → Connectors](https://claude.ai/customize/connectors).
2. Click **+ Add**, then **Add custom connector**.
3. Name it **Meffin** and paste the address as the URL.
4. Click **Continue**, choose **Sign in now**, then click **Add**. Leave the other options as they are.
5. A Meffin page opens. Sign in, then click **Allow access**.
6. In a chat, click **+** → **Connectors** and turn Meffin on.

On Team or Enterprise, an owner adds Meffin in [Organization settings → Connectors](https://claude.ai/admin-settings/connectors). Each member then clicks **Connect**.

Once added, Meffin also works in the Claude mobile apps.

## ChatGPT

Needs a paid plan. Use the ChatGPT website in your browser: adding Meffin from the ChatGPT desktop app won't work.

1. On a computer, open [chatgpt.com/plugins](https://chatgpt.com/plugins) in your browser.
2. Click **+**, then **Add custom MCP server**.
3. Name it **Meffin** and paste the address under **Connection**.
4. Don't change anything else. Tick **I understand and want to continue**, then click **Create as a plugin**.
5. When ChatGPT sends you to Meffin, sign in and click **Allow access**.
6. In a new chat, type **@** and pick Meffin.

## Try asking

- "Using Meffin, where did I spend the most this month, and how could I save?"
- "Compare my spending over the last three months in Meffin."
- "Plan groceries for €60 and save the list in Meffin."

## What the assistant can do

It can read the budget, transactions, and lists your account can see. A partner's private transactions stay hidden. The only thing it can create is a new shopping list. It cannot edit transactions, make payments, or move money.

## Troubleshooting

- **Can't find the add option.** Claude Team/Enterprise: ask an owner. ChatGPT: you need a paid plan and the website (chatgpt.com/plugins), not the desktop app. Your workspace admin may also need to allow it.
- **Meffin doesn't show up in my chat.** Claude: **+** → **Connectors**, turn Meffin on. ChatGPT: start a new chat, type **@**, pick Meffin.
- **The connection fails.** Remove the connector from your assistant and add it again with the same address.

## Disconnect

In Meffin, open **My Profile** → **Connect an AI assistant** and click **Disconnect**. Access stops right away. Also remove the connector from your assistant.

## Running your own Meffin

Use your own address instead, for example `https://budget.example.com/api/mcp`.
