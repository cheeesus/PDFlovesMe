# Merge PDF

Application web responsive pour réorganiser, pivoter et fusionner des PDF dans le navigateur. Les fichiers ne sont jamais envoyés à un serveur.

## Démarrage local

Prérequis : Node.js 20 ou plus récent et npm.

```bash
npm install
npm run build
npm run dev
```

Ouvrez l’adresse locale affichée par Vite (généralement `http://localhost:5173`). Pour créer et servir la version de production :

```bash
npm run build
npm run preview
```

## Utilisation

1. Sélectionnez ou déposez plusieurs fichiers PDF.
2. Réorganisez les cartes par glisser-déposer, triez par nom, pivotez un document par pas de 90° ou retirez-le.
3. Cliquez sur **Fusionner PDF**. Le résultat est téléchargé sous `fusionné_YYYY-MM-DD.pdf`.

Les aperçus et le nombre de pages sont générés avec `pdfjs-dist`. `pdf-lib` assemble les pages dans le navigateur et conserve leur contenu vectoriel. Le flux de copie de pages de pdf-lib ne préserve pas les signets/outline des PDF source.
