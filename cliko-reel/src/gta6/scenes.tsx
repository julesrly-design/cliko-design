// Les 10 scènes du short. Chaque scène est jouée dans une <Sequence> : les frames sont relatives à son début.
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Big, C, CL, Counter, DISPLAY, ease, Label, LivePill, MONO, NEON, Note, Person, ramp, Slam, Stamp, SUNSET, usePop } from "./kit";
import { wordAt } from "./timing";

const Center: React.FC<{ children: React.ReactNode; top?: number; style?: React.CSSProperties }> = ({ children, top = 0, style }) => (
  <div style={{ position: "absolute", left: 0, right: 0, top, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", ...style }}>{children}</div>
);

// 1 — « Treize ans. Treize ans d'attente… et aujourd'hui, GTA 6 est enfin sorti. »
export const Hook: React.FC = () => {
  const f = useCurrentFrame();
  const t2 = wordAt("hook", /^13$/, 1);
  const today = wordAt("hook", /^today/i);
  const gta = wordAt("hook", /^GTA/);
  const enfin = wordAt("hook", /FINALLY/);
  const out13 = ramp(f, gta - 6, gta, ease.io);
  const bar = ramp(f, t2, today, ease.io);
  const year = Math.round(interpolate(bar, [0, 1], [2013, 2026]));
  const datePop = usePop(today);
  return (
    <AbsoluteFill>
      <div style={{ opacity: 1 - out13, transform: `translateY(${-out13 * 300}px) scale(${1 - out13 * 0.3})` }}>
        <Center top={250}>
          <Counter at={3} dur={12} to={13} size={460} />
          <Slam at={8}><Big size={150}>years</Big></Slam>
        </Center>
        {f >= t2 && (
          <Center top={980}>
            <Label style={{ fontSize: 64 }}>of waiting…</Label>
            <div style={{ marginTop: 26, width: 760, height: 34, borderRadius: 17, background: "rgba(255,255,255,.12)", border: "3px solid rgba(255,255,255,.35)", overflow: "hidden" }}>
              <div style={{ width: `${bar * 100}%`, height: "100%", background: SUNSET.replace("180deg", "90deg"), boxShadow: `0 0 30px ${C.pink}` }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", width: 760, marginTop: 12, fontFamily: MONO, fontSize: 34, color: C.white }}>
              <span>2013</span><span style={{ color: C.yellow, fontWeight: 700 }}>{year}</span>
            </div>
          </Center>
        )}
      </div>
      {f >= today && (
        <Center top={f >= gta ? 330 : 700} style={{ transform: `scale(${datePop})` }}>
          <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 46, color: C.night, background: C.yellow, padding: "10px 26px", borderRadius: 12, transform: "rotate(-2deg)" }}>THURSDAY · NOV 19, 2026</div>
        </Center>
      )}
      {f >= gta && (
        <Center top={470}>
          <Slam at={gta} from={3.2}><Big size={330} grad={SUNSET}>GTA 6</Big></Slam>
          <div style={{ marginTop: 40 }}><Stamp at={enfin} text="Finally out" size={110} /></div>
        </Center>
      )}
    </AbsoluteFill>
  );
};

// 2 — « Et l'ampleur que ça prend, c'est complètement fou. »
export const Ampleur: React.FC = () => {
  const f = useCurrentFrame();
  const fou = wordAt("ampleur", /insane/);
  const rings = [0, 5, 10].map((d) => ramp(f, fou + d, fou + d + 22, ease.out));
  return (
    <AbsoluteFill>
      {rings.map((r, i) => (
        <div key={i} style={{ position: "absolute", left: 540 - 450 * r, top: 760 - 450 * r, width: 900 * r, height: 900 * r, borderRadius: "50%", border: `${10 * (1 - r) + 2}px solid ${i % 2 ? C.teal : C.pink}`, opacity: (1 - r) * (f >= fou ? 1 : 0) }} />
      ))}
      <Center top={380}>
        <Slam at={0}><Big size={150}>the hype</Big></Slam>
        <Slam at={wordAt("ampleur", /^right/)}><Big size={110} style={{ marginTop: 10 }}>right now</Big></Slam>
        <Slam at={fou - 4} from={4}><Big size={250} grad={SUNSET} style={{ marginTop: 30 }}>is insane</Big></Slam>
      </Center>
    </AbsoluteFill>
  );
};

const CHAT = ["LETS GOOOO", "13 YEARS WAITING", "FINALLY !!!", "VICE CITY HERE WE GO", "took the day off lol", "GG ROCKSTAR", "W W W W", "im crying rn", "RECORD LMAO", "bye bye work"];
const CHATCOL = [C.teal, C.yellow, C.hot, C.orange, "#9cf", C.kick];

// 3 — « Sur Twitch, plus de trois millions de personnes regardaient le jeu en même temps. Du jamais vu. »
export const Twitch: React.FC = () => {
  const f = useCurrentFrame();
  const n = wordAt("twitch", /^3$/);
  const jam = wordAt("twitch", /Never/);
  const card = usePop(0);
  return (
    <AbsoluteFill>
      {/* chat qui défile */}
      {CHAT.map((m, i) => {
        const y = 1150 - ((f * 5 + i * 115) % 1150);
        return (
          <div key={i} style={{ position: "absolute", left: i % 2 ? 560 : 70, top: y + 60, fontFamily: DISPLAY, fontWeight: 800, fontSize: 34, color: C.white, background: "rgba(13,5,25,.65)", padding: "8px 18px", borderRadius: 14, opacity: 0.85 * Math.min(1, y / 200), borderLeft: `6px solid ${CHATCOL[i % CHATCOL.length]}` }}>
            <span style={{ color: CHATCOL[i % CHATCOL.length] }}>user{(i * 7919) % 9000}: </span>{m}
          </div>
        );
      })}
      <Center top={300} style={{ transform: `scale(${card})` }}>
        <div style={{ width: 940, padding: "40px 30px 50px", borderRadius: 40, background: "rgba(25,8,48,.92)", border: `5px solid ${C.twitch}`, boxShadow: `0 0 80px ${C.twitch}aa`, display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
          <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
            <LivePill f={f} />
            <div style={{ fontFamily: DISPLAY, fontWeight: 900, fontSize: 52, color: C.twitch, background: "#fff", padding: "6px 22px", borderRadius: 12 }}>TWITCH</div>
          </div>
          <div style={{ height: 250, display: "flex", alignItems: "center" }}>
            <Counter at={n} dur={28} to={3_000_000} suffix="+" size={140} grad={NEON} />
          </div>
          <Label style={{ fontSize: 50 }}>watching at the same time</Label>
        </div>
      </Center>
      <Center top={1000}><Stamp at={jam} text="Never seen before" color={C.yellow} rot={-5} size={100} /></Center>
    </AbsoluteFill>
  );
};

// 4 — « Twitch, YouTube, Kick : plus de six millions de spectateurs en direct au lancement. »
export const Total: React.FC = () => {
  const f = useCurrentFrame();
  const six = wordAt("total", /^6$/);
  const merge = ramp(f, six - 8, six, ease.io);
  const plats = [
    { n: "TWITCH", c: C.twitch, at: 0 },
    { n: "YOUTUBE", c: C.youtube, at: wordAt("total", /YouTube/) },
    { n: "KICK", c: C.kick, at: wordAt("total", /Kick/) },
  ];
  return (
    <AbsoluteFill>
      {plats.map((p, i) => {
        const t = ramp(f, p.at, p.at + 7, ease.expo);
        const y0 = 340 + i * 190;
        return f >= p.at && (
          <div key={p.n} style={{ position: "absolute", left: 540 - 330, top: interpolate(merge, [0, 1], [y0, 640]), width: 660, height: 150, borderRadius: 30, background: p.c, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: DISPLAY, fontWeight: 900, fontSize: 84, color: p.n === "KICK" ? "#000" : "#fff", transform: `translateX(${(1 - t) * (i % 2 ? 900 : -900)}px) scale(${1 - merge * 0.9}) skewX(-6deg)`, opacity: 1 - merge, boxShadow: `0 0 60px ${p.c}88` }}>
            {p.n}
          </div>
        );
      })}
      {f >= six && (
        <Center top={420}>
          <Label style={{ fontSize: 56, color: C.teal }}>all platforms</Label>
          <div style={{ height: 300, display: "flex", alignItems: "center" }}><Counter at={six} dur={30} to={6_000_000} suffix="+" size={160} /></div>
          <Label>live viewers</Label>
          <Slam at={wordAt("total", /launch/)}><Label style={{ color: C.yellow, fontSize: 64, marginTop: 10 }}>at launch</Label></Slam>
          <Note style={{ marginTop: 40 }}>peak concurrent viewers · Streams Charts · preliminary</Note>
        </Center>
      )}
    </AbsoluteFill>
  );
};

// 5 — « Et côté vues ? Le premier trailer : quatre-vingt-dix millions de vues en vingt-quatre heures. Record du monde. »
export const Vues: React.FC = () => {
  const f = useCurrentFrame();
  const n = wordAt("vues", /^90$/);
  const h = wordAt("vues", /^24$/);
  const rec = wordAt("vues", /^world/);
  const tr = wordAt("vues", /trailer/);
  const play = usePop(0);
  const clock = ramp(f, h, h + 30, ease.io);
  return (
    <AbsoluteFill>
      <Center top={260}>
        <div style={{ width: 300, height: 210, borderRadius: 60, background: C.youtube, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${play})`, boxShadow: `0 0 90px ${C.youtube}aa` }}>
          <div style={{ width: 0, height: 0, borderLeft: "95px solid #fff", borderTop: "58px solid transparent", borderBottom: "58px solid transparent", marginLeft: 20 }} />
        </div>
        <Slam at={tr}><Label style={{ marginTop: 34, fontSize: 58 }}>trailer 1 · december 2023</Label></Slam>
        <div style={{ height: 250, display: "flex", alignItems: "center" }}><Counter at={n} dur={28} to={90_000_000} size={140} /></div>
        {f >= n && <Label style={{ fontSize: 64 }}>views</Label>}
        {f >= h && (
          <div style={{ display: "flex", alignItems: "center", gap: 24, marginTop: 24 }}>
            <svg width={110} height={110} viewBox="0 0 110 110">
              <circle cx={55} cy={55} r={46} stroke="rgba(255,255,255,.2)" strokeWidth={12} fill="none" />
              <circle cx={55} cy={55} r={46} stroke={C.yellow} strokeWidth={12} fill="none" strokeDasharray={289} strokeDashoffset={289 * (1 - clock)} transform="rotate(-90 55 55)" strokeLinecap="round" />
            </svg>
            <Big size={110} grad={NEON}>in 24 h</Big>
          </div>
        )}
      </Center>
      <Center top={1040}>
        <Stamp at={rec} text="World record" color={C.yellow} rot={-6} size={92} />
        {f >= rec + 6 && <Note style={{ marginTop: 26 }}>Guinness World Records · most-viewed reveal in 24 h</Note>}
      </Center>
    </AbsoluteFill>
  );
};

// 6 — « Au total, les trailers dépassent le demi-milliard de vues, rien que sur YouTube. »
export const Cumul: React.FC = () => {
  const f = useCurrentFrame();
  const n = wordAt("cumul", /^half/);
  const yt = wordAt("cumul", /YouTube/);
  const tiles = ["TRAILER 1", "TRAILER 2", "TRAILER 3", "LAUNCH"];
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 90, top: 230, width: 900, display: "flex", flexWrap: "wrap", gap: 24 }}>
        {tiles.map((t, i) => {
          const p = ramp(f, i * 4, i * 4 + 10, ease.expo);
          return (
            <div key={t} style={{ width: 438, height: 246, borderRadius: 24, overflow: "hidden", position: "relative", opacity: p, transform: `translateY(${(1 - p) * 120}px) rotate(${(i % 2 ? 1 : -1) * 2}deg)`, background: `linear-gradient(${135 + i * 40}deg, ${C.violet}, ${[C.pink, C.orange, C.teal, C.yellow][i]})`, boxShadow: "0 18px 40px rgba(0,0,0,.5)" }}>
              <div style={{ position: "absolute", left: 18, bottom: 14, fontFamily: DISPLAY, fontWeight: 900, fontSize: 42, color: "#fff", textShadow: "0 3px 0 rgba(0,0,0,.4)" }}>{t}</div>
              <div style={{ position: "absolute", right: 20, top: 18, width: 70, height: 50, borderRadius: 14, background: C.youtube, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ borderLeft: "22px solid #fff", borderTop: "14px solid transparent", borderBottom: "14px solid transparent", marginLeft: 6 }} />
              </div>
            </div>
          );
        })}
      </div>
      <Center top={830}>
        <div style={{ height: 230, display: "flex", alignItems: "center" }}><Counter at={n} dur={26} to={500_000_000} suffix="+" size={118} /></div>
        {f >= n && <Label style={{ fontSize: 60 }}>total views</Label>}
        <Slam at={yt}><Label style={{ color: C.teal, fontSize: 60, marginTop: 8 }}>on YouTube alone</Label></Slam>
      </Center>
    </AbsoluteFill>
  );
};

// 7 — « Mais le plus dingue, c'est dans la vraie vie. Des milliers de gens ont posé leur journée. »
export const Conges: React.FC = () => {
  const f = useCurrentFrame();
  const mil = wordAt("conges", /Thousands/);
  const pose = wordAt("conges", /^took/);
  const cal = usePop(mil - 4);
  const dots = Array.from({ length: 120 }, (_, i) => i);
  return (
    <AbsoluteFill>
      {f < mil - 4 && (
        <Center top={480}>
          <Slam at={0}><Big size={130}>the craziest part</Big></Slam>
          <Slam at={wordAt("conges", /^real/)}><Big size={150} grad={SUNSET} style={{ marginTop: 20 }}>in real life</Big></Slam>
        </Center>
      )}
      {f >= mil - 4 && (
        <>
          {dots.map((i) => {
            const at = mil + (i % 40) * 0.6 + Math.floor(i / 40) * 3;
            const p = ramp(f, at, at + 6, ease.expo);
            return <div key={i} style={{ position: "absolute", left: 60 + (i % 12) * 82, top: 210 + Math.floor(i / 12) * 92, width: 56, height: 56, borderRadius: 12, background: i % 5 === 0 ? C.yellow : C.pink, opacity: p * 0.35, transform: `scale(${p})` }} />;
          })}
          <Center top={300} style={{ transform: `scale(${cal}) rotate(-3deg)` }}>
            <div style={{ width: 560, borderRadius: 36, overflow: "hidden", background: "#fff", boxShadow: "0 30px 80px rgba(0,0,0,.6)" }}>
              <div style={{ background: C.pink, color: "#fff", fontFamily: DISPLAY, fontWeight: 900, fontSize: 64, padding: "18px 0" }}>NOVEMBER</div>
              <div style={{ fontFamily: DISPLAY, fontWeight: 900, fontSize: 300, color: C.night, lineHeight: 1.05 }}>19</div>
              <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 44, color: C.violet, paddingBottom: 30 }}>THURSDAY</div>
            </div>
          </Center>
          <Center top={760}><Stamp at={pose} text="Day off" color={C.yellow} rot={-12} size={120} /></Center>
          <Center top={950}><Slam at={mil}><Big size={84}>thousands of people</Big></Slam></Center>
        </>
      )}
    </AbsoluteFill>
  );
};

// 8 — « Logitech a offert un jour de congé à ses sept mille salariés. Conor McGregor, pareil pour ses quatre cents employés. »
export const Logi: React.FC = () => {
  const f = useCurrentFrame();
  const n1 = wordAt("logi", /^7,000/);
  const c = wordAt("logi", /Conor/);
  const n2 = wordAt("logi", /^400/);
  const a = usePop(0);
  const b = usePop(c);
  const card = (accent: string): React.CSSProperties => ({ border: `5px solid ${accent}`, boxShadow: `0 0 60px ${accent}66` });
  const box: React.CSSProperties = { width: 920, borderRadius: 36, background: "rgba(20,6,38,.9)", padding: "30px 40px", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 };
  return (
    <AbsoluteFill>
      <Center top={170} style={{ transform: `scale(${a}) translateY(${ramp(f, c - 6, c, ease.io) * -20}px)` }}>
        <div style={{ ...box, ...card(C.teal) }}>
          <Big size={120} grad={NEON}>Logitech</Big>
          <div style={{ display: "flex", alignItems: "baseline", gap: 18, marginTop: 6 }}>
            <Counter at={n1} dur={20} to={7000} size={140} />
            {f >= n1 && <Label>employees</Label>}
          </div>
          <Slam at={wordAt("logi", /^gave/)}><div style={{ fontFamily: DISPLAY, fontWeight: 900, fontSize: 50, color: C.night, background: C.teal, padding: "8px 24px", borderRadius: 14 }}>+1 FREE DAY OFF</div></Slam>
          <Note style={{ marginTop: 8 }}>the “Logi Game Day”</Note>
        </div>
      </Center>
      {f >= c && (
        <Center top={640} style={{ transform: `scale(${b})` }}>
          <div style={{ ...box, ...card(C.orange) }}>
            <Big size={104} grad={SUNSET}>Conor McGregor</Big>
            <div style={{ display: "flex", alignItems: "baseline", gap: 18, marginTop: 6 }}>
              <Counter at={n2} dur={16} to={400} size={140} />
              {f >= n2 && <Label>staff</Label>}
            </div>
            <Slam at={wordAt("logi", /^same/)}><div style={{ fontFamily: DISPLAY, fontWeight: 900, fontSize: 50, color: C.night, background: C.orange, padding: "8px 24px", borderRadius: 14 }}>DAY OFF FOR EVERYONE</div></Slam>
          </div>
        </Center>
      )}
    </AbsoluteFill>
  );
};

// 9 — « Aux États-Unis, près d'un salarié sur cinq comptait ne pas bosser aujourd'hui. On appelle déjà ça… la GTA flu. »
export const Flu: React.FC = () => {
  const f = useCurrentFrame();
  const un = wordAt("flu", /^worker/);
  const cinq = wordAt("flu", /^five/);
  const gta = wordAt("flu", /^GTA/);
  const out = ramp(f, gta - 8, gta - 1, ease.io);
  const glitch = f >= gta && f < gta + 14 ? (f % 3) * 10 - 10 : 0;
  return (
    <AbsoluteFill>
      <div style={{ opacity: 1 - out, transform: `scale(${1 - out * 0.2})` }}>
        <Center top={260}>
          <Slam at={0}><Label style={{ fontSize: 60, color: C.teal }}>in the US</Label></Slam>
          <div style={{ display: "flex", gap: 14, marginTop: 50 }}>
            {[0, 1, 2, 3, 4].map((i) => {
              const p = ramp(f, un + i * 3, un + i * 3 + 8, ease.expo);
              const lit = i === 2 && f >= cinq;
              return (
                <div key={i} style={{ transform: `translateY(${(1 - p) * 80}px) scale(${lit ? 1.18 : 1})`, opacity: p, filter: lit ? `drop-shadow(0 0 30px ${C.pink})` : undefined }}>
                  <Person color={lit ? C.pink : "rgba(255,246,251,.35)"} size={160} />
                </div>
              );
            })}
          </div>
          {f >= cinq && (
            <>
              <Slam at={cinq}><Big size={170} grad={SUNSET} style={{ marginTop: 95 }}>1 in 5</Big></Slam>
              <Label style={{ marginTop: 10, fontSize: 48 }}>planned to skip work</Label>
              <Note style={{ marginTop: 22 }}>BambooHR survey · 18% of US salaried workers · stated plans</Note>
            </>
          )}
        </Center>
      </div>
      {f >= gta && (
        <Center top={480}>
          <div style={{ fontSize: 0, position: "relative" }}>
            <div style={{ position: "absolute", inset: 0, transform: `translateX(${glitch}px)`, opacity: glitch ? 0.8 : 0, filter: "hue-rotate(140deg)" }}><Big size={260} grad={SUNSET}>GTA</Big></div>
            <Slam at={gta} from={3.4}><Big size={260} grad={SUNSET}>GTA</Big></Slam>
          </div>
          <Slam at={wordAt("flu", /flu/)} from={3}><Big size={330} grad={NEON} style={{ marginTop: -10 }}>FLU</Big></Slam>
          {f >= gta + 10 && (
            <div style={{ display: "flex", gap: 30, marginTop: 40 }}>
              {[0, 1, 2].map((i) => {
                const p = ramp(f, gta + 10 + i * 4, gta + 20 + i * 4, ease.expo);
                return <div key={i} style={{ width: 150, height: 64, borderRadius: 32, background: `linear-gradient(90deg, #fff 50%, ${C.pink} 50%)`, transform: `rotate(${-25 + i * 25}deg) scale(${p})`, boxShadow: "0 10px 30px rgba(0,0,0,.4)" }} />;
              })}
            </div>
          )}
        </Center>
      )}
    </AbsoluteFill>
  );
};

