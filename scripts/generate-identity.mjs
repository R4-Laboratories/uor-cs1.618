import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const upstream=resolve(process.env.UPSTREAM_DIR??'../upstream');
execFileSync(process.execPath,[`${upstream}/prism-devrel/builder/cli.mjs`,'build','model/identity.prompt.json','--out','prism/identity','--last-modified','2026-11-16T00:00:00Z'],{stdio:'inherit'});
// The pinned builder supplies compiler-project defaults, not the application's publisher.
const path='prism/identity/app/src/Cs1618.lex.tex';let source=readFileSync(path,'utf8');
source=source.replace('cargoRepository := "https://github.com/UOR-Foundation/PrismPM"','cargoRepository := "https://github.com/R4-Laboratories/uor-cs1.618"').replace('cargoHomepage := "https://github.com/UOR-Foundation/PrismPM"','cargoHomepage := "https://r4-laboratories.github.io/uor-cs1.618/"');
writeFileSync(path,source);
