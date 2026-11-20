// Structure HTML de l'intro (injectée dans le Shadow DOM).
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

// Logo officiel Cliko (SVG du site), découpé trait par trait pour l'animer.
export const logoSVG = (extra = "") => `
<svg class="logo" viewBox="0 0 480 148" aria-hidden="true" ${extra}>
  <g class="st" stroke="#fff">
    <path class="p0" d="M82.47 68.57A41 41 0 1 0 82.47 123.43" pathLength="1"/>
    <path class="p1" d="M123 11V135" pathLength="1"/>
    <path class="p2" d="M179 57V135" pathLength="1"/>
    <path class="p3" d="M235 11V135" pathLength="1"/>
    <path class="p4" d="M235 112L289 57" pathLength="1"/>
    <path class="p5" d="M253 93.67L293 135" pathLength="1"/>
  </g>
  <circle class="dt" cx="179" cy="16" r="13"/>
  <path class="o" fill-rule="evenodd" d="M372 44H428A52 52 0 0 1 428 148H372A52 52 0 0 1 372 44ZM389 96A39 39 0 1 0 467 96A39 39 0 1 0 389 96Z"/>
  <circle class="spk" r="10" opacity="0"/>
</svg>`;

// Mot avec reflet balayant (calque .shine superposé)
const shineWord = (txt, cls) => `<span class="w ${cls}"><span class="grad">${esc(txt)}</span><span class="shine" aria-hidden="true">${esc(txt)}</span></span>`;
const neonWord = (txt, cls) => `<span class="w tw ${cls}"><span class="tube">${esc(txt)}</span><span class="neon">${esc(txt)}</span></span>`;

const ICONS = [
  // globe
  `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.6 2.7 3.9 5.7 3.9 9s-1.3 6.3-3.9 9c-2.6-2.7-3.9-5.7-3.9-9S9.4 5.7 12 3z"/></svg>`,
  // serveur
  `<svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="6.5" rx="2"/><rect x="4" y="13.5" width="16" height="6.5" rx="2"/><path d="M8 7.25h.01M8 16.75h.01M12 7.25h4M12 16.75h4"/></svg>`,
  // bulle
  `<svg viewBox="0 0 24 24"><path d="M20 12a8 8 0 0 1-11.6 7.1L4 20l1-4.2A8 8 0 1 1 20 12z"/><path d="M8.5 12h.01M12 12h.01M15.5 12h.01"/></svg>`,
];

