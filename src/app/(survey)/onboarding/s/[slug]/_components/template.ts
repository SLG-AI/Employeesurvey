// Auto-generated from SLG_Guide_Onboarding_Manager_SharePoint_2.html.
// Inline onclick handlers and the Reset button have been stripped — React attaches
// its own event delegation after mount.
export const GUIDE_HTML = `<style>
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    :root{
      --slg-blue:#547d93;--slg-blue-dark:#3a5a6b;--slg-blue-light:#dce8ef;--slg-blue-xlight:#eef5f9;
      --slg-green:#93c01f;--slg-green-dark:#3a6200;--slg-green-light:#eaf3d0;
      --purple-light:#f0eafe;--purple:#6c4fcf;
      --amber-light:#fdf3e0;--amber:#b87a00;


      --text-primary:#1a1a1a;--text-secondary:#555;--text-muted:#888;
      --border:#e2e2e2;--bg-page:#f4f6f8;--bg-card:#fff;--bg-secondary:#f8f9fa;
      --radius-md:8px;--radius-lg:12px;
      --shadow-sm:0 1px 3px rgba(0,0,0,0.08);
    }
    body{font-family:Calibri,'Segoe UI',Arial,sans-serif;font-size:15px;color:var(--text-primary);background:var(--bg-page);padding:0 0 3rem}
    /* HEADER */
    .page-header{background:var(--slg-blue);padding:1.5rem 2rem;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:1rem}
    .logo-block{display:flex;align-items:center;gap:12px}
    .logo-square{width:46px;height:46px;background:rgba(255,255,255,0.15);border-radius:var(--radius-md);display:flex;align-items:center;justify-content:center;position:relative;border:1px solid rgba(255,255,255,0.25);flex-shrink:0}
    .logo-square span{color:white;font-weight:700;font-size:16px}
    .logo-dot{position:absolute;top:5px;right:5px;width:9px;height:9px;background:var(--slg-green);border-radius:2px}
    .logo-info{color:white}
    .logo-info .company{font-size:16px;font-weight:600}
    .logo-info .tagline{font-size:11px;opacity:0.7;margin-top:2px}
    .header-right{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
    .header-titles{text-align:right;color:white}
    .header-titles .guide-title{font-size:18px;font-weight:600}
    .header-titles .guide-sub{font-size:11px;opacity:0.65;margin-top:3px}
    .lang-toggle{display:flex;border-radius:99px;overflow:hidden;border:1.5px solid rgba(255,255,255,0.4);flex-shrink:0}
    .lang-btn{padding:5px 13px;font-family:inherit;font-size:13px;font-weight:600;cursor:pointer;border:none;background:transparent;color:rgba(255,255,255,0.6);transition:all 0.15s;letter-spacing:0.04em}
    .lang-btn.active{background:white;color:var(--slg-blue)}
    /* CONTAINER */
    .container{max-width:880px;margin:0 auto;padding:0 1.5rem}
    /* INTRO BOX */
    .guide-intro{background:white;border:1px solid var(--border);border-radius:var(--radius-lg);padding:1.25rem 1.5rem;margin:1.5rem 0 1rem;box-shadow:var(--shadow-sm)}
    .guide-intro h2{font-size:14px;font-weight:600;color:var(--slg-blue);margin-bottom:8px}
    .guide-intro p{font-size:13px;color:var(--text-secondary);line-height:1.6;margin-bottom:6px}
    .guide-intro p:last-child{margin-bottom:0}
    .scope-list{margin:6px 0 0 16px;font-size:13px;color:var(--text-secondary);line-height:1.8}
    /* PROGRESS */
    .progress-section{background:white;border:1px solid var(--border);border-radius:var(--radius-lg);padding:1.1rem 1.5rem;margin-bottom:1rem;box-shadow:var(--shadow-sm)}
    .progress-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}
    .progress-top .label{font-size:13px;color:var(--text-secondary);font-weight:500}
    .progress-top .count{font-size:13px;font-weight:700;color:var(--slg-green-dark)}
    .progress-track{height:7px;background:#e8ede5;border-radius:99px;overflow:hidden}
    .progress-fill{height:100%;background:var(--slg-green);border-radius:99px;transition:width 0.4s cubic-bezier(0.4,0,0.2,1)}
    .progress-phases{display:flex;gap:5px;margin-top:9px;flex-wrap:wrap}
    .phase-pill{font-size:11px;padding:2px 9px;border-radius:99px;border:1px solid var(--border);color:var(--text-muted);background:var(--bg-secondary);cursor:default}
    .phase-pill.complete{background:var(--slg-green-light);border-color:#b5d97a;color:var(--slg-green-dark);font-weight:600}
    /* LEGEND */
    .legend{display:flex;gap:14px;flex-wrap:wrap;padding:10px 14px;background:white;border:1px solid var(--border);border-radius:var(--radius-md);margin-bottom:1rem;box-shadow:var(--shadow-sm);align-items:center}
    .legend-title{font-size:12px;color:var(--text-muted);font-weight:600}
    .legend-item{display:flex;align-items:center;gap:5px;font-size:12px;color:var(--text-secondary)}
    /* TABS */
    .tabs-wrap{background:white;border:1px solid var(--border);border-radius:var(--radius-lg);overflow:hidden;box-shadow:var(--shadow-sm);margin-bottom:1.25rem;display:flex;overflow-x:auto}
    .tab-btn{flex-shrink:0;padding:11px 10px;font-family:inherit;font-size:11.5px;font-weight:500;color:var(--text-secondary);background:none;border:none;cursor:pointer;border-right:1px solid var(--border);transition:background 0.15s,color 0.15s;text-align:center;line-height:1.3;min-width:80px}
    .tab-btn:last-child{border-right:none}
    .tab-btn:hover{background:var(--bg-secondary);color:var(--slg-blue)}
    .tab-btn.active{background:var(--slg-blue-xlight);color:var(--slg-blue);border-bottom:3px solid var(--slg-blue)}
    .tab-btn .tab-dates{font-size:10px;font-weight:400;opacity:0.65;display:block;margin-top:2px}
    /* PANELS */
    .phase-panel{display:none}
    .phase-panel.active{display:block}
    .phase-intro{font-size:13px;color:var(--text-secondary);background:var(--slg-blue-xlight);border-left:4px solid var(--slg-blue);border-radius:0 var(--radius-md) var(--radius-md) 0;padding:11px 15px;margin-bottom:1.1rem;line-height:1.6}
    .phase-intro.green{background:var(--slg-green-light);border-left-color:var(--slg-green)}
    .phase-intro.purple{background:var(--purple-light);border-left-color:var(--purple)}
    .phase-intro.amber{background:var(--amber-light);border-left-color:var(--amber)}
    /* SECTION LABEL */
    .section-label{font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:var(--text-muted);margin:1.1rem 0 7px}
    /* CARDS */
    .checklist-card{background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg);overflow:hidden;margin-bottom:11px;box-shadow:var(--shadow-sm)}
    .card-header{padding:10px 15px;display:flex;align-items:center;gap:9px;border-bottom:1px solid var(--border);background:var(--bg-secondary)}
    .card-icon{width:26px;height:26px;border-radius:6px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
    .card-icon svg{width:14px;height:14px}
    .card-title{font-size:13.5px;font-weight:600;flex:1;color:var(--text-primary)}
    .card-count{font-size:12px;color:var(--text-muted)}
    .card-count.done{color:var(--slg-green-dark);font-weight:700}
    /* CHECK ITEMS */
    .check-item{display:flex;align-items:flex-start;gap:11px;padding:10px 15px;cursor:pointer;border-bottom:1px solid var(--border);transition:background 0.12s;user-select:none}
    .check-item:last-child{border-bottom:none}
    .check-item:hover{background:#f7fafc}
    .check-item.checked{background:#fafafa}
    .check-item.checked .check-text{text-decoration:line-through;color:var(--text-muted)}
    .checkbox{width:18px;height:18px;flex-shrink:0;border:2px solid #ccc;border-radius:4px;margin-top:1px;display:flex;align-items:center;justify-content:center;transition:all 0.15s;background:white}
    .check-item.checked .checkbox{background:var(--slg-green);border-color:var(--slg-green)}
    .checkmark{display:none}
    .check-item.checked .checkmark{display:block}
    .check-text{font-size:13.5px;line-height:1.5;flex:1}
    /* TAGS */
    .tag{font-size:11px;padding:2px 8px;border-radius:99px;font-weight:600;flex-shrink:0;align-self:center;margin-left:3px}
    .tag-rh{background:var(--slg-blue-light);color:var(--slg-blue-dark)}
    .tag-manager{background:var(--slg-green-light);color:var(--slg-green-dark)}
    .tag-n1{background:var(--purple-light);color:var(--purple)}
    .tag-it{background:#fff3e0;color:#b35a00;border:1px solid #f5c07a}
    .enhanced-badge{font-size:10px;font-weight:500;color:#b35a00;background:#fff3e0;border:1px solid #f5c07a;padding:1px 6px;border-radius:99px;margin-left:6px}
    /* STAKEHOLDER TAB */
    .stk-table{width:100%;border-collapse:collapse;font-size:13px;margin-bottom:1rem}
    .stk-table th{background:var(--slg-blue);color:white;padding:9px 12px;text-align:left;font-weight:600;font-size:12px}
    .stk-table td{padding:9px 12px;border-bottom:1px solid var(--border);vertical-align:top;line-height:1.5}
    .stk-table tr:hover td{background:var(--bg-secondary)}
    .stk-table tr:last-child td{border-bottom:none}
    .stk-table .input-cell input,.stk-table .input-cell textarea{width:100%;border:1px solid var(--border);border-radius:5px;padding:5px 8px;font-family:inherit;font-size:13px;background:white;resize:vertical;color:var(--text-primary)}
    .stk-table .input-cell input:focus,.stk-table .input-cell textarea:focus{outline:none;border-color:var(--slg-blue)}
    .stk-card{background:white;border:1px solid var(--border);border-radius:var(--radius-lg);overflow:hidden;margin-bottom:1rem;box-shadow:var(--shadow-sm)}
    .stk-card-hdr{background:var(--slg-blue);color:white;padding:10px 16px;font-weight:600;font-size:13px;display:flex;align-items:center;gap:8px}
    .stk-type-badge{font-size:10px;padding:2px 7px;border-radius:99px;background:rgba(255,255,255,0.2);font-weight:500}
    .add-row-btn{padding:7px 14px;border-radius:var(--radius-md);border:1px dashed var(--slg-blue);background:var(--slg-blue-xlight);color:var(--slg-blue);font-family:inherit;font-size:12px;font-weight:500;cursor:pointer;margin-top:8px;transition:background 0.15s}
    .add-row-btn:hover{background:var(--slg-blue-light)}
    .del-btn{padding:3px 8px;border-radius:4px;border:1px solid #fca5a5;background:#fff5f5;color:#991b1b;font-size:11px;cursor:pointer;font-family:inherit}
    /* GOVERNANCE TAB */
    .gov-intro{font-size:13px;color:var(--text-secondary);background:var(--amber-light);border-left:4px solid var(--amber);border-radius:0 var(--radius-md) var(--radius-md) 0;padding:11px 15px;margin-bottom:1.1rem;line-height:1.6}
    .gov-note{font-size:12px;font-style:italic;color:var(--text-muted);margin-bottom:1rem;padding:8px 12px;background:var(--bg-secondary);border-radius:var(--radius-md);border:1px solid var(--border)}
    .gov-table{width:100%;border-collapse:collapse;font-size:13px}
    .gov-table th{background:var(--slg-blue);color:white;padding:9px 14px;text-align:left;font-weight:600;font-size:12px;letter-spacing:0.03em}
    .gov-table td{padding:10px 14px;border-bottom:1px solid var(--border);vertical-align:top;line-height:1.5}
    .gov-table tr:nth-child(even) td{background:var(--slg-blue-xlight)}
    .gov-table tr:hover td{background:var(--slg-blue-light)}
    .gov-table tr:last-child td{border-bottom:none}
    .gov-forum{font-weight:600;color:var(--slg-blue-dark)}
    .gov-freq{color:var(--text-secondary);font-size:12px;white-space:nowrap}
    /* FOOTER */
    .page-footer{text-align:center;margin-top:2rem;font-size:12px;color:var(--text-muted)}
    .page-footer strong{color:var(--slg-blue)}
    @media print{body{background:white}.page-header{print-color-adjust:exact;-webkit-print-color-adjust:exact}.tabs-wrap{display:none}.phase-panel{display:block!important;page-break-before:always}.phase-panel:first-of-type{page-break-before:avoid}.checklist-card{break-inside:avoid}}
    @media(max-width:620px){.page-header{padding:1.1rem 1rem}.header-right{flex-direction:column;align-items:flex-end}.tab-btn{min-width:70px;font-size:10px;padding:9px 5px}}

    .health-cell{text-align:center;vertical-align:middle!important;padding:8px 6px!important}
    .health-picker{display:flex;flex-direction:column;gap:5px;align-items:center}
    .health-btn{width:32px;height:32px;border-radius:50%;border:2px solid transparent;cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center;transition:all 0.15s;background:transparent;opacity:0.3;line-height:1}
    .health-btn:hover{opacity:0.7;transform:scale(1.1)}
    .health-btn.selected{opacity:1;border-color:rgba(0,0,0,0.15);transform:scale(1.15);box-shadow:0 2px 6px rgba(0,0,0,0.15)}
    .health-btn.green.selected{background:#dcfce7}
    .health-btn.yellow.selected{background:#fef9c3}
    .health-btn.red.selected{background:#fee2e2}
  </style>
<header class="page-header">
  <div class="logo-block">
    <div class="logo-square"><span>SLG</span><div class="logo-dot"></div></div>
    <div class="logo-info">
      <div class="company">SLA</div>
      <div class="tagline">Driven by Tomorrow</div>
    </div>
  </div>
  <div class="header-right">
    <div class="header-titles">
      <div class="guide-title" data-fr="Guide d'intégration — Head of Customer Excellence" data-en="Onboarding Guide — Head of Customer Excellence">Guide d'intégration — Head of Customer Excellence</div>
      <div class="guide-sub" data-fr="Plan 90 jours · Ressources Humaines · Version 2 (ETD)" data-en="90-day plan · Human Resources · Version 2 (ETD)">Plan 90 jours · Ressources Humaines · Version 2 (ETD)</div>
    </div>
    <div class="lang-toggle">
      <button class="lang-btn active" id="btn-fr">FR</button>
      <button class="lang-btn" id="btn-en">EN</button>
    </div>
  </div>
</header>

<div class="container">

  <!-- INTRO -->
  <div class="guide-intro">
    <h2 data-fr="Objectif du guide" data-en="Purpose of this guide">Objectif du guide</h2>
    <p data-fr="Ce guide a pour objectif d'assurer que le Head of Customer Excellence est intégré de manière structurée, accompagnée et transparente. Il est conçu pour soutenir une transition fluide dans le rôle en garantissant une passation claire des sujets clés, en fixant des jalons importants et en permettant une gestion efficace des attentes dès le départ." data-en="The objective of this onboarding plan is to ensure that the Head of Customer Excellence is onboarded in a structured, guided, and transparent manner. It is designed to support a smooth transition into the role by ensuring a clear handover of key topics, setting important milestones, and enabling effective expectation management from the outset.">Ce guide a pour objectif d'assurer que le Head of Customer Excellence est intégré de manière structurée, accompagnée et transparente. Il est conçu pour soutenir une transition fluide dans le rôle en garantissant une passation claire des sujets clés, en fixant des jalons importants et en permettant une gestion efficace des attentes dès le départ.</p>
    <p style="font-size:12px;color:var(--text-muted);margin-top:6px" data-fr="Les responsabilités et jalons sont définis par le N+1, communiqués au nouveau manager et partagés avec l'équipe le cas échéant. À la fin de chaque phase, les objectifs sont revus et validés conjointement." data-en="Roles, ownership and milestones are set by the N+1, clearly communicated to the new manager, and shared transparently with the wider team where relevant. At the end of each phase, key milestones are reviewed and validated jointly.">Les responsabilités et jalons sont définis par le N+1, communiqués au nouveau manager et partagés avec l'équipe le cas échéant. À la fin de chaque phase, les objectifs sont revus et validés conjointement.</p>
  </div>

  <!-- PROGRESS -->
  <div class="progress-section">
    <div class="progress-top">
      <span class="label" data-fr="Progression globale" data-en="Overall progress">Progression globale</span>
      <span class="count" id="pct-label">0</span>
    </div>
    <div class="progress-track"><div class="progress-fill" id="pbar" style="width:0%"></div></div>
    <div class="progress-phases">
      <span class="phase-pill" id="pill-0" data-fr="Avant J+1" data-en="Before Day 1">Avant J+1</span>
      <span class="phase-pill" id="pill-1" data-fr="Semaine 1" data-en="Week 1">Semaine 1</span>
      <span class="phase-pill" id="pill-2" data-fr="Fondation J0–30" data-en="Foundation D0–30">Fondation J0–30</span>
      <span class="phase-pill" id="pill-3" data-fr="Leadership J30–60" data-en="Leadership D30–60">Leadership J30–60</span>
      <span class="phase-pill" id="pill-4" data-fr="Ownership J60–90" data-en="Ownership D60–90">Ownership J60–90</span>
    </div>
  </div>

  <!-- LEGEND -->
  <div class="legend">
    <span class="legend-title" data-fr="Responsable :" data-en="Owner:">Responsable :</span>
    <span class="legend-item"><span class="tag tag-rh" data-fr="RH" data-en="HR">RH</span> <span data-fr="Ressources Humaines" data-en="Human Resources">Ressources Humaines</span></span>
    <span class="legend-item"><span class="tag tag-n1">N+1</span> <span data-fr="Responsable hiérarchique" data-en="Line Manager">Responsable hiérarchique</span></span>
    <span class="legend-item"><span class="tag tag-manager" data-fr="Manager" data-en="Manager">Manager</span> <span data-fr="Nouveau manager" data-en="New Manager">Nouveau manager</span></span>
    <span class="legend-item"><span class="tag tag-it">IT</span> <span data-fr="Équipe IT" data-en="IT Team">Équipe IT</span></span>
    <span class="legend-item"> <span data-fr="Ajouté dans cette version" data-en="Added in this version">Ajouté dans cette version</span></span>
  </div>

  <!-- TABS -->
  <div class="tabs-wrap">
    <button class="tab-btn active"><span data-fr="Avant J+1" data-en="Before Day 1">Avant J+1</span><span class="tab-dates" data-fr="Pré-boarding" data-en="Pre-boarding">Pré-boarding</span></button>
    <button class="tab-btn"><span data-fr="Semaine 1" data-en="Week 1">Semaine 1</span><span class="tab-dates" data-fr="J+1 à J+7" data-en="D+1 to D+7">J+1 à J+7</span></button>
    <button class="tab-btn"><span data-fr="Fondation" data-en="Foundation">Fondation</span><span class="tab-dates" data-fr="J+8 à J+30" data-en="D+8 to D+30">J+8 à J+30</span></button>
    <button class="tab-btn"><span data-fr="Leadership" data-en="Leadership">Leadership</span><span class="tab-dates" data-fr="J+31 à J+60" data-en="D+31 to D+60">J+31 à J+60</span></button>
    <button class="tab-btn"><span data-fr="Ownership" data-en="Ownership">Ownership</span><span class="tab-dates" data-fr="J+61 à J+90" data-en="D+61 to D+90">J+61 à J+90</span></button>
    <button class="tab-btn"><span data-fr="Parties prenantes" data-en="Stakeholders">Parties prenantes</span><span class="tab-dates" data-fr="Cartographie" data-en="Mapping">Cartographie</span></button>
    <button class="tab-btn"><span data-fr="Gouvernance" data-en="Governance">Gouvernance</span><span class="tab-dates" data-fr="Réunions" data-en="Meetings">Réunions</span></button>
  </div>

  <!-- PHASE 0 — AVANT J+1 -->
  <div class="phase-panel active" id="phase-0">
    <div class="phase-intro" data-fr="Avant même le premier jour, plusieurs éléments doivent être en place pour garantir une arrivée fluide et professionnelle. Ces actions sont portées par les RH, l'IT et le N+1." data-en="Even before the first day, several elements must be in place to ensure a smooth and professional arrival. These actions are primarily led by HR, IT and the direct manager.">Avant même le premier jour, plusieurs éléments doivent être en place pour garantir une arrivée fluide et professionnelle. Ces actions sont portées par les RH, l'IT et le N+1.</div>
    <div class="section-label" data-fr="Administratif &amp; accès" data-en="Administrative &amp; access">Administratif &amp; accès</div>
    <div class="checklist-card" id="card-0-0">
      <div class="card-header">
        <div class="card-icon" style="background:var(--slg-blue-light)"><svg fill="none" stroke="#547d93" stroke-width="2" viewBox="0 0 24 24"><path d="M9 12h6M9 16h6M13 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9l-5-6z"/></svg></div>
        <span class="card-title"><span data-fr="Documents &amp; contrat" data-en="Documents &amp; contract">Documents &amp; contrat</span></span>
        <span class="card-count" id="cc-0-0"></span>
      </div>
      <div class="check-item"><div class="checkbox"><svg class="checkmark" width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1 4.5L4 7.5L10 1" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div><span class="check-text" data-fr="Contrat de travail signé et remis" data-en="Employment contract signed and handed over">Contrat de travail signé et remis</span><span class="tag tag-rh" data-fr="RH" data-en="HR">RH</span></div>
      <div class="check-item"><div class="checkbox"><svg class="checkmark" width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1 4.5L4 7.5L10 1" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div><span class="check-text" data-fr="Dossier administratif complet (RIB, domicile, diplômes)" data-en="Complete administrative file (bank details, address, diplomas)">Dossier administratif complet (RIB, domicile, diplômes)</span><span class="tag tag-rh" data-fr="RH" data-en="HR">RH</span></div>
      <div class="check-item"><div class="checkbox"><svg class="checkmark" width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1 4.5L4 7.5L10 1" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div><span class="check-text" data-fr="Visite médicale planifiée (médecine du travail)" data-en="Occupational health check scheduled">Visite médicale planifiée (médecine du travail)</span><span class="tag tag-rh" data-fr="RH" data-en="HR">RH</span></div>
      <div class="check-item"><div class="checkbox"><svg class="checkmark" width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1 4.5L4 7.5L10 1" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div><span class="check-text" data-fr="Accès informatiques créés (AD, messagerie, outils métier)" data-en="IT access created (AD, email, business tools)">Accès informatiques créés (AD, messagerie, outils métier)</span><span class="tag tag-it">IT</span></div>
      <div class="check-item"><div class="checkbox"><svg class="checkmark" width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1 4.5L4 7.5L10 1" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div><span class="check-text" data-fr="Badge d'accès et poste de travail attribués" data-en="Access badge and keys assigned">Badge d'accès et poste de travail attribués</span><span class="tag tag-rh" data-fr="RH" data-en="HR">RH</span></div>
      <div class="check-item"><div class="checkbox"><svg class="checkmark" width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1 4.5L4 7.5L10 1" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div><span class="check-text" data-fr="Ticket créé pour les accès IT" data-en="Ticket created for IT access">Ticket créé pour les accès IT</span><span class="tag tag-n1">N+1</span></div>
      <div class="check-item"><div class="checkbox"><svg class="checkmark" width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1 4.5L4 7.5L10 1" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div><span class="check-text" data-fr="Accès à tous les groupes, réunions, fichiers et outils pertinents" data-en="Access to all relevant groups, meetings, files and tools">Accès à tous les groupes, réunions, fichiers et outils pertinents</span><span class="tag tag-n1">N+1</span></div>
      <div class="check-item"><div class="checkbox"><svg class="checkmark" width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1 4.5L4 7.5L10 1" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div><span class="check-text" data-fr="Matériel informatique (laptop, téléphone) et poste configurés sur site pour le premier jour" data-en="Hardware (laptop, phone) and workstation set up on site for first day">Matériel informatique (laptop, téléphone) et poste configurés sur site pour le premier jour</span><span class="tag tag-it">IT</span></div>
    </div>
    <div class="section-label" data-fr="Coordination N+1 &amp; équipe" data-en="N+1 &amp; team coordination">Coordination N+1 &amp; équipe</div>
    <div class="checklist-card" id="card-0-1">
      <div class="card-header">
        <div class="card-icon" style="background:var(--purple-light)"><svg fill="none" stroke="#6c4fcf" stroke-width="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75M9 7a4 4 0 110 8 4 4 0 010-8z"/></svg></div>
        <span class="card-title"><span data-fr="Préparation de l'accueil" data-en="Welcome preparation">Préparation de l'accueil</span></span>
        <span class="card-count" id="cc-0-1"></span>
      </div>
      <div class="check-item"><div class="checkbox"><svg class="checkmark" width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1 4.5L4 7.5L10 1" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div><span class="check-text" data-fr="Annonce officielle de l'arrivée transmise à l'équipe" data-en="Official announcement of arrival sent to the team">Annonce officielle de l'arrivée transmise à l'équipe</span><span class="tag tag-n1">N+1</span></div>
      <div class="check-item"><div class="checkbox"><svg class="checkmark" width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1 4.5L4 7.5L10 1" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div><span class="check-text" data-fr="Programme des 3 premiers jours préparé et partagé" data-en="First 3-day programme prepared and shared">Programme des 3 premiers jours préparé et partagé</span><span class="tag tag-n1">N+1</span></div>
      <div class="check-item"><div class="checkbox"><svg class="checkmark" width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1 4.5L4 7.5L10 1" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div><span class="check-text" data-fr="Mentor / référent interne identifié et briefé (avec support RH)" data-en="Internal mentor / buddy identified and briefed, with support of HR">Mentor / référent interne identifié et briefé (avec support RH)</span><span class="tag tag-n1">N+1</span></div>
      <div class="check-item"><div class="checkbox"><svg class="checkmark" width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1 4.5L4 7.5L10 1" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div><span class="check-text" data-fr="Premier 1-to-1 N+1 planifié dans les 48h suivant l'arrivée" data-en="First 1-to-1 with N+1 scheduled within 48h of arrival">Premier 1-to-1 N+1 planifié dans les 48h suivant l'arrivée</span><span class="tag tag-n1">N+1</span></div>
      <div class="check-item"><div class="checkbox"><svg class="checkmark" width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1 4.5L4 7.5L10 1" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div><span class="check-text" data-fr="Déjeuner de bienvenue le Jour 1 planifié avec le N+1" data-en="Welcome lunch on Day 1 scheduled with N+1">Déjeuner de bienvenue le Jour 1 planifié avec le N+1</span><span class="tag tag-n1">N+1</span></div>
      <div class="check-item"><div class="checkbox"><svg class="checkmark" width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1 4.5L4 7.5L10 1" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div><span class="check-text" data-fr="Guide d'intégration prêt à être partagé en semaine 1" data-en="Onboarding guide ready to be shared in week 1">Guide d'intégration prêt à être partagé en semaine 1</span><span class="tag tag-n1">N+1</span></div>
      <div class="check-item"><div class="checkbox"><svg class="checkmark" width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1 4.5L4 7.5L10 1" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div><span class="check-text" data-fr="Compte Perdoo créé et accès configuré pour le nouveau manager" data-en="Perdoo account created and access configured for the new manager">Compte Perdoo créé et accès configuré pour le nouveau manager</span><span class="tag tag-n1">N+1</span></div>
    </div>
  </div>

  <!-- PHASE 1 — SEMAINE 1 -->
  <div class="phase-panel" id="phase-1">
    <div class="phase-intro" data-fr="La première semaine est celle de l'observation, de l'écoute et de la prise de repères. Objectif : comprendre avant d'agir." data-en="The first week is about observation, listening and getting one's bearings. Goal: understand before acting.">La première semaine est celle de l'observation, de l'écoute et de la prise de repères. Objectif : comprendre avant d'agir.</div>
    <div class="section-label" data-fr="Immersion organisation &amp; terrain" data-en="Organisation &amp; field immersion">Immersion organisation &amp; terrain</div>
    <div class="checklist-card" id="card-1-0">
      <div class="card-header">
        <div class="card-icon" style="background:var(--slg-blue-light)"><svg fill="none" stroke="#547d93" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg></div>
        <span class="card-title"><span data-fr="Découverte &amp; immersion terrain" data-en="Discovery &amp; field immersion">Découverte &amp; immersion terrain</span></span>
        <span class="card-count" id="cc-1-0"></span>
      </div>
      <div class="check-item"><div class="checkbox"><svg class="checkmark" width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1 4.5L4 7.5L10 1" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div><span class="check-text" data-fr="Session de bienvenue RH (valeurs, règlement intérieur, avantages)" data-en="HR welcome session (values, internal rules, benefits)">Session de bienvenue RH (valeurs, règlement intérieur, avantages)</span><span class="tag tag-rh" data-fr="RH" data-en="HR">RH</span></div>
      <div class="check-item"><div class="checkbox"><svg class="checkmark" width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1 4.5L4 7.5L10 1" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div><span class="check-text" data-fr="Visite des sites et dépôts opérationnels SLG" data-en="Visit to SLG operational sites and depots">Visite des sites et dépôts opérationnels SLG</span><span class="tag tag-manager" data-fr="Manager" data-en="Manager">Manager</span></div>
      <div class="check-item"><div class="checkbox"><svg class="checkmark" width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1 4.5L4 7.5L10 1" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div><span class="check-text" data-fr="Accès aux documents clés remis (organigramme, procédures, KPIs)" data-en="Key documents provided (org chart, procedures, KPIs)">Accès aux documents clés remis (organigramme, procédures, KPIs)</span><span class="tag tag-rh" data-fr="RH" data-en="HR">RH</span></div>
      <div class="check-item"><div class="checkbox"><svg class="checkmark" width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1 4.5L4 7.5L10 1" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div><span class="check-text" data-fr="Présentation formelle à l'équipe (réunion dédiée, pas improvisée)" data-en="Formal introduction to the team (dedicated meeting, not improvised)">Présentation formelle à l'équipe (réunion dédiée, pas improvisée)</span><span class="tag tag-n1">N+1</span></div>
      <div class="check-item"><div class="checkbox"><svg class="checkmark" width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1 4.5L4 7.5L10 1" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div><span class="check-text" data-fr="Premier contact individuel amorcé avec chaque membre de l'équipe" data-en="First individual contact initiated with each team member">Premier contact individuel amorcé avec chaque membre de l'équipe</span><span class="tag tag-manager" data-fr="Manager" data-en="Manager">Manager</span></div>
      <div class="check-item"><div class="checkbox"><svg class="checkmark" width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1 4.5L4 7.5L10 1" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div><span class="check-text" data-fr="Cartographie initiale des parties prenantes clés réalisée" data-en="Initial key stakeholder mapping completed">Cartographie initiale des parties prenantes clés réalisée</span><span class="tag tag-manager" data-fr="Manager" data-en="Manager">Manager</span></div>
      <div class="check-item"><div class="checkbox"><svg class="checkmark" width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1 4.5L4 7.5L10 1" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div><span class="check-text" data-fr="Documents clés pour la compréhension du business fournis" data-en="Key documents for business relevance provided">Documents clés pour la compréhension du business fournis</span><span class="tag tag-n1">N+1</span></div>
      <div class="check-item"><div class="checkbox"><svg class="checkmark" width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1 4.5L4 7.5L10 1" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div><span class="check-text" data-fr="Introductions aux parties prenantes internes clés effectuées" data-en="Key internal stakeholder introductions completed">Introductions aux parties prenantes internes clés effectuées</span><span class="tag tag-manager" data-fr="Manager" data-en="Manager">Manager</span></div>
      <div class="check-item"><div class="checkbox"><svg class="checkmark" width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1 4.5L4 7.5L10 1" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div><span class="check-text" data-fr="Réunions hebdomadaires de passation avec le prédécesseur planifiées pour les 60 premiers jours" data-en="Set up weekly handover meetings with predecessor for the first 60 days">Réunions hebdomadaires de passation avec le prédécesseur planifiées pour les 60 premiers jours</span><span class="tag tag-manager" data-fr="Manager" data-en="Manager">Manager</span></div>
    </div>
    <div class="section-label" data-fr="Clarification du rôle &amp; des attentes" data-en="Role &amp; expectations clarification">Clarification du rôle &amp; des attentes</div>
    <div class="checklist-card" id="card-1-1">
      <div class="card-header">
        <div class="card-icon" style="background:var(--slg-green-light)"><svg fill="none" stroke="#3a6200" stroke-width="2" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></div>
        <span class="card-title"><span data-fr="Périmètre &amp; marges de manœuvre" data-en="Scope &amp; decision authority">Périmètre &amp; marges de manœuvre</span></span>
        <span class="card-count" id="cc-1-1"></span>
      </div>
      <div class="check-item"><div class="checkbox"><svg class="checkmark" width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1 4.5L4 7.5L10 1" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div><span class="check-text" data-fr="Objectifs à 30 / 60 / 90 jours formalisés avec le N+1" data-en="30 / 60 / 90-day objectives formalised with N+1">Objectifs à 30 / 60 / 90 jours formalisés avec le N+1</span><span class="tag tag-n1">N+1</span></div>
      <div class="check-item"><div class="checkbox"><svg class="checkmark" width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1 4.5L4 7.5L10 1" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div><span class="check-text" data-fr="Délégations décisionnelles clarifiées (budget, recrutement, gestion RH)" data-en="Decision authority clarified (budget, recruitment, HR management)">Délégations décisionnelles clarifiées (budget, recrutement, gestion RH)</span><span class="tag tag-n1">N+1</span></div>
      <div class="check-item"><div class="checkbox"><svg class="checkmark" width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1 4.5L4 7.5L10 1" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div><span class="check-text" data-fr="Processus de reporting et cadence de réunions discutés avec le N+1" data-en="Reporting process and meeting cadence discussed with N+1">Processus de reporting et cadence de réunions discutés avec le N+1</span><span class="tag tag-manager" data-fr="Manager" data-en="Manager">Manager</span></div>
    </div>
  </div>

  <!-- PHASE 2 — FONDATION -->
  <div class="phase-panel" id="phase-2">
    <div class="phase-intro green" data-fr="Phase de fondation : comprendre l'activité en profondeur, avoir rencontré toutes les parties prenantes pertinentes, organiser la passation, réaliser un diagnostic d'équipe et produire un premier livrable à J+30." data-en="Foundation phase: understand the activity in depth, have met all relevant stakeholders, organise the handover, carry out a team diagnosis and produce a first reading at D+30.">Phase de fondation : comprendre l'activité en profondeur, avoir rencontré toutes les parties prenantes pertinentes, organiser la passation, réaliser un diagnostic d'équipe et produire un premier livrable à J+30.</div>
    <div class="section-label" data-fr="Passation &amp; prise en main opérationnelle" data-en="Handover &amp; operational onboarding">Passation &amp; prise en main opérationnelle</div>
    <div class="checklist-card" id="card-2-0">
      <div class="card-header">
        <div class="card-icon" style="background:var(--slg-green-light)"><svg fill="none" stroke="#3a6200" stroke-width="2" viewBox="0 0 24 24"><path d="M16 17l5-5-5-5M8 7l-5 5 5 5M14 3l-4 18"/></svg></div>
        <span class="card-title"><span data-fr="Passation &amp; immersion active" data-en="Active handover &amp; immersion">Passation &amp; immersion active</span><span class="enhanced-badge" data-fr="Renforcé" data-en="Enhanced">Renforcé</span></span>
        <span class="card-count" id="cc-2-0"></span>
      </div>
      <div class="check-item"><div class="checkbox"><svg class="checkmark" width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1 4.5L4 7.5L10 1" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div><span class="check-text" data-fr="Passation structurée avec le prédécesseur ou l'expert métier (processus, outils, fichiers, flux inter-équipes) — chaque domaine validé par une production autonome" data-en="Structured handover with predecessor or subject-matter expert (processes, tools, files, inter-team flows) — each area validated by an independent output">Passation structurée avec le prédécesseur ou l'expert métier (processus, outils, fichiers, flux inter-équipes) — chaque domaine validé par une production autonome</span><span class="tag tag-manager" data-fr="Manager" data-en="Manager">Manager</span></div>
      <div class="check-item"><div class="checkbox"><svg class="checkmark" width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1 4.5L4 7.5L10 1" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div><span class="check-text" data-fr="Co-exécution supervisée d'un cycle opérationnel complet (shadow puis exécution accompagnée) avant prise d'autonomie" data-en="Supervised co-execution of a complete operational cycle (shadow then supported execution) before taking full ownership">Co-exécution supervisée d'un cycle opérationnel complet (shadow puis exécution accompagnée) avant prise d'autonomie</span><span class="tag tag-manager" data-fr="Manager" data-en="Manager">Manager</span></div>
      <div class="check-item"><div class="checkbox"><svg class="checkmark" width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1 4.5L4 7.5L10 1" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div><span class="check-text" data-fr="1-to-1 structurés avec chaque rapport direct (template : rôle, forces, difficultés, attentes, relation équipe)" data-en="Structured 1-to-1 with each direct report (template: role, strengths, challenges, expectations, team dynamics)">1-to-1 structurés avec chaque rapport direct (template : rôle, forces, difficultés, attentes, relation équipe)</span><span class="tag tag-manager" data-fr="Manager" data-en="Manager">Manager</span></div>
      <div class="check-item"><div class="checkbox"><svg class="checkmark" width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1 4.5L4 7.5L10 1" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div><span class="check-text" data-fr="Rencontres formelles avec les parties prenantes internes (pairs, fonctions support) et externes stratégiques" data-en="Formal meetings with internal (peers, support functions) and key external stakeholders">Rencontres formelles avec les parties prenantes internes (pairs, fonctions support) et externes stratégiques</span><span class="tag tag-manager" data-fr="Manager" data-en="Manager">Manager</span></div>
    </div>
    <div class="section-label" data-fr="Diagnostic équipe &amp; activité" data-en="Team &amp; activity diagnosis">Diagnostic équipe &amp; activité</div>
    <div class="checklist-card" id="card-2-1">
      <div class="card-header">
        <div class="card-icon" style="background:var(--slg-blue-light)"><svg fill="none" stroke="#547d93" stroke-width="2" viewBox="0 0 24 24"><path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg></div>
        <span class="card-title"><span data-fr="Analyse &amp; diagnostic" data-en="Analysis &amp; diagnosis">Analyse &amp; diagnostic</span></span>
        <span class="card-count" id="cc-2-1"></span>
      </div>
      <div class="check-item"><div class="checkbox"><svg class="checkmark" width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1 4.5L4 7.5L10 1" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div><span class="check-text" data-fr="Analyse des résultats et KPIs des 12 derniers mois réalisée" data-en="Analysis of last 12 months' results and KPIs completed">Analyse des résultats et KPIs des 12 derniers mois réalisée</span><span class="tag tag-manager" data-fr="Manager" data-en="Manager">Manager</span></div>
      <div class="check-item"><div class="checkbox"><svg class="checkmark" width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1 4.5L4 7.5L10 1" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div><span class="check-text" data-fr="Compréhension des tensions ou conflits existants dans l'équipe" data-en="Understanding of existing tensions or conflicts within the team">Compréhension des tensions ou conflits existants dans l'équipe</span><span class="tag tag-manager" data-fr="Manager" data-en="Manager">Manager</span></div>
      <div class="check-item"><div class="checkbox"><svg class="checkmark" width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1 4.5L4 7.5L10 1" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div><span class="check-text" data-fr="Identification des hauts potentiels et des profils fragilisés" data-en="Identification of high-potential profiles and at-risk employees">Identification des hauts potentiels et des profils fragilisés</span><span class="tag tag-manager" data-fr="Manager" data-en="Manager">Manager</span></div>
      <div class="check-item"><div class="checkbox"><svg class="checkmark" width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1 4.5L4 7.5L10 1" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div><span class="check-text" data-fr="Connaissance terrain acquise — immersion opérationnelle au dépôt ou sur le terrain" data-en="Field knowledge acquired — operational immersion at depot or on the ground">Connaissance terrain acquise — immersion opérationnelle au dépôt ou sur le terrain</span><span class="tag tag-manager" data-fr="Manager" data-en="Manager">Manager</span></div>
      <div class="check-item"><div class="checkbox"><svg class="checkmark" width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1 4.5L4 7.5L10 1" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div><span class="check-text" data-fr="Session de suivi avec le mentor / référent interne effectuée" data-en="Follow-up session with internal mentor / buddy completed">Session de suivi avec le mentor / référent interne effectuée</span><span class="tag tag-rh" data-fr="RH" data-en="HR">RH</span></div>
    </div>
    <div class="section-label" data-fr="Réseau interne" data-en="Internal network">Réseau interne</div>
    <div class="checklist-card" id="card-2-2">
      <div class="card-header">
        <div class="card-icon" style="background:var(--purple-light)"><svg fill="none" stroke="#6c4fcf" stroke-width="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75M9 7a4 4 0 110 8 4 4 0 010-8z"/></svg></div>
        <span class="card-title"><span data-fr="Réseau &amp; parties prenantes" data-en="Network &amp; stakeholders">Réseau &amp; parties prenantes</span></span>
        <span class="card-count" id="cc-2-2"></span>
      </div>
      <div class="check-item"><div class="checkbox"><svg class="checkmark" width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1 4.5L4 7.5L10 1" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div><span class="check-text" data-fr="Rencontres formelles effectuées avec tous les managers pairs" data-en="Formal meetings completed with all peer managers">Rencontres formelles effectuées avec tous les managers pairs</span><span class="tag tag-manager" data-fr="Manager" data-en="Manager">Manager</span></div>
      <div class="check-item"><div class="checkbox"><svg class="checkmark" width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1 4.5L4 7.5L10 1" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div><span class="check-text" data-fr="Relations établies avec les fonctions support (RH, Finance, IT, Exploitation)" data-en="Relationships established with support functions (HR, Finance, IT, Operations)">Relations établies avec les fonctions support (RH, Finance, IT, Exploitation)</span><span class="tag tag-manager" data-fr="Manager" data-en="Manager">Manager</span></div>
    </div>
    <div class="section-label" data-fr="Livrables J+30" data-en="D+30 deliverables">Livrables J+30</div>
    <div class="checklist-card" id="card-2-3">
      <div class="card-header">
        <div class="card-icon" style="background:var(--amber-light)"><svg fill="none" stroke="#b87a00" stroke-width="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></div>
        <span class="card-title"><span data-fr="Livrables &amp; décisions J+30" data-en="D+30 deliverables &amp; decisions">Livrables &amp; décisions J+30</span><span class="enhanced-badge" data-fr="Renforcé" data-en="Enhanced">Renforcé</span></span>
        <span class="card-count" id="cc-2-3"></span>
      </div>
      <div class="check-item"><div class="checkbox"><svg class="checkmark" width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1 4.5L4 7.5L10 1" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div><span class="check-text" data-fr="Livrable diagnostic remis au N+1 : analyse initiale de l'équipe (garder / développer / remplacer — hypothèse), risques opérationnels majeurs perçus, premières observations sur outils et processus clés" data-en="Diagnostic deliverable submitted to N+1: initial team assessment (keep / develop / replace — hypothesis), top perceived operational risks, first observations on key tools and processes">Livrable diagnostic remis au N+1 : analyse initiale de l'équipe (garder / développer / remplacer — hypothèse), risques opérationnels majeurs perçus, premières observations sur outils et processus clés</span><span class="tag tag-manager" data-fr="Manager" data-en="Manager">Manager</span></div>
      <div class="check-item"><div class="checkbox"><svg class="checkmark" width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1 4.5L4 7.5L10 1" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div><span class="check-text" data-fr="Décision sur la fréquence et planification des réunions d'équipe arrêtée et communiquée" data-en="Decision on team meeting frequency and schedule made and communicated">Décision sur la fréquence et planification des réunions d'équipe arrêtée et communiquée</span><span class="tag tag-manager" data-fr="Manager" data-en="Manager">Manager</span></div>
      <div class="check-item"><div class="checkbox"><svg class="checkmark" width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1 4.5L4 7.5L10 1" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div><span class="check-text" data-fr="Bilan intermédiaire J+30 réalisé avec RH et N+1 — baselines et objectifs ajustés si nécessaire" data-en="D+30 interim review completed with HR and N+1 — baselines and objectives adjusted if needed">Bilan intermédiaire J+30 réalisé avec RH et N+1 — baselines et objectifs ajustés si nécessaire</span><span class="tag tag-rh" data-fr="RH" data-en="HR">RH</span></div>
      <div class="check-item"><div class="checkbox"><svg class="checkmark" width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1 4.5L4 7.5L10 1" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div><span class="check-text" data-fr="Exécution d'un appel d'offres complet (sous supervision)" data-en="Execution of 1 tender (supervised)">Exécution d'un appel d'offres complet (sous supervision)</span><span class="tag tag-n1">N+1</span></div>
      <div class="check-item"><div class="checkbox"><svg class="checkmark" width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1 4.5L4 7.5L10 1" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div><span class="check-text" data-fr="Compréhension des besoins CRM et première ébauche des exigences" data-en="CRM understanding of needs and requirement draft">Compréhension des besoins CRM et première ébauche des exigences</span><span class="tag tag-n1">N+1</span></div>
    </div>
  </div>

  <!-- PHASE 3 — LEADERSHIP -->
  <div class="phase-panel" id="phase-3">
    <div class="phase-intro purple" data-fr="Phase de leadership : le manager monte en autonomie et prend les commandes. Le prédécesseur s'efface progressivement. L'enjeu est de décider — sur l'équipe et les priorités — et de réduire significativement l'intervention du N+1 dans les opérations quotidiennes." data-en="Leadership phase: the manager gains autonomy and takes charge. The predecessor gradually steps back. The key is to decide — on the team and priorities — and to significantly reduce the N+1's intervention in daily operations.">Phase de leadership : le manager monte en autonomie et prend les commandes. Le prédécesseur s'efface progressivement. L'enjeu est de décider — sur l'équipe et les priorités — et de réduire significativement l'intervention du N+1 dans les opérations quotidiennes.</div>
    <div class="section-label" data-fr="Montée en autonomie managériale" data-en="Building managerial autonomy">Montée en autonomie managériale</div>
    <div class="checklist-card" id="card-3-0">
      <div class="card-header">
        <div class="card-icon" style="background:var(--purple-light)"><svg fill="none" stroke="#6c4fcf" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg></div>
        <span class="card-title"><span data-fr="Autonomie &amp; décisions managériales" data-en="Autonomy &amp; managerial decisions">Autonomie &amp; décisions managériales</span><span class="enhanced-badge" data-fr="Renforcé" data-en="Enhanced">Renforcé</span></span>
        <span class="card-count" id="cc-3-0"></span>
      </div>
      <div class="check-item"><div class="checkbox"><svg class="checkmark" width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1 4.5L4 7.5L10 1" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div><span class="check-text" data-fr="Le nouveau manager pilote la fonction de manière quasi autonome — le soutien du prédécesseur est réduit au minimum et ne se substitue plus à la décision" data-en="The new manager leads the function almost independently — predecessor support is minimal and no longer substitutes for decision-making">Le nouveau manager pilote la fonction de manière quasi autonome — le soutien du prédécesseur est réduit au minimum et ne se substitue plus à la décision</span><span class="tag tag-manager" data-fr="Manager" data-en="Manager">Manager</span></div>
      <div class="check-item"><div class="checkbox"><svg class="checkmark" width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1 4.5L4 7.5L10 1" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div><span class="check-text" data-fr="Finalisation des décisions individuelles sur l'équipe et alignement avec le HRBP (garder, développer, remplacer — engagement écrit)" data-en="Individual team decisions finalised and aligned with HRBP (keep, develop, replace — written commitment)">Finalisation des décisions individuelles sur l'équipe et alignement avec le HRBP (garder, développer, remplacer — engagement écrit)</span><span class="tag tag-rh" data-fr="RH" data-en="HR">RH</span></div>
      <div class="check-item"><div class="checkbox"><svg class="checkmark" width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1 4.5L4 7.5L10 1" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div><span class="check-text" data-fr="Appropriation des objectifs de la fonction — déclinaison en OKRs d'équipe et communication lors d'une réunion stratégique dédiée" data-en="Full ownership of function objectives — broken down into team OKRs and communicated in a dedicated strategy meeting">Appropriation des objectifs de la fonction — déclinaison en OKRs d'équipe et communication lors d'une réunion stratégique dédiée</span><span class="tag tag-manager" data-fr="Manager" data-en="Manager">Manager</span></div>
    </div>
    <div class="section-label" data-fr="Point de mi-parcours" data-en="Mid-point review">Point de mi-parcours</div>
    <div class="checklist-card" id="card-3-1">
      <div class="card-header">
        <div class="card-icon" style="background:var(--slg-blue-light)"><svg fill="none" stroke="#547d93" stroke-width="2" viewBox="0 0 24 24"><path d="M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg></div>
        <span class="card-title"><span data-fr="Checkpoint J+60" data-en="D+60 Checkpoint">Checkpoint J+60</span></span>
        <span class="card-count" id="cc-3-1"></span>
      </div>
      <div class="check-item"><div class="checkbox"><svg class="checkmark" width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1 4.5L4 7.5L10 1" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div><span class="check-text" data-fr="Bilan J+60 réalisé avec RH et N+1 : validation de l'autonomie acquise, identification des ajustements nécessaires" data-en="D+60 review completed with HR and N+1: validation of autonomy acquired, identification of necessary adjustments">Bilan J+60 réalisé avec RH et N+1 : validation de l'autonomie acquise, identification des ajustements nécessaires</span><span class="tag tag-rh" data-fr="RH" data-en="HR">RH</span></div>
      <div class="check-item"><div class="checkbox"><svg class="checkmark" width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1 4.5L4 7.5L10 1" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div><span class="check-text" data-fr="Rituels managériaux en place et tenus à plus de 90% (réunions, 1-to-1, points de reporting)" data-en="Management rituals in place and held at more than 90% adherence rate (meetings, 1-to-1s, reporting sessions)">Rituels managériaux en place et tenus à plus de 90% (réunions, 1-to-1, points de reporting)</span><span class="tag tag-manager" data-fr="Manager" data-en="Manager">Manager</span></div>
      <div class="check-item"><div class="checkbox"><svg class="checkmark" width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1 4.5L4 7.5L10 1" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div><span class="check-text" data-fr="Checkpoint officiel J+60 réalisé avec le N+1" data-en="Official D+60 Checkpoint completed with N+1">Checkpoint officiel J+60 réalisé avec le N+1</span><span class="tag tag-n1">N+1</span></div>
    </div>
  </div>

  <!-- PHASE 4 — OWNERSHIP -->
  <div class="phase-panel" id="phase-4">
    <div class="phase-intro amber" data-fr="Phase d'ownership : le manager opère en pleine autonomie, livre des résultats, optimise l'existant et prépare la suite. Le bilan J+90 marque la clôture formelle de la période d'intégration." data-en="Ownership phase: the manager operates with full autonomy, delivers results, optimises existing processes and prepares for the future. The D+90 review marks the formal close of the onboarding period.">Phase d'ownership : le manager opère en pleine autonomie, livre des résultats, optimise l'existant et prépare la suite. Le bilan J+90 marque la clôture formelle de la période d'intégration.</div>
    <div class="section-label" data-fr="Autonomie opérationnelle" data-en="Operational autonomy">Autonomie opérationnelle</div>
    <div class="checklist-card" id="card-4-0">
      <div class="card-header">
        <div class="card-icon" style="background:var(--amber-light)"><svg fill="none" stroke="#b87a00" stroke-width="2" viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg></div>
        <span class="card-title"><span data-fr="Exécution autonome &amp; amélioration" data-en="Autonomous execution &amp; improvement">Exécution autonome &amp; amélioration</span><span class="enhanced-badge" data-fr="Renforcé" data-en="Enhanced">Renforcé</span></span>
        <span class="card-count" id="cc-4-0"></span>
      </div>
      <div class="check-item"><div class="checkbox"><svg class="checkmark" width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1 4.5L4 7.5L10 1" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div><span class="check-text" data-fr="Ownership complet des workflows administratifs et de la coordination des réclamations — sans dépendance au prédécesseur" data-en="Full ownership of administrative workflows and claims coordination — no dependency on predecessor">Ownership complet des workflows administratifs et de la coordination des réclamations — sans dépendance au prédécesseur</span><span class="tag tag-manager" data-fr="Manager" data-en="Manager">Manager</span></div>
      <div class="check-item"><div class="checkbox"><svg class="checkmark" width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1 4.5L4 7.5L10 1" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div><span class="check-text" data-fr="Livraison autonome d'un livrable ou d'un cycle opérationnel majeur, accepté par le N+1 sans retravail significatif" data-en="Autonomous delivery of a major operational deliverable or cycle, accepted by N+1 without significant rework">Livraison autonome d'un livrable ou d'un cycle opérationnel majeur, accepté par le N+1 sans retravail significatif</span><span class="tag tag-manager" data-fr="Manager" data-en="Manager">Manager</span></div>
      <div class="check-item"><div class="checkbox"><svg class="checkmark" width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1 4.5L4 7.5L10 1" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div><span class="check-text" data-fr="Identification des premières actions d'automatisation et optimisation des workflows pour déploiement au trimestre suivant" data-en="Identification of first automation and workflow optimisation actions for deployment in the next quarter">Identification des premières actions d'automatisation et optimisation des workflows pour déploiement au trimestre suivant</span><span class="tag tag-manager" data-fr="Manager" data-en="Manager">Manager</span></div>
      <div class="check-item"><div class="checkbox"><svg class="checkmark" width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1 4.5L4 7.5L10 1" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div><span class="check-text" data-fr="Pilotage des interfaces transversales inter-fonctions (planification, escalade, arbitrages, comptes rendus)" data-en="Management of cross-functional interfaces (planning, escalation, arbitration, reporting)">Pilotage des interfaces transversales inter-fonctions (planification, escalade, arbitrages, comptes rendus)</span><span class="tag tag-manager" data-fr="Manager" data-en="Manager">Manager</span></div>
      <div class="check-item"><div class="checkbox"><svg class="checkmark" width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1 4.5L4 7.5L10 1" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div><span class="check-text" data-fr="Premières améliorations de processus formalisées et soumises à validation du N+1 (réduction d'effort, réduction de risque d'erreur)" data-en="First process improvements formalised and submitted for N+1 validation (effort reduction, error risk reduction)">Premières améliorations de processus formalisées et soumises à validation du N+1 (réduction d'effort, réduction de risque d'erreur)</span><span class="tag tag-manager" data-fr="Manager" data-en="Manager">Manager</span></div>
      <div class="check-item"><div class="checkbox"><svg class="checkmark" width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1 4.5L4 7.5L10 1" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div><span class="check-text" data-fr="Plan d'implémentation CRM présenté au N+1" data-en="Present the CRM implementation plan to N+1">Plan d'implémentation CRM présenté au N+1</span><span class="tag tag-n1">N+1</span></div>
      <div class="check-item"><div class="checkbox"><svg class="checkmark" width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1 4.5L4 7.5L10 1" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div><span class="check-text" data-fr="Processus appel d'offres opérationnel de A à Z" data-en="Tender process operational from A to Z">Processus appel d'offres opérationnel de A à Z</span><span class="tag tag-n1">N+1</span></div>
    </div>
    <div class="section-label" data-fr="Équipe &amp; développement" data-en="Team &amp; development">Équipe &amp; développement</div>
    <div class="checklist-card" id="card-4-1">
      <div class="card-header">
        <div class="card-icon" style="background:var(--slg-green-light)"><svg fill="none" stroke="#3a6200" stroke-width="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75M9 7a4 4 0 110 8 4 4 0 010-8z"/></svg></div>
        <span class="card-title"><span data-fr="Équipe &amp; plan de développement" data-en="Team &amp; development plan">Équipe &amp; plan de développement</span></span>
        <span class="card-count" id="cc-4-1"></span>
      </div>
      <div class="check-item"><div class="checkbox"><svg class="checkmark" width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1 4.5L4 7.5L10 1" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div><span class="check-text" data-fr="Exécution du plan de formation lancée — actions en cours, processus de recrutement ou de remplacement initiés si nécessaire" data-en="Training plan execution launched — actions underway, recruitment or replacement processes initiated as needed">Exécution du plan de formation lancée — actions en cours, processus de recrutement ou de remplacement initiés si nécessaire</span><span class="tag tag-rh" data-fr="RH" data-en="HR">RH</span></div>
      <div class="check-item"><div class="checkbox"><svg class="checkmark" width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1 4.5L4 7.5L10 1" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div><span class="check-text" data-fr="Priorités d'action du semestre suivant définies (3 priorités) et partagées avec le N+1" data-en="Action priorities for the next semester defined (3 priorities) and shared with N+1">Priorités d'action du semestre suivant définies (3 priorités) et partagées avec le N+1</span><span class="tag tag-manager" data-fr="Manager" data-en="Manager">Manager</span></div>
      <div class="check-item"><div class="checkbox"><svg class="checkmark" width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1 4.5L4 7.5L10 1" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div><span class="check-text" data-fr="Entretiens individuels réguliers instaurés avec chaque membre de l'équipe" data-en="Regular individual reviews established with each team member">Entretiens individuels réguliers instaurés avec chaque membre de l'équipe</span><span class="tag tag-manager" data-fr="Manager" data-en="Manager">Manager</span></div>
      <div class="check-item"><div class="checkbox"><svg class="checkmark" width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1 4.5L4 7.5L10 1" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div><span class="check-text" data-fr="Rituels d'équipe consolidés et réguliers (point hebdo, rétrospective, partage de résultats)" data-en="Team rituals consolidated and regular (weekly check-in, retrospective, results sharing)">Rituels d'équipe consolidés et réguliers (point hebdo, rétrospective, partage de résultats)</span><span class="tag tag-manager" data-fr="Manager" data-en="Manager">Manager</span></div>
      <div class="check-item"><div class="checkbox"><svg class="checkmark" width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1 4.5L4 7.5L10 1" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div><span class="check-text" data-fr="Besoins de formation et de développement identifiés et remontés aux RH" data-en="Training and development needs identified and reported to HR">Besoins de formation et de développement identifiés et remontés aux RH</span><span class="tag tag-rh" data-fr="RH" data-en="HR">RH</span></div>
    </div>
    <div class="section-label" data-fr="Bilan J+90 &amp; suite" data-en="D+90 review &amp; next steps">Bilan J+90 &amp; suite</div>
    <div class="checklist-card" id="card-4-2">
      <div class="card-header">
        <div class="card-icon" style="background:var(--slg-blue-light)"><svg fill="none" stroke="#547d93" stroke-width="2" viewBox="0 0 24 24"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg></div>
        <span class="card-title"><span data-fr="Revue formelle J+90" data-en="Formal D+90 Review">Revue formelle J+90</span><span class="enhanced-badge" data-fr="Renforcé" data-en="Enhanced">Renforcé</span></span>
        <span class="card-count" id="cc-4-2"></span>
      </div>
      <div class="check-item"><div class="checkbox"><svg class="checkmark" width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1 4.5L4 7.5L10 1" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div><span class="check-text" data-fr="Point structuré J+90 planifié et réalisé — inclut un premier feedback 360° (équipe, pairs, N+1)" data-en="Structured D+90 review planned and completed — includes first 360° feedback (team, peers, N+1)">Point structuré J+90 planifié et réalisé — inclut un premier feedback 360° (équipe, pairs, N+1)</span><span class="tag tag-rh" data-fr="RH" data-en="HR">RH</span></div>
      <div class="check-item"><div class="checkbox"><svg class="checkmark" width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1 4.5L4 7.5L10 1" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div><span class="check-text" data-fr="Posture managériale stabilisée — légitimité perçue et reconnue par l'équipe et les pairs" data-en="Management posture established — authority perceived and recognised by the team and peers">Posture managériale stabilisée — légitimité perçue et reconnue par l'équipe et les pairs</span><span class="tag tag-manager" data-fr="Manager" data-en="Manager">Manager</span></div>
      <div class="check-item"><div class="checkbox"><svg class="checkmark" width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1 4.5L4 7.5L10 1" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div><span class="check-text" data-fr="Besoin de coaching ou de co-développement évalué avec les RH" data-en="Coaching or co-development needs assessed with HR">Besoin de coaching ou de co-développement évalué avec les RH</span><span class="tag tag-rh" data-fr="RH" data-en="HR">RH</span></div>
      <div class="check-item"><div class="checkbox"><svg class="checkmark" width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1 4.5L4 7.5L10 1" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div><span class="check-text" data-fr="Objectifs annuels posés et saisis dans l'outil de gestion de la performance" data-en="Annual objectives set and entered in the performance management tool">Objectifs annuels posés et saisis dans l'outil de gestion de la performance</span><span class="tag tag-rh" data-fr="RH" data-en="HR">RH</span></div>
    </div>
  </div>

  <!-- PHASE 5 — STAKEHOLDERS -->
  <div class="phase-panel" id="phase-5">
    <div class="phase-intro" data-fr="Cartographiez ici toutes les parties prenantes clés — internes et externes. Pour chacune, documentez le contact nommé, la santé de la relation, ce que le manager attend d'elle, et ce qu'elle attend du manager." data-en="Map all key stakeholders here — internal and external. For each, document the named contact, relationship health, what the manager needs from them, and what they need from the manager.">Cartographiez ici toutes les parties prenantes clés — internes et externes. Pour chacune, documentez le contact nommé, la santé de la relation, ce que le manager attend d'elle, et ce qu'elle attend du manager.</div>

    <div class="section-label" data-fr="Parties prenantes internes" data-en="Internal stakeholders">Parties prenantes internes</div>
    <div class="stk-card">
      <div class="stk-card-hdr">
        <svg width="14" height="14" fill="none" stroke="white" stroke-width="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75M9 7a4 4 0 110 8 4 4 0 010-8z"/></svg>
        <span data-fr="Internes" data-en="Internal">Internes</span>
        <span class="stk-type-badge" data-fr="Collègues & équipes" data-en="Colleagues & teams">Collègues & équipes</span>
      </div>
      <table class="stk-table" id="tbl-internal">
        <thead>
          <tr>
            <th style="width:18%" data-fr="Nom / Fonction" data-en="Name / Role">Nom / Fonction</th>
            <th style="width:14%" data-fr="Urgence à rencontrer" data-en="Priority to meet">Urgence à rencontrer</th>
            <th style="width:34%" data-fr="Ce que le manager attend" data-en="What the manager needs from them">Ce que le manager attend</th>
            <th style="width:30%" data-fr="Ce qu'ils attendent du manager" data-en="What they need from the manager">Ce qu'ils attendent du manager</th>
            <th style="width:4%"></th>
          </tr>
        </thead>
        <tbody id="body-internal">
          <tr>
            <td class="input-cell"><input type="text" placeholder="ex. Elena — CCO"/></td>
            <td class="health-cell"><div class="health-picker"><button type="button" class="health-btn green" title="Faible">🟢</button><button type="button" class="health-btn yellow" title="Modérée">🟡</button><button type="button" class="health-btn red" title="Élevée">🔴</button></div></td>
            <td class="input-cell"><textarea rows="2" placeholder="ex. Décisions rapides, alignement stratégique…"></textarea></td>
            <td class="input-cell"><textarea rows="2" placeholder="ex. Reporting hebdo, escalades documentées…"></textarea></td>
            <td><button class="del-btn">✕</button></td>
          </tr>
          <tr>
            <td class="input-cell"><input type="text" placeholder="ex. Tatyana — Business Excellence"/></td>
            <td class="health-cell"><div class="health-picker"><button type="button" class="health-btn green" title="Faible">🟢</button><button type="button" class="health-btn yellow" title="Modérée">🟡</button><button type="button" class="health-btn red" title="Élevée">🔴</button></div></td>
            <td class="input-cell"><textarea rows="2" placeholder="ex. Support passation processus…"></textarea></td>
            <td class="input-cell"><textarea rows="2" placeholder="ex. Coordination sur les projets communs…"></textarea></td>
            <td><button class="del-btn">✕</button></td>
          </tr>
        </tbody>
      </table>
      <button class="add-row-btn" data-fr="+ Ajouter une partie prenante" data-en="+ Add stakeholder">+ Ajouter une partie prenante</button>
    </div>

    <div class="section-label" data-fr="Parties prenantes externes" data-en="External stakeholders">Parties prenantes externes</div>
    <div class="stk-card">
      <div class="stk-card-hdr">
        <svg width="14" height="14" fill="none" stroke="white" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"/></svg>
        <span data-fr="Externes" data-en="External">Externes</span>
        <span class="stk-type-badge" data-fr="Clients, partenaires, AO" data-en="Clients, partners, tenders">Clients, partenaires, AO</span>
      </div>
      <table class="stk-table" id="tbl-external">
        <thead>
          <tr>
            <th style="width:18%" data-fr="Nom / Organisation" data-en="Name / Organisation">Nom / Organisation</th>
            <th style="width:14%" data-fr="Santé relation" data-en="Relationship health">Santé relation</th>
            <th style="width:34%" data-fr="Ce que le manager attend" data-en="What the manager needs from them">Ce que le manager attend</th>
            <th style="width:30%" data-fr="Ce qu'ils attendent du manager" data-en="What they need from the manager">Ce qu'ils attendent du manager</th>
            <th style="width:4%"></th>
          </tr>
        </thead>
        <tbody id="body-external">
          <tr>
            <td class="input-cell"><input type="text" placeholder="ex. Client stratégique A"/></td>
            <td class="health-cell"><div class="health-picker"><button type="button" class="health-btn green" title="Bonne">🟢</button><button type="button" class="health-btn yellow" title="Attention">🟡</button><button type="button" class="health-btn red" title="Difficile">🔴</button></div></td>
            <td class="input-cell"><textarea rows="2" placeholder="ex. Visibilité sur les contrats en cours…"></textarea></td>
            <td class="input-cell"><textarea rows="2" placeholder="ex. Réactivité sur les réclamations…"></textarea></td>
            <td><button class="del-btn">✕</button></td>
          </tr>
        </tbody>
      </table>
      <button class="add-row-btn" data-fr="+ Ajouter une partie prenante" data-en="+ Add stakeholder">+ Ajouter une partie prenante</button>
    </div>
  </div>

  <!-- PHASE 6 — GOVERNANCE -->
  <div class="phase-panel" id="phase-6">
    <div class="gov-intro" data-fr="La liste ci-dessous présente toutes les réunions actuellement en place et considérées comme pertinentes dans le cadre de gouvernance." data-en="The following list outlines all meetings that are currently in place and considered relevant within the governance setup.">La liste ci-dessous présente toutes les réunions actuellement en place et considérées comme pertinentes dans le cadre de gouvernance.</div>
    <div class="gov-note" data-fr="Note : les réunions dont le manager a la responsabilité directe peuvent être adaptées selon ses besoins, priorités et style de management. Cette flexibilité est intentionnelle — elle permet à chaque manager de façonner son approche tout en restant aligné avec le cadre global." data-en="Note: meetings for which a manager holds direct responsibility may be adapted based on individual needs, priorities, and management style. This flexibility is intentional and important, as it allows each manager to shape their governance approach while remaining aligned with the overall framework.">Note : les réunions dont le manager a la responsabilité directe peuvent être adaptées selon ses besoins, priorités et style de management.</div>

    <div class="section-label" data-fr="Cadence de gouvernance" data-en="Governance cadence">Cadence de gouvernance</div>
    <div class="checklist-card">
      <table class="gov-table" style="border-radius:var(--radius-lg);overflow:hidden">
        <thead>
          <tr>
            <th style="width:30%" data-fr="Forum" data-en="Forum">Forum</th>
            <th style="width:22%" data-fr="Fréquence" data-en="Frequency">Fréquence</th>
            <th data-fr="Objectif" data-en="Purpose">Objectif</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="gov-forum" data-fr="1:1 Manager ↔ N+1" data-en="Manager ↔ N+1 1:1">1:1 Manager ↔ N+1</td>
            <td class="gov-freq" data-fr="Hebdo, 60 min" data-en="Weekly, 60 min">Hebdo, 60 min</td>
            <td data-fr="Priorités, décisions, escalades, blocages" data-en="Priorities, decisions, escalations, blockers">Priorités, décisions, escalades, blocages</td>
          </tr>
          <tr>
            <td class="gov-forum" data-fr="Sync Manager ↔ Prédécesseur" data-en="Manager ↔ Predecessor sync">Sync Manager ↔ Prédécesseur</td>
            <td class="gov-freq" data-fr="À définir entre les deux parties" data-en="TBD between the two parties">À définir entre les deux parties</td>
            <td data-fr="Avancement de la passation, points de friction" data-en="Handover progress, boundary issues">Avancement de la passation, points de friction</td>
          </tr>
          <tr>
            <td class="gov-forum" data-fr="Réunion d'équipe" data-en="Team meeting">Réunion d'équipe</td>
            <td class="gov-freq" data-fr="Hebdo, 60 min" data-en="Weekly, 60 min">Hebdo, 60 min</td>
            <td data-fr="Run-the-business, animée par le Manager (reprise de la réunion du prédécesseur, à faire évoluer si nécessaire)" data-en="Run-the-business, owned by Manager (takeover from predecessor, adapt content and timing if necessary)">Run-the-business, animée par le Manager (à adapter sur le fond et la forme)</td>
          </tr>
          <tr>
            <td class="gov-forum" data-fr="1:1 avec rapports directs" data-en="Direct-report 1:1s">1:1 avec rapports directs</td>
            <td class="gov-freq" data-fr="À la discrétion du Manager" data-en="At the Manager's discretion">À la discrétion du Manager</td>
            <td data-fr="Performance, développement, blocages" data-en="Performance, development, blockers">Performance, développement, blocages</td>
          </tr>
          <tr>
            <td class="gov-forum" data-fr="Checkpoint J+30" data-en="D+30 checkpoint">Checkpoint J+30</td>
            <td class="gov-freq" data-fr="J+30 — 1h" data-en="Day 30 — 1h">J+30 — 1h</td>
            <td data-fr="Bilan entre Manager et N+1" data-en="Checkpoint between Manager and N+1">Bilan entre Manager et N+1</td>
          </tr>
          <tr>
            <td class="gov-forum" data-fr="Checkpoint J+60" data-en="D+60 checkpoint">Checkpoint J+60</td>
            <td class="gov-freq" data-fr="J+60 — 1h" data-en="Day 60 — 1h">J+60 — 1h</td>
            <td data-fr="Bilan entre Manager et N+1" data-en="Checkpoint between Manager and N+1">Bilan entre Manager et N+1</td>
          </tr>
          <tr>
            <td class="gov-forum" data-fr="Revue J+90" data-en="D+90 review">Revue J+90</td>
            <td class="gov-freq" data-fr="J+90 — 2h" data-en="Day 90 — 2h">J+90 — 2h</td>
            <td data-fr="Bilan officiel entre Manager et N+1 — évaluation formelle bilatérale" data-en="Official assessment between Manager and N+1 — formal bilateral review">Bilan officiel bilatéral entre Manager et N+1</td>
          </tr>
          <tr>
            <td class="gov-forum" data-fr="Revues 6 mois &amp; 12 mois" data-en="6-month &amp; 12-month reviews">Revues 6 mois &amp; 12 mois</td>
            <td class="gov-freq" data-fr="Planifiées" data-en="Scheduled">Planifiées</td>
            <td data-fr="Revue formelle avec HRBP et N+1" data-en="Formal review with HR bp and N+1">Revue formelle avec HRBP et N+1</td>
          </tr>
          <tr>
            <td class="gov-forum" data-fr="Touchpoint Commercial (+juridique)" data-en="Commercial touchpoint (+legal)">Touchpoint Commercial (+juridique)</td>
            <td class="gov-freq" data-fr="Hebdo, 1h30" data-en="Weekly, 1.5h">Hebdo, 1h30</td>
            <td data-fr="Priorités Perdoo, blocages équipe, points juridiques" data-en="Priority setting with Perdoo, team blockers, legal points">Priorités Perdoo, blocages équipe, points juridiques</td>
          </tr>
          <tr>
            <td class="gov-forum" data-fr="Touchpoint Financier" data-en="Financial touchpoint">Touchpoint Financier</td>
            <td class="gov-freq" data-fr="Mensuel" data-en="Monthly">Mensuel</td>
            <td data-fr="Blocages financiers, analyse des écarts vs budget, projections et escalades si nécessaire" data-en="Financial blockers, learning from past, outlook and adjustments — comparison vs budget and escalations if necessary">Blocages financiers, analyse écarts vs budget, projections et escalades</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <div class="page-footer">
    <p><strong>SLA</strong> &nbsp;·&nbsp; <span data-fr="Direction des Ressources Humaines" data-en="Human Resources Department">Direction des Ressources Humaines</span></p>
    <p style="margin-top:4px" data-fr="Guide interactif 90 jours · Version 2 (ETD) · Document interne" data-en="Interactive 90-day guide · Version 2 (ETD) · Internal document">Guide interactif 90 jours · Version 2 (ETD) · Document interne</p>
  </div>
</div>

`;
