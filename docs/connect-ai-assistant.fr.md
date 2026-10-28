# Connecter Meffin à Claude ou ChatGPT

[English version](connect-ai-assistant.md)

Demandez à votre assistant IA où part votre argent, comparez vos mois ou faites-lui enregistrer une liste de courses dans Meffin. Environ deux minutes, une seule fois, depuis un ordinateur.

Il vous faut une seule adresse :

```
https://meffin.app/api/mcp
```

Vous hébergez Meffin vous-même ? Utilisez votre propre domaine, par exemple `https://budget.example.com/api/mcp`. Les mêmes étapes, avec un bouton de copie, sont sur [meffin.app/fr/ai-connector](https://meffin.app/fr/ai-connector).

Les noms des boutons sont indiqués en français avec l'anglais entre parenthèses, au cas où votre assistant est en anglais.

## Claude

Fonctionne avec tous les forfaits. Le forfait gratuit permet un connecteur personnalisé.

1. Ouvrez [Personnaliser → Connecteurs](https://claude.ai/customize/connectors).
2. Cliquez sur **+ Ajouter** (+ Add), puis **Ajouter un connecteur personnalisé** (Add custom connector).
3. Nommez-le **Meffin** et collez l'adresse dans le champ URL.
4. Cliquez sur **Continuer**. Choisissez **Se connecter maintenant** (Sign in now), gardez **l'identité publiée de Claude** (Use Claude's published identity), puis cliquez sur **Ajouter** (Add).
5. Une page Meffin s'ouvre. Connectez-vous, puis cliquez sur **Autoriser**.
6. Dans une conversation, cliquez sur **+** → **Connecteurs** (Connectors) et activez Meffin.

Sur Team ou Enterprise, le propriétaire ajoute Meffin dans [Paramètres de l'organisation → Connecteurs](https://claude.ai/admin-settings/connectors). Chaque membre clique ensuite sur **Connecter** (Connect).

Une fois ajouté, Meffin fonctionne aussi dans les applications mobiles Claude.

## ChatGPT

Forfait payant requis. Passez par le site ChatGPT dans votre navigateur, pas par l'application : l'option « Add MCP server » de l'application ne connecte pas vos conversations.

1. Sur un ordinateur, ouvrez [chatgpt.com/plugins](https://chatgpt.com/plugins) dans votre navigateur.
2. Cliquez sur **+**, puis **Ajouter un serveur MCP personnalisé** (Add custom MCP server).
3. Nommez-le **Meffin**. Dans **Connexion** (Connection), gardez **Server URL** et collez l'adresse.
4. Laissez **Authentification** (Authentication) sur **OAuth**. Cochez **Je comprends et je veux continuer** (I understand and want to continue), puis cliquez sur **Créer comme plugin** (Create as a plugin).
5. Quand ChatGPT vous envoie sur Meffin, connectez-vous et cliquez sur **Autoriser**.
6. Dans une nouvelle conversation, tapez **@** et choisissez Meffin.

## Essayez ces questions

- « Avec Meffin, où ai-je le plus dépensé ce mois-ci, et comment économiser ? »
- « Compare mes dépenses des trois derniers mois dans Meffin. »
- « Prépare une liste de courses pour 60 € et enregistre-la dans Meffin. »

## Ce que l'assistant peut faire

Il peut lire le budget, les transactions et les listes visibles par votre compte. Les transactions privées d'un partenaire restent cachées. La seule chose qu'il peut créer est une nouvelle liste de courses. Il ne peut pas modifier de transactions, payer ni déplacer d'argent.

## Un souci ?

- **Je ne trouve pas l'option d'ajout.** Claude Team/Enterprise : demandez au propriétaire. ChatGPT : il faut un forfait payant et passer par le site (chatgpt.com/plugins), pas par l'application. L'administrateur de votre espace doit parfois l'autoriser.
- **Meffin n'apparaît pas dans ma conversation.** Claude : **+** → **Connecteurs**, activez Meffin. ChatGPT : nouvelle conversation, tapez **@**, choisissez Meffin.
- **La connexion échoue.** Supprimez le connecteur dans votre assistant et ajoutez-le à nouveau avec la même adresse.

## Retirer l'accès

Dans Meffin, ouvrez **Mon Profil** → **Connecter un assistant IA** et cliquez sur **Retirer**. L'accès est coupé immédiatement. Supprimez aussi le connecteur dans votre assistant.
