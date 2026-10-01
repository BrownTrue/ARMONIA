import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { getAssets } from "../asset-bank/catalog.ts";
import { CONTENT_TYPES } from "./types.ts";
import { filterWords, getAvailableRepresentations, getContentById, getContents, getContentsByType, getMinimalPairLabel, getMinimalPairs, getWordById, searchContents } from "./catalog.ts";
import { validateContentCatalog } from "./validation.ts";
import { candidateNonwords, candidatePairs, candidatePassages, candidateSentences, candidateWords, getContentCandidates, validateContentCandidates } from "./candidates.ts";
import { armoniaExpandedContent, promotedNonwords, promotedPairs, promotedPassages, promotedSentences, promotedWords } from "../../data/armonia-content/expanded.ts";

const contents = getContents();
const ids = (items) => items.map((item) => item.id);

test("la discriminated union contiene esattamente i sei tipi V1", () => {
  assert.deepEqual(CONTENT_TYPES, ["word", "nonword", "minimal_pair", "sentence", "passage", "sequence"]);
  assert.deepEqual(Object.fromEntries(CONTENT_TYPES.map((type) => [type, getContentsByType(type).length])), { word: 217, nonword: 56, minimal_pair: 60, sentence: 68, passage: 13, sequence: 3 });
});

test("catalogo reale ha 417 ID univoci e tutti i riferimenti validi", () => {
  assert.equal(contents.length, 417);
  assert.equal(new Set(ids(contents)).size, 417);
  assert.equal(validateContentCatalog(contents).valid, true);
});

test("parole illustrate riusano fonologia e ID reali della Banca Asset", () => {
  const cane = getWordById("word_cane_001"), asset = getAssets().find((item) => item.id === "noun_cane_001");
  assert.deepEqual(cane?.phonemes, asset?.phonemes);
  assert.equal(cane?.phonemicTranscription, asset?.phonemicTranscription);
  assert.deepEqual(cane?.imageAssetIds, ["noun_cane_001"]);
});

test("tutti i 120 asset producono WordContent senza duplicare la fonte fonologica", () => {
  const assets=getAssets(), words=getContentsByType("word"), illustrated=words.filter((word)=>word.imageAssetIds?.length);
  assert.equal(illustrated.length,120);
  assert.equal(new Set(illustrated.flatMap((word)=>word.imageAssetIds)).size,120);
  for (const asset of assets) {
    const linked=illustrated.find((word)=>word.imageAssetIds?.[0]===asset.id);
    assert.ok(linked,asset.id);
    assert.equal(linked.phonemes,asset.phonemes);
    assert.equal(linked.consonantClusters,asset.consonantClusters);
    assert.equal(linked.geminates,asset.geminates);
  }
  assert.equal(illustrated.filter((word)=>word.reviewStatus==="reviewed").length,119);
  assert.equal(illustrated.find((word)=>word.id==="word_zebra_001")?.reviewStatus,"draft");
});

test("parola con e senza immagine espongono rappresentazioni calcolate", () => {
  assert.deepEqual(getAvailableRepresentations("word_cane_001"), { text: true, image: true });
  assert.deepEqual(getAvailableRepresentations("word_lana_001"), { text: true, image: false });
  assert.deepEqual(getAvailableRepresentations("missing"), { text: false, image: false });
  assert.equal(filterWords({ hasImage: true }).length, 120);
  assert.equal(filterWords({ hasImage: false }).length, 97);
});

test("pane/cane e rana/lana sono coppie minime dichiarate", () => {
  const pairs = getMinimalPairs({ pairType: "minimal" });
  assert.equal(ids(pairs).includes("pair_pane_cane_001"), true);
  assert.equal(ids(pairs).includes("pair_rana_lana_001"), true);
  assert.deepEqual(getContentById("pair_pane_cane_001")?.contrast, { kind: "phoneme", phonemeA: "p", phonemeB: "k", position: "initial" });
});

