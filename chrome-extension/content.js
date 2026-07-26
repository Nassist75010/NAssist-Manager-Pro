(() => {
  if (window.__nassistExtensionLoaded) return;
  window.__nassistExtensionLoaded = true;

  const KEY = 'nassist-extension-state-v1';
  const state = Object.assign({ compact:false, expert:false, historyOpen:true, panel:{right:14,top:110}, camera:{right:390,top:150}, history:[] }, JSON.parse(localStorage.getItem(KEY)||'{}'));
  let stream = null, scanTimer = null, detector = null;

  const save = () => localStorage.setItem(KEY, JSON.stringify(state));
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const root = document.createElement('div'); root.id='na-root';
  root.style.right=(state.panel.right??14)+'px'; root.style.top=(state.panel.top??110)+'px';
  root.innerHTML = `<section class="na-panel ${state.compact?'compact':''}">
    <header class="na-head"><span>📌</span><span class="na-title">N’ASSIST SERVICEBAG</span><button class="na-iconbtn" data-act="mode" title="Mode compact/expert">${state.expert?'E':'C'}</button><button class="na-iconbtn" data-act="min">−</button><button class="na-iconbtn" data-act="close">×</button></header>
    <div class="na-body">
      <div class="na-status"><div class="na-chip">ServiceBag : <b class="na-green">ACTIF</b></div><div class="na-chip">Analyse : <b class="na-orange" id="na-risk">EN ATTENTE</b></div></div>
      <input id="na-ticket" class="na-input" inputmode="numeric" maxlength="8" placeholder="N° ticket (8 chiffres)">
      <div class="na-row"><button class="na-btn" data-act="send">Envoyer</button><button class="na-btn secondary" data-act="camera">📷 Caméra</button></div>
      <label class="na-check"><input id="na-auto" type="checkbox"> Clôture automatique uniquement sans dépassement</label>
      <div id="na-advice" class="na-advice">Prêt. F8 ouvre le scanner, Entrée envoie le numéro.</div>
      <div class="na-history-head"><b>Historique</b><button class="na-iconbtn" data-act="history">${state.historyOpen?'Masquer':'Afficher'}</button></div>
      <div id="na-history" class="na-history ${state.historyOpen?'':'hidden'}"></div>
      <div class="na-row"><button class="na-btn secondary" data-act="csv">Exporter CSV</button><button class="na-btn danger" data-act="clear">Effacer</button></div>
    </div></section>`;
  document.documentElement.appendChild(root);

  const camera = document.createElement('div'); camera.className='na-camera na-hidden';
  camera.style.right=(state.camera.right??390)+'px'; camera.style.top=(state.camera.top??150)+'px';
  camera.innerHTML=`<div class="na-camera-head"><b style="flex:1">📷 Scanner le numéro imprimé</b><button class="na-iconbtn" data-cam="min">−</button><button class="na-iconbtn" data-cam="close">×</button></div><video autoplay playsinline muted></video><div class="na-camera-foot"><div class="na-camera-status">Caméra prête. Présentez le ticket bien à plat.</div><div class="na-row"><button class="na-btn" data-cam="read">Lire maintenant</button><button class="na-btn secondary" data-cam="close">Fermer</button></div></div>`;
  document.documentElement.appendChild(camera);

  const q = s => root.querySelector(s), cq = s => camera.querySelector(s), input=q('#na-ticket'), advice=q('#na-advice'), risk=q('#na-risk');
  function historyRender(){ q('#na-history').innerHTML=(state.history||[]).slice(0,40).map(x=>`<div class="na-entry">${esc(x.time)} — ${esc(x.ticket)} — ${esc(x.status)}</div>`).join('')||'<div class="na-entry">Aucune opération</div>'; }
  function log(ticket,status){ state.history=[{time:new Date().toLocaleString('fr-FR'),ticket,status},...(state.history||[])].slice(0,200); save(); historyRender(); }
  function beep(){ try{ const a=new AudioContext(),o=a.createOscillator(),g=a.createGain();o.frequency.value=880;g.gain.value=.08;o.connect(g);g.connect(a.destination);o.start();o.stop(a.currentTime+.11);}catch{} }
  function pageAssessment(){ const t=document.body.innerText.toLowerCase(); const amount=/\b\d{1,3}(?:[ .]\d{3})*(?:,\d{2})?\s*€/.test(t); const over=/dépassement|hors délai|supplément|montant dû|paiement/.test(t); const anomaly=/erreur|anomalie|bloqué|impossible/.test(t); if(over||amount){risk.textContent='BLOQUÉ';risk.className='na-orange';advice.textContent='⚠️ Dépassement ou paiement détecté : validation automatique interdite. Vérification humaine obligatoire.';return 'DÉPASSEMENT/PAYMENT BLOQUÉ';} if(anomaly){risk.textContent='ANOMALIE';advice.textContent='⚠️ Anomalie détectée sur la page. Contrôlez les informations avant toute action.';return 'ANOMALIE';} risk.textContent='RAS';risk.className='na-green';advice.textContent='✅ Aucun signal de dépassement détecté. La validation reste manuelle.';return 'RAS'; }
  function findServiceBagInput(){ const candidates=[...document.querySelectorAll('input')]; return candidates.find(el=>/prestation|ticket|consigne|n°|numero|numéro/i.test(`${el.placeholder||''} ${el.name||''} ${el.getAttribute('aria-label')||''}`))||candidates.find(el=>el.type==='text'&&el.offsetParent); }
  function send(){ const ticket=input.value.replace(/\D/g,'').slice(0,8); if(ticket.length!==8){advice.textContent='Saisissez un numéro de 8 chiffres.';return;} const target=findServiceBagInput(); if(!target){advice.textContent='Champ ServiceBag introuvable. Ouvrez la page de retrait puis réessayez.';log(ticket,'CHAMP INTROUVABLE');return;} target.focus(); target.value=ticket; target.dispatchEvent(new Event('input',{bubbles:true})); target.dispatchEvent(new Event('change',{bubbles:true})); const status=pageAssessment(); log(ticket,'NUMÉRO ENVOYÉ — '+status); advice.textContent='Numéro transmis à ServiceBag. Vérifiez la fiche puis validez manuellement.'; }
  function acceptTicket(value){ const m=String(value).match(/\b\d{8}\b/); if(!m)return false; input.value=m[0]; beep(); log(m[0],'NUMÉRO LU'); advice.textContent='🔔 Ticket reconnu : '+m[0]+'. Appuyez sur Entrée pour envoyer.'; closeCamera(); return true; }
  async function readFrame(){ const video=cq('video'); if(!video.videoWidth)return; if('TextDetector' in window){ try{ detector ||= new TextDetector(); const texts=await detector.detect(video); const joined=texts.map(x=>x.rawValue).join(' '); if(!acceptTicket(joined)) cq('.na-camera-status').textContent='Aucun numéro à 8 chiffres détecté. Rapprochez le ticket.'; }catch(e){cq('.na-camera-status').textContent='Lecture impossible : '+e.message;} } else { cq('.na-camera-status').textContent='OCR natif indisponible sur ce Chrome. La saisie manuelle reste active.'; }
  }
  async function openCamera(){ camera.classList.remove('na-hidden'); try{ stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment',width:{ideal:640},height:{ideal:480}},audio:false}); cq('video').srcObject=stream; cq('.na-camera-status').textContent='Caméra prête. Lecture automatique en cours…'; clearInterval(scanTimer); scanTimer=setInterval(readFrame,900); }catch(e){cq('.na-camera-status').textContent='Accès caméra refusé : '+e.message;} }
  function closeCamera(){ clearInterval(scanTimer);scanTimer=null;if(stream){stream.getTracks().forEach(t=>t.stop());stream=null;}camera.classList.add('na-hidden'); }
  function drag(handle,box,key){ let sx,sy,sr,st; handle.addEventListener('pointerdown',e=>{if(e.target.tagName==='BUTTON')return;sx=e.clientX;sy=e.clientY;sr=parseFloat(box.style.right)||0;st=parseFloat(box.style.top)||0;handle.setPointerCapture(e.pointerId);});handle.addEventListener('pointermove',e=>{if(!handle.hasPointerCapture(e.pointerId))return;box.style.right=Math.max(0,sr-(e.clientX-sx))+'px';box.style.top=Math.max(0,st+(e.clientY-sy))+'px';});handle.addEventListener('pointerup',e=>{if(!handle.hasPointerCapture(e.pointerId))return;handle.releasePointerCapture(e.pointerId);state[key]={right:parseFloat(box.style.right)||0,top:parseFloat(box.style.top)||0};save();}); }
  drag(q('.na-head'),root,'panel'); drag(cq('.na-camera-head'),camera,'camera');

  root.addEventListener('click',e=>{const a=e.target.dataset.act;if(!a)return;if(a==='min'){state.compact=!state.compact;q('.na-panel').classList.toggle('compact',state.compact);save();}if(a==='close')root.classList.add('na-hidden');if(a==='mode'){state.expert=!state.expert;e.target.textContent=state.expert?'E':'C';advice.textContent=state.expert?'Mode expert : historique et analyse détaillée actifs.':'Mode compact actif.';save();}if(a==='camera')openCamera();if(a==='send')send();if(a==='history'){state.historyOpen=!state.historyOpen;q('#na-history').classList.toggle('hidden',!state.historyOpen);e.target.textContent=state.historyOpen?'Masquer':'Afficher';save();}if(a==='clear'){state.history=[];save();historyRender();}if(a==='csv'){const rows=['Date;Ticket;Statut',...(state.history||[]).map(x=>`${x.time};${x.ticket};${x.status}`)];const u=URL.createObjectURL(new Blob([rows.join('\n')],{type:'text/csv'}));const l=document.createElement('a');l.href=u;l.download='nassist-historique.csv';l.click();URL.revokeObjectURL(u);}});
  camera.addEventListener('click',e=>{const a=e.target.dataset.cam;if(a==='close')closeCamera();if(a==='min')camera.classList.toggle('na-hidden');if(a==='read')readFrame();});
  input.addEventListener('input',()=>input.value=input.value.replace(/\D/g,'').slice(0,8));
  document.addEventListener('keydown',e=>{if(e.key==='F8'){e.preventDefault();openCamera();}if(e.key==='Enter'&&!camera.contains(document.activeElement)){send();}});
  new MutationObserver(()=>pageAssessment()).observe(document.body,{childList:true,subtree:true});
  historyRender(); pageAssessment();
})();
