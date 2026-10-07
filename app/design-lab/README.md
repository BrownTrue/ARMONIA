# Armonia Design Lab V1

Route sperimentale, abilitata solo con `NODE_ENV=development`. Per provarla in modalità indipendente dai dati cloud:

```sh
NEXT_PUBLIC_DATA_MODE=local npm run dev
```

Aprire `http://localhost:3000/design-lab`. Il contenuto è dimostrativo e non usa dati di pazienti. Il cursore personalizzato è confinato alla sola area “Un cursore con intenzione”; non viene nascosto su touch o al di fuori di quella superficie.

## Provenienza e licenze consultate

I quattro gruppi (cursor, buttons, cards, navigation) esplorano pattern comuni, ma il codice è scritto appositamente per ARMONIA: non sono stati copiati componenti, asset, snippet, font o pacchetti esterni. Le animazioni usano CSS e React; non è stata aggiunta alcuna dipendenza.

- [React Bits](https://github.com/DavidHDev/react-bits): il repository dichiara “MIT + Commons Clause”; non è stato riutilizzato. La Commons Clause rende inopportuno presumere che qualsiasi componente sia adatto alla redistribuzione SaaS senza una verifica legale specifica.
- [Magic UI](https://github.com/magicuidesign/magicui): il repository dichiara MIT; nessuno snippet o componente è stato copiato.
- [Motion Primitives](https://github.com/ibelick/motion-primitives): il repository dichiara MIT e descrive il progetto come beta, costruito con Motion e Tailwind; nessun pacchetto o componente è stato importato.
- [shadcn/ui](https://github.com/shadcn-ui/ui): il repository dichiara MIT e distribuisce sorgenti copiabili; nessuna sorgente è stata copiata.
- Lucide è stato valutato solo come possibile fonte di icone. Non era installato nel progetto, quindi le piccole icone sono SVG locali disegnate per il playground; nessun asset Lucide è stato riutilizzato.

Le verifiche sono riferite ai repository consultati l’8 ottobre 2026. Prima di un eventuale riuso futuro, ricontrollare licenza, versione, termini e dipendenze del singolo componente.
