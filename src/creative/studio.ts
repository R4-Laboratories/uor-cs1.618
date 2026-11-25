import backlog from '../../model/development/backlog.json';
import {experiencePolicy} from '../../shared/generated-experience';
import '@fontsource/barlow/400.css';
import '@fontsource/barlow/600.css';
import '@fontsource/barlow-condensed/600.css';
import '@fontsource/ibm-plex-mono/400.css';
import './studio.css';
import {artProgram} from '../../shared/generated-artwork';
import {tacticsProgram} from '../../shared/generated-tactics';
import {paintArtwork} from './artwork';
const root=document.querySelector<HTMLDivElement>('#studio')!;
root.innerHTML=`<header><a class="brand" href="./">cs<span>1.618</span></a><nav><a href="./evolution.json">Generation record ↗</a><a class="play" href="./">PLAY THE GAME ↗</a></nav></header>
<main><section class="intro"><p class="eyebrow">MERIDIAN / EVOLUTION STUDIO</p><h1>Made by the game.<br><em>Tested in the field.</em></h1><div class="intro-bottom"><p>Original procedural artwork and tactical programs, authored as code and admitted through measured game checks.</p><div class="stamp"><span id="generation">LOADING RECORD</span><small>GITHUB → PRISM → PAGES</small></div></div></section>
<section class="gallery"><div class="section-heading"><div><p class="eyebrow">01 / SIGNAL STUDIES</p><h2>Two sites. One visual language.</h2></div><label class="toggle"><input type="checkbox" id="original"> Show original surface</label></div><div class="murals"><figure><canvas id="site-a" width="1024" height="512" aria-label="Generated mural for site A"></canvas><figcaption><b>A / WEST RELAY</b><span>Warm signal</span></figcaption></figure><figure><canvas id="site-b" width="1024" height="512" aria-label="Generated mural for site B"></canvas><figcaption><b>B / EAST RELAY</b><span>Cool signal</span></figcaption></figure></div><p class="caption">Generated vector recipes placed on four existing walls. Objective labels, sight lines and collision geometry remain protected. You can switch murals off in the game’s pause menu.</p></section>
<section id="material-inspector" class="material-inspector" aria-labelledby="material-heading">
 <div class="section-heading"><h2 id="material-heading">Material inspector</h2><a href="https://github.com/R4-Laboratories/uor-cs1.618/blob/main/model/studio-render-surfaces.json">Material source ↗</a></div>
 <div class="material-stage"><canvas aria-label="Selected material finishes under matching studio lighting"></canvas><span role="status">Loading material previews…</span></div>
 <div class="surface-controls">
  <label>Surface<select aria-label="Surface" disabled></select><output></output></label>
  <label>Compare with<select aria-label="Compare with" disabled></select><output></output></label>
 </div>
 <a class="studio-direction" href="https://github.com/afflom/verdant-studio/tree/7423aa68ae6c10870f5d9165e00dde5a6223e024">Verdant Studio ↗</a>
</section>
<section class="logic"><div><p class="eyebrow">02 / FIELD INTELLIGENCE</p><h2>Rules with consequences.</h2><p>Generated decision trees guide objective priorities, reloads and carrier support. Bots receive local facts and visible threats; the authoritative match still controls every action.</p><div id="tactic-count" class="metric"></div><p class="caption">Scenario performance is evidence for those scenarios. It is not a claim of general intelligence or stronger play in every match.</p></div><div class="code"><div class="code-top">ADMITTED TACTICAL PROGRAM <button id="download">DOWNLOAD RECIPES ↓</button></div><pre id="tactics"></pre></div></section>
<section class="receipt"><p class="eyebrow">03 / THE ADMISSION RECORD</p><h2>Show the work.</h2><div id="history" class="history">Loading verified generation history…</div><p class="caption">Artwork metrics assess contrast and motif density, not beauty. Optimization, creative authoring and publication have separate gates. A rejected candidate does not replace the live game.</p></section>
<section class="receipt"><p class="eyebrow">04 / DEVELOPMENT FRONTIER</p><h2>Build. Measure. Keep what passes.</h2><p>Free source recipes now cover weapon recovery, sound resource budgets and adaptive resolution. New features enter with their own acceptance cases.</p><div id="experience-policy" class="metric"></div><div id="development-frontier" class="history"></div><p class="caption">Full Prism verification currently has an open artifact-regeneration failure. Finite kernel parity and browser tests pass independently. <a href="https://github.com/R4-Laboratories/uor-cs1.618/actions/workflows/proofs.yml">Proof audit ↗</a> · <a href="https://github.com/R4-Laboratories/uor-cs1.618/blob/main/docs/DEVELOPMENT-ENGINE.md">Mechanism and limits ↗</a></p></section><footer><span>ORIGINAL GEOMETRY. OPEN SOURCE. LIVING EXPERIMENT.</span><a href="https://github.com/R4-Laboratories/uor-cs1.618/blob/main/docs/SELF-IMPROVEMENT.md">How this works ↗</a></footer></main>`;
function paint(){for(const [id,site]of [['site-a','A'],['site-b','B']] as const){const canvas=document.querySelector<HTMLCanvasElement>('#'+id)!,ctx=canvas.getContext('2d')!;const original=document.querySelector<HTMLInputElement>('#original')!.checked||!artProgram.shapes.length;if(original){ctx.fillStyle='#afa58b';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.fillStyle='#3c4946';ctx.font='28px monospace';ctx.fillText('ORIGINAL WALL / NO PROCEDURAL MURAL',50,canvas.height/2);}else paintArtwork(ctx,site,artProgram);}}
document.querySelector('#original')!.addEventListener('change',paint);paint();
document.querySelector('#tactics')!.textContent=JSON.stringify(tacticsProgram,null,2);document.querySelector('#tactic-count')!.textContent=`${tacticsProgram.rules.length} compiled rules · local facts only`;
document.querySelector('#download')!.addEventListener('click',()=>{const url=URL.createObjectURL(new Blob([JSON.stringify({art:artProgram,tactics:tacticsProgram},null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='cs1618-creative-programs.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
try{const response=await fetch('./evolution.json');if(!response.ok)throw Error('record unavailable');const state=await response.json();document.querySelector('#generation')!.textContent=`GENERATION ${state.generation}`;const list=document.querySelector('#history')!;list.replaceChildren();for(const row of state.history.slice(-6).reverse()){const article=document.createElement('article');const title=document.createElement('h3');title.textContent=`${row.result==='admitted'?'Admitted':'Evaluated'} / generation ${row.generation}`;const detail=document.createElement('p');detail.textContent=row.proposals.map((p:any)=>`${p.candidate}: ${Number(p.baselineWork).toFixed(2)} → ${Number(p.candidateWork).toFixed(2)} · ${p.author??'optimizer'}`).join(' | ');const time=document.createElement('small');time.textContent=new Date(row.at).toISOString()+' · '+row.checks;article.append(title,detail,time);list.append(article);}}catch{document.querySelector('#generation')!.textContent='RECORD UNAVAILABLE';document.querySelector('#history')!.textContent='The generation record could not be loaded. Recipes shown above are bundled with this build.';}
Object.assign(window,{creativeStudio:{art:artProgram,tactics:tacticsProgram}});

document.querySelector('#experience-policy')!.textContent=`${experiencePolicy.recoveryMs} ms burst reset · ${experiencePolicy.voices} audio voices · adaptive render budget`;
for(const feature of backlog.features){const row=document.createElement('article'),title=document.createElement('b'),body=document.createElement('p');title.textContent=feature.goal;body.textContent=feature.status==='implemented'?'Implemented · '+feature.acceptance:'Next · '+feature.acceptance;row.append(title,body);document.querySelector('#development-frontier')!.append(row);}

const inspector = document.getElementById('material-inspector')!;
void import('./material-inspector').then(module => module.openInspector(inspector)).catch(error => {
 inspector.dataset.state = 'unavailable';
 inspector.querySelector('[role=status]')!.textContent = 'Material previews unavailable. Reload with WebGL 2 enabled to retry.';
 console.error('Material inspector failed', error);
});