test("le card delle coppie risolvono sempre le parole reali e mai l'ID tecnico", () => {
  assert.equal(getMinimalPairLabel(getContentById("pair_phoneme_002")), "pino ↔ fino");
  assert.notEqual(getMinimalPairLabel(getContentById("pair_phoneme_002")), "phoneme ↔ 002");
  for (const pair of getContentsByType("minimal_pair")) {
    assert.equal(getMinimalPairLabel(pair), `${getWordById(pair.wordAId)?.text} ↔ ${getWordById(pair.wordBId)?.text}`);
    assert.doesNotMatch(getMinimalPairLabel(pair), /^phoneme(?: ↔|$)|^gemination(?: ↔|$)/);
  }
  const browser = readFileSync(new URL("../../components/content-bank-browser.tsx", import.meta.url), "utf8");
  assert.match(browser, /getMinimalPairLabel\(item\)/);
  assert.doesNotMatch(browser, /item\.id\.replace\(\/\^pair_/);
});

test("ricerca fonema è esatta e t non corrisponde a tʃ", () => {
  assert.equal(ids(filterWords({ phoneme: "tʃ" })).includes("word_cane_001"), false);
  assert.equal(ids(filterWords({ phoneme: "t" })).includes("word_gatto_001"), true);
  assert.equal(ids(filterWords({ phoneme: "t" })).some((id) => id === "word_cane_001"), false);
  const synthetic = { ...getWordById("word_cane_001"), id: "word_affricata_test", phonemes: [{ symbol: "tʃ", position: "initial", syllable: 1 }] };
  assert.equal(filterWords({ phoneme: "t" }, [synthetic]).length, 0);
  assert.equal(filterWords({ phoneme: "tʃ" }, [synthetic]).length, 1);
});

test("filtri parola coprono posizione, sillabe, cluster e geminate", () => {
  assert.equal(ids(filterWords({ phoneme: "r", phonemePosition: "initial" })).includes("word_rana_001"), true);
  assert.equal(ids(filterWords({ syllableCount: 2 })).includes("word_pane_001"), true);
  assert.equal(ids(filterWords({ consonantCluster: ["s", "t", "r"] })).includes("word_strada_001"), true);
  assert.equal(ids(filterWords({ geminate: "t" })).includes("word_gatto_001"), true);
});

test("non-parole storiche draft e corpus promosso reviewed restano distinguibili", () => {
  const nonwords = getContentsByType("nonword");
  assert.equal(nonwords.length, 56);
  assert.equal(nonwords.filter((item) => item.reviewStatus === "draft").length, 6);
  assert.equal(nonwords.filter((item) => item.reviewStatus === "reviewed").length, 50);
  assert.equal(validateContentCatalog(nonwords).valid, true);
});

test("frasi hanno collegamenti Word validi e ricerca testuale", () => {
  const sentences = getContentsByType("sentence");
  assert.equal(sentences.length, 68);
  assert.equal(sentences.every((sentence) => !sentence.linkedWordIds || sentence.linkedWordIds.every((id) => Boolean(getWordById(id)))), true);
  for (const id of ["word_finestra_001", "passage_stanza_luminosa_001", "passage_passeggiata_001", "sentence_gatto_001"]) assert.equal(ids(searchContents("finestra")).includes(id), true);
});

test("brani originali hanno 50–100 parole e domande tipizzate", () => {
  const passages = getContentsByType("passage");
  assert.equal(passages.length, 13);
  assert.equal(passages.every((passage) => passage.wordCount >= 50 && passage.wordCount <= 100 && (passage.questions?.length || 0) >= 2), true);
  assert.equal(passages.flatMap((passage) => passage.questions || []).some((question) => question.type === "inferential"), true);
  assert.equal(passages.flatMap((passage) => passage.questions || []).some((question) => question.type === "sequence"), true);
});

test("sequenze usano soltanto asset reali con ordine coerente", () => {
  const assets = new Set(getAssets().map((asset) => asset.id)), sequences = getContentsByType("sequence");
  assert.equal(sequences.length, 3);
  assert.equal(sequences.every((sequence) => sequence.steps.length >= 2 && sequence.steps.every((step, index) => step.order === index + 1 && assets.has(step.imageAssetId))), true);
});

test("validator rifiuta riferimenti rotti, duplicati e affricate spezzate", () => {
  const cane = getWordById("word_cane_001");
  const broken = [
    ...contents,
    { ...cane, id: "word_broken_001", imageAssetIds: ["missing_asset"], phonemicTranscription: "/tʃa/", phonemes: [{ symbol: "t", position: "initial", syllable: 1 }, { symbol: "ʃ", position: "final", syllable: 1 }] },
    { ...getContentById("pair_pane_cane_001"), id: "pair_broken_001", wordBId: "missing_word" },
  ];
  const result = validateContentCatalog(broken);
  assert.equal(result.valid, false);
  assert.equal(result.errors.some((issue) => issue.message.includes("Asset inesistente")), true);
  assert.equal(result.errors.some((issue) => issue.message.includes("WordContent inesistente")), true);
  assert.equal(result.errors.some((issue) => issue.message.includes("unità atomica")), true);
});

test("la Banca Asset resta separata e non dipende dalla Banca Contenuti", () => {
  const assetCatalog = readFileSync(new URL("../../data/armonia-assets/catalog.ts", import.meta.url), "utf8");
  const assetDomain = readFileSync(new URL("../asset-bank/catalog.ts", import.meta.url), "utf8");
  assert.equal(getAssets().length, 120);
  assert.doesNotMatch(assetCatalog + assetDomain, /armonia-content|content-bank/);
});

test("la preview è read-only e non espone CRUD o generazione esercizi", () => {
  const page = readFileSync(new URL("../../app/risorse/laboratorio/contenuti/page.tsx", import.meta.url), "utf8");
  const browser = readFileSync(new URL("../../components/content-bank-browser.tsx", import.meta.url), "utf8");
  assert.match(page, /getContents\(\)/);
  assert.doesNotMatch(page + browser, /Crea contenuto|Modifica contenuto|Elimina contenuto|Genera esercizio/);
});

test("contrasto gemination è distinto dal contrasto fonemico e validabile", () => {
  const pair=promotedPairs.find((item)=>item.contrast.kind==="gemination");
  assert.ok(pair && pair.contrast.kind==="gemination");
  assert.equal(pair.contrast.sideA,"singleton"); assert.equal(pair.contrast.sideB,"geminate");
  assert.equal("phonemeA" in pair.contrast,false);
  assert.equal(validateContentCandidates().valid,true);
  assert.equal(getMinimalPairs({contrastKind:"phoneme"}).length,46);
});

test("la coda candidati conserva tutte le coppie bloccate da dipendenze draft", () => {
  assert.deepEqual([candidateWords.length,candidatePairs.length,candidateNonwords.length,candidateSentences.length,candidatePassages.length],[0,5,0,0,0]);
  const candidates=getContentCandidates(), candidateIds=new Set(candidates.map((item)=>item.id));
  assert.equal(candidates.length,5); assert.equal(candidateIds.size,5);
  assert.equal(candidates.every((item)=>item.reviewStatus==="draft"),true);
  assert.equal(contents.some((item)=>candidateIds.has(item.id)),false);
  assert.deepEqual(new Set(candidatePairs.map((item)=>[item.wordAId,item.wordBId].sort().join("::"))),new Set([
    "word_lana_001::word_rana_001", "word_fatto_001::word_gatto_001", "word_foglia_001::word_voglia_001", "word_freno_001::word_treno_001", "word_fato_001::word_fatto_001",
  ]));
  assert.equal(candidatePairs.every((pair)=>[pair.wordAId,pair.wordBId].some((id)=>getWordById(id)?.reviewStatus==="draft")),true);
  assert.equal(validateContentCandidates().valid,true);
});

test("corpus promosso conserva POS, sensi e fonologia espliciti", () => {
  const byText=(text)=>promotedWords.find((item)=>item.text===text);
  const source=readFileSync(new URL("../../data/armonia-content/expanded.ts",import.meta.url),"utf8");
  assert.doesNotMatch(source,/partOfSpeech:\s*editorial\.partOfSpeech\s*\?\?\s*["']noun["']/);
  assert.equal(promotedWords.every((item)=>Boolean(item.partOfSpeech)),true);
  assert.equal(new Set(promotedWords.map((item)=>item.partOfSpeech)).size>1,true);
  assert.deepEqual([byText("caro")?.partOfSpeech,byText("pare")?.lemma,byText("rossa")?.lemma],["adjective","parere","rosso"]);
  assert.deepEqual([byText("botte")?.lemma,byText("botte")?.senseLabel,byText("botte")?.phonemicTranscription],["botta","colpi","/ˈbɔtte/"]);
  assert.deepEqual([byText("nono")?.partOfSpeech,byText("nono")?.senseLabel],["adjective","numero ordinale"]);
  assert.deepEqual([byText("peso")?.phonemicTranscription,byText("reso")?.phonemicTranscription,byText("teso")?.phonemicTranscription],["/ˈpeso/","/ˈreso/","/ˈteso/"]);
  assert.equal(["peso","reso","teso"].every((text)=>byText(text)?.phonemes.some((unit)=>unit.symbol==="s")&&!byText(text)?.phonemes.some((unit)=>unit.symbol==="z")),true);
  assert.deepEqual([byText("mete")?.phonemicTranscription,byText("mete")?.senseLabel],["/ˈmɛte/","scopo o punto di arrivo"]);
  assert.equal(byText("panca")?.phonemes.some((unit)=>unit.symbol==="n"),true);
  assert.equal(byText("manca")?.phonemes.some((unit)=>unit.symbol==="ŋ"),false);
  assert.equal(byText("zappa")?.phonemes[0]?.symbol,"ts");
});

test("coppie dichiarano posizione reale e geminazioni pure", () => {
  const phonemePairs=promotedPairs.filter((item)=>item.contrast.kind==="phoneme");
  assert.equal(phonemePairs.every((item)=>item.contrast.position==="initial"),false);
  const find=(a,b)=>promotedPairs.find((item)=>item.wordAId.endsWith(`_${a}_001`)&&item.wordBId.endsWith(`_${b}_001`));
  assert.equal(find("sale","sole")?.contrast.position,"medial");
  assert.equal(find("caso","casa")?.contrast.position,"final");
  assert.equal(find("tetto","letto")?.pairType,"near_minimal");
  assert.equal(find("zappa","pappa")?.contrast.phonemeA,"ts");
  assert.equal(Boolean(find("rete","mete")),false);
  assert.deepEqual([find("coro","foro")?.pairType,find("coro","foro")?.contrast.position],["minimal","initial"]);
  assert.equal(promotedPairs.filter((item)=>item.pairType==="minimal").length,49);
  assert.equal(promotedPairs.filter((item)=>item.pairType==="near_minimal").length,5);
  const gem=promotedPairs.filter((item)=>item.contrast.kind==="gemination");
  assert.equal(gem.length,14);
  for(const falsePair of [["sete","sette"],["tono","tonno"],["polo","pollo"],["rosa","rossa"],["capello","cappello"],["sera","serra"]]) assert.equal(Boolean(find(...falsePair)),false);
  assert.equal(Boolean(find("baco","bacco")),false);
  for(const truePair of [["cane","canne"],["casa","cassa"],["nono","nonno"],["faro","farro"],["roca","rocca"],["braci","bracci"]]) assert.ok(find(...truePair));
  assert.equal(find("faro","farro")?.pairType,"minimal");
  for(const pair of [["pala","pena"],["copia","cosa"],["tufo","muro"]]) assert.ok(find(...pair)?.notes);
});

test("nonword hanno fonologia manuale e non coincidono con parole note", () => {
  const source=readFileSync(new URL("../../data/armonia-content/expanded.ts",import.meta.url),"utf8");
  assert.doesNotMatch(source,/simplePhonology/);
  const known=new Set(getContentsByType("word").map((item)=>item.text.toLocaleLowerCase("it")));
  assert.equal(promotedNonwords.some((item)=>known.has(item.text.toLocaleLowerCase("it"))),false);
  const editorialBlacklist=new Set(["tef","nifo","tuma","savi","rivo","pulo","dema","bego","pelano","criva","plena"]);
  assert.equal(promotedNonwords.some((item)=>editorialBlacklist.has(item.text)),false);
  assert.equal(promotedNonwords.length,50);
  assert.equal(promotedNonwords.every((item)=>item.phonemes.length>0&&!item.phonemes.some((unit)=>unit.symbol==="c"||unit.symbol==="g")),true);
});

test("domande dei brani sono specifiche e hanno risposta attesa", () => {
  const prompts=promotedPassages.flatMap((item)=>item.questions?.map((question)=>question.prompt)||[]);
  assert.equal(new Set(prompts).size,30);
  assert.equal(promotedPassages.every((item)=>item.questions?.length===3&&item.questions.every((question)=>Boolean(question.expectedAnswer))),true);
  assert.deepEqual([promotedPassages[2].questions?.[2],promotedPassages[4].questions?.[2],promotedPassages[6].questions?.[2]],[
    {id:"q_3_3",type:"inferential",prompt:"Perché il ritrovamento del libro era utile alla compagna?",expectedAnswer:"Perché le serviva per completare la sua ricerca."},
    {id:"q_5_3",type:"inferential",prompt:"Perché la deviazione non fu soltanto uno svantaggio?",expectedAnswer:"Perché permise ad alcuni passeggeri di scoprire una zona nuova della città."},
    {id:"q_7_3",type:"inferential",prompt:"Quale vantaggio ebbe Nadia dall'avere preparato tutto la sera prima?",expectedAnswer:"Poté uscire senza fretta al mattino."},
  ]);
});

test("promozione controllata usa ID canonici e metadati editoriali reviewed", () => {
  assert.equal(armoniaExpandedContent.length,265);
  assert.deepEqual([promotedWords.length,promotedPairs.length,promotedNonwords.length,promotedSentences.length,promotedPassages.length],[91,54,50,60,10]);
  assert.equal(armoniaExpandedContent.every((item)=>item.reviewStatus==="reviewed"&&item.sourceType==="armonia_original"&&item.sourceName==="ARMONIA"&&item.commercialUseAllowed===true),true);
  assert.equal(armoniaExpandedContent.some((item)=>item.id.startsWith("candidate_")),false);
  assert.equal(promotedPassages.flatMap((item)=>item.questions||[]).some((question)=>question.id.startsWith("candidate_")),false);
});

test("coppie duplicate sono consolidate semanticamente una sola volta", () => {
  const unordered=(a,b)=>getContentsByType("minimal_pair").filter((pair)=>new Set([pair.wordAId,pair.wordBId]).size===new Set([a,b]).size&&[pair.wordAId,pair.wordBId].every((id)=>id===a||id===b));
  for(const [a,b] of [["word_pane_001","word_cane_001"],["word_rana_001","word_lana_001"],["word_gatto_001","word_fatto_001"],["word_foglia_001","word_voglia_001"],["word_treno_001","word_freno_001"]]) assert.equal(unordered(a,b).length,1,`${a}/${b}`);
});

test("validator protegge dedupe e dipendenze editoriali delle coppie", () => {
  const existing=getContentById("pair_pane_cane_001");
  const inverse={...existing,id:"pair_inverse_test",wordAId:existing.wordBId,wordBId:existing.wordAId};
  assert.equal(validateContentCatalog([...contents,inverse]).errors.some((issue)=>issue.message.includes("duplicata")),true);
  const blocked={...promotedPairs[0],id:"pair_draft_dependency_test",wordAId:"word_fatto_001",reviewStatus:"reviewed"};
  assert.equal(validateContentCatalog([...contents,blocked]).errors.some((issue)=>issue.message.includes("draft")),true);
});

test("catalogo finale conserva distinzione reviewed e draft", () => {
  assert.equal(contents.filter((item)=>item.reviewStatus==="reviewed").length,385);
  assert.equal(contents.filter((item)=>item.reviewStatus==="draft").length,32);
  assert.equal(contents.filter((item)=>item.reviewStatus==="approved").length,0);
  assert.equal(promotedPairs.filter((item)=>item.contrast.kind==="gemination").length,14);
});

test("coverage report documenta parole coppie nonword e limite sequenze", () => {
  const report=readFileSync(new URL("../../data/armonia-content/coverage-report.md",import.meta.url),"utf8");
  assert.match(report,/## Word/); assert.match(report,/## Minimal pairs/); assert.match(report,/## Nonword/);
  assert.match(report,/servono asset visivi dedicati a scene e sequenze narrative/);
});
