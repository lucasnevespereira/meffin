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

Forfait payant requis.

1. Ouvrez les paramètres de ChatGPT → **Plugins** ([chatgpt.com/plugins](https://chatgpt.com/plugins)).
2. Cliquez sur **Ajouter** (Add), puis **Ajouter un serveur MCP** (Add MCP server). Pas « Créer un plugin ».
3. Nommez-le **Meffin**. Dans **Type**, choisissez **Streamable HTTP**.
4. Collez l'adresse dans le champ **URL**. Laissez **Bearer token env var** et les en-têtes vides, puis cliquez sur **Enregistrer** (Save). Le formulaire ne demande pas de connexion, c'est normal.
5. Dans l'onglet **MCPs**, cliquez sur **Authentifier** (Authenticate) à côté de Meffin. Connectez-vous, puis cliquez sur **Autoriser**. Meffin peut afficher « Connecter Codex ? » : c'est normal, c'est le nom utilisé par ChatGPT.
6. Dans une nouvelle conversation, tapez **@** et choisissez Meffin.

Ne laissez pas le type sur **STDIO**. C'est pour les programmes installés sur votre ordinateur, et Meffin ne vous demanderait jamais de vous connecter. Si c'est déjà fait, ouvrez Meffin dans l'onglet **MCPs**, cliquez sur **Désinstaller** (Uninstall) et recommencez.

## Essayez ces questions

- « Avec Meffin, où ai-je le plus dépensé ce mois-ci, et comment économiser ? »
- « Compare mes dépenses des trois derniers mois dans Meffin. »
- « Prépare une liste de courses pour 60 € et enregistre-la dans Meffin. »

## Ce que l'assistant peut faire

Il peut lire le budget, les transactions et les listes visibles par votre compte. Les transactions privées d'un partenaire restent cachées. La seule chose qu'il peut créer est une nouvelle liste de courses. Il ne peut pas modifier de transactions, payer ni déplacer d'argent.

## Un souci ?

- **Je ne trouve pas l'option d'ajout.** Claude Team/Enterprise : demandez au propriétaire. ChatGPT : il faut un forfait payant, et l'administrateur de votre espace doit parfois l'autoriser.
- **Meffin n'apparaît pas dans ma conversation.** Claude : **+** → **Connecteurs**, activez Meffin. ChatGPT : nouvelle conversation, tapez **@**, choisissez Meffin.
- **Aucune demande de connexion, ou la connexion échoue.** ChatGPT : vérifiez que le type est Streamable HTTP et cliquez sur **Authentifier**. Sinon, supprimez le connecteur et ajoutez-le à nouveau.

## Retirer l'accès

Dans Meffin, ouvrez **Mon Profil** → **Connecter un assistant IA** et cliquez sur **Retirer**. L'accès est coupé immédiatement. Supprimez aussi le connecteur dans votre assistant.