// 10 — « Et toi, t'as pris ta journée ? Dis-le en commentaire. »
export const Outro: React.FC = () => {
  const f = useCurrentFrame();
  const dis = wordAt("outro", /^Tell/);
  const bubble = usePop(dis);
  return (
    <AbsoluteFill>
      <Center top={270}>
        <Slam at={0} from={3.5}><Big size={190} grad={SUNSET}>did you?</Big></Slam>
        <Slam at={wordAt("outro", /^take/)}><Big size={104} style={{ marginTop: 30 }}>take the day off?</Big></Slam>
      </Center>
      {f >= dis && (
        <Center top={820} style={{ transform: `scale(${bubble})` }}>
          <div style={{ position: "relative", background: "#fff", borderRadius: 40, padding: "28px 46px", fontFamily: DISPLAY, fontWeight: 900, fontSize: 64, color: C.night, boxShadow: `0 0 60px ${C.pink}88` }}>
            TELL ME IN THE COMMENTS
            <div style={{ position: "absolute", left: 80, bottom: -34, width: 0, height: 0, borderLeft: "26px solid transparent", borderRight: "26px solid transparent", borderTop: "40px solid #fff" }} />
          </div>
          <Slam at={wordAt("outro", /^follow/)}><div style={{ marginTop: 50, fontFamily: DISPLAY, fontWeight: 900, fontSize: 56, color: C.night, background: C.yellow, padding: "12px 34px", borderRadius: 40 }}>FOLLOW MILE ZERO</div></Slam>
          <div style={{ marginTop: 20, fontSize: 110, color: C.yellow, fontFamily: DISPLAY, fontWeight: 900, transform: `translateY(${Math.abs(Math.sin((f - dis) / 5)) * 26}px)` }}>↓</div>
        </Center>
      )}
      <Center top={1440}><Note style={{ fontSize: 22, opacity: interpolate(f, [dis, dis + 10], [0, 0.8], CL) }}>Sources: Streams Charts, SullyGnome, Guinness, BambooHR, press reports · preliminary figures</Note></Center>
    </AbsoluteFill>
  );
};