export function buildMarkup(L) {
  const sv = L.services;
  const code = [
    `<span class="kw">const</span> site = cliko.<span class="kw">create</span><span class="p">({</span>`,
    `  commerce<span class="p">:</span> <span class="s">"${esc(L.yours)}"</span><span class="p">,</span>`,
    `  langues<span class="p">: [</span><span class="s">"fr"</span><span class="p">,</span> <span class="s">"nl"</span><span class="p">,</span> <span class="s">"en"</span><span class="p">],</span>`,
    `  design<span class="p">:</span> <span class="s">"sur-mesure"</span><span class="p">,</span>`,
    `  hosting<span class="p">:</span> <span class="kw">true</span><span class="p">,</span>`,
    `<span class="p">});</span>`,
    `site.<span class="kw">launch</span><span class="p">();</span> <span class="cm">// </span><span class="ok">✓ live</span>`,
  ];

  const t5 = "THE FUTURE IS DIGITAL.";
  let t5html = "";
  let wi = 0;
  for (const ch of t5) {
    if (ch === " ") {
      wi++;
      t5html += `<span class="sp b${wi * 2}"></span>`;
      if (wi === 2) t5html += `<span class="br"></span>`;
    } else t5html += `<span class="ch grad">${esc(ch)}</span>`;
  }

  const mission = (i) => {
    const [a, b] = sv[i];
    return `<div class="m m${i + 1}">
      <div class="ml mono"><i></i><span>Mission 0${i + 1}</span><em>/ 04</em></div>
      <div class="mt"><span class="ln"><span>${esc(a)}</span></span><span class="ln g"><span>${esc(b)}</span></span>${i === 3 ? '<span class="car"></span>' : ""}</div>
      <p class="md">${esc(L.desc[i])}</p>
    </div>`;
  };

  return `
<div class="ck" role="dialog" aria-modal="true" aria-label="${esc(L.label)}">
  <canvas class="gl" aria-hidden="true"></canvas>
  <canvas class="sil" aria-hidden="true"></canvas>
  <div class="stage" aria-hidden="true">
    <div class="sc s1"><div class="a s1w"><div class="s1l"><span class="grp"><span class="w">The</span> <span class="w">wait</span></span> <span class="grp"><span class="w">is</span> <span class="w">over.</span></span></div></div><div class="flare"></div></div>

    <div class="sc s2a"><div class="a"><div class="row big glowP">${shineWord("GTA", "gta")}${shineWord("VI", "vi")}</div></div></div>
    <div class="sc s2b"><div class="a"><div class="row">${neonWord("IS", "is")}${neonWord("HERE.", "here")}</div></div></div>
    <div class="sc s2c"><div class="a"><div class="lk">
      <div class="k mono">The wait is over</div>
      <div class="big glowP l1">${shineWord("GTA VI", "l1w")}</div>
      <div class="l2">${neonWord("IS HERE.", "l2w")}</div>
    </div></div></div>
    <div class="loc mono"><i></i><span class="lt"></span><b></b></div>

    <div class="sc s3">
      <div class="lw l3">${logoSVG()}</div>
      <div class="row big s3t glowP"><span class="w chrome">We</span><span class="w chrome">are</span><span class="w chrome">too.</span></div>
    </div>

    <div class="sc s4">
      <div class="g4">
        <div class="tx">${[0, 1, 2, 3].map(mission).join("")}</div>
        <div class="vs">
          <div class="v v1"><div class="bw">
            <div class="bg"></div>
            <svg viewBox="0 0 400 270" preserveAspectRatio="none"><rect class="fr" x="1" y="1" width="398" height="268" rx="14" pathLength="1"/><line class="tb" x1="1" y1="30" x2="399" y2="30" pathLength="1"/></svg>
            <i class="d d1"></i><i class="d d2"></i><i class="d d3"></i><i class="url"></i>
            <i class="hero"></i><i class="h1"></i><i class="h2"></i><i class="bt"></i>
            <i class="cd c1"></i><i class="cd c2"></i><i class="cd c3"></i>
            <i class="rip"></i><i class="cur"></i>
          </div></div>
          <div class="v v2"><div class="ph"><div class="scr"><i class="sg"></i>${L.chips.map((c, i) => `<i class="chip k${i + 1}">${esc(c)}</i>`).join("")}</div><i class="notch"></i></div><i class="ring r1"></i><i class="ring r2"></i><i class="ring r3"></i></div>
          <div class="v v3"><div class="cds">${L.cards.map(([b, s], i) => `<div class="cd3 q${i + 1}">${ICONS[i]}<b>${esc(b)}</b><span>${esc(s)}</span></div>`).join("")}</div></div>
          <div class="v v4"><div class="cw"><div class="code"><div class="cbar"><i></i><i></i><i></i><span class="mono">cliko.config.js</span></div><div class="cl mono">${code.map((c) => `<span><span>${c}</span></span>`).join("")}</div><i class="ccar"></i><i class="scan"></i></div><div class="tag neon">&lt;/&gt;</div></div></div>
        </div>
      </div>
      <div class="pb"><i><b></b></i><i><b></b></i><i><b></b></i><i><b></b></i></div>
    </div>

    <div class="sc s5">
      <div class="pk mono">GTA VI is here. We are too.</div>
      <div class="lw l5">${logoSVG()}</div>
      <div class="t5 glowP">${t5html}</div>
      <div class="u5 mono"><i></i><span>cliko.be</span></div>
    </div>
  </div>
  <div class="grain" aria-hidden="true"></div>
  <div class="bar t" aria-hidden="true"></div><div class="bar b" aria-hidden="true"></div>
  <div class="fade" aria-hidden="true"></div>
  <div class="ui">
    <div class="cta" hidden><button class="btn pri go-site">${esc(L.site)}</button><button class="btn sec go-quote">${esc(L.quote)}</button></div>
    <div class="gate" hidden>
      <div class="lw">${logoSVG()}</div>
      <div class="gk mono">${esc(L.prod)}</div>
      <button class="btn pri play"><span class="pi"><svg viewBox="0 0 14 16"><path d="M0 0l14 8-14 8z"/></svg></span><span>${esc(L.play)}</span></button>
      <div class="gh mono">${esc(L.hint)}</div>
      <button class="enter">${esc(L.enter)} →</button>
    </div>
    <button class="ctl snd mono" aria-pressed="true" hidden><svg viewBox="0 0 24 24"><path d="M4 9h4l5-4v14l-5-4H4z"/><path class="wv" d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/><path class="x" d="M17 9.5l5 5M22 9.5l-5 5"/></svg><span class="sl"></span></button>
    <button class="ctl skip mono" hidden>${esc(L.skip)} ›</button>
    <div class="prog" hidden><b></b></div>
  </div>
  <p class="sr" aria-live="polite"></p>
</div>`;
}

export const codeLens = (L) =>
  ["const site = cliko.create({", `  commerce: "${L.yours}",`, '  langues: ["fr", "nl", "en"],', '  design: "sur-mesure",', "  hosting: true,", "});", "site.launch(); // ✓ live"].map((s) => s.length);
