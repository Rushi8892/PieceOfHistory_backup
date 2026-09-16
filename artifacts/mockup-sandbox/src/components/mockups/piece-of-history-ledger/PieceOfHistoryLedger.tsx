import { type ReactNode, useState } from 'react';
import {
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  Crown,
  Globe2,
  Menu,
  PenLine,
  Snowflake,
  Sparkles,
  X,
} from 'lucide-react';

type Story = {
  rank: number;
  name: string;
  amount: string;
  story: string;
  mark: string;
};

const stories: Story[] = [
  {
    rank: 1,
    name: 'Mara Ellison',
    amount: '$38.00',
    story: 'The afternoon my father taught me to fix a radio.',
    mark: '01',
  },
  {
    rank: 2,
    name: 'Jon Bell',
    amount: '$24.50',
    story: 'A bus ride that took the long way home.',
    mark: '02',
  },
  {
    rank: 3,
    name: 'Nia Okafor',
    amount: '$17.25',
    story: 'The last summer before everything changed.',
    mark: '03',
  },
];

const frozenDays = [
  { date: 'Tuesday, March 4', winner: 'A quiet room at 5:12am', amount: '$42.00' },
  { date: 'Monday, March 3', winner: 'The borrowed yellow coat', amount: '$31.75' },
  { date: 'Sunday, March 2', winner: 'How we found the shortcut', amount: '$28.50' },
];

function BrandMark() {
  return (
    <div className="phl-brand">
      <span className="phl-brand-mark" aria-hidden="true">
        P
      </span>
      <span>
        <strong>Piece of History</strong>
        <small>Piece of Internet History</small>
      </span>
    </div>
  );
}

function RailIcon({ children, active = false, onClick }: { children: ReactNode; active?: boolean; onClick: () => void }) {
  return (
    <button className={`phl-rail-icon ${active ? 'is-active' : ''}`} type="button" onClick={onClick} aria-label="Navigation item">
      {children}
    </button>
  );
}

export default function PieceOfHistoryLedger() {
  const [railOpen, setRailOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const [selectedStory, setSelectedStory] = useState(1);

  const makeBid = () => {
    setNotice('Your place is held — write today’s piece to make a bid.');
    window.setTimeout(() => setNotice(''), 3600);
  };

  return (
    <div className="phl-surface">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&family=Space+Mono:wght@400;700&display=swap');
        .phl-surface {
          --ink: #173f51;
          --ink-soft: #5f7881;
          --line: #d3e3e6;
          --ice: #f2f8f9;
          --paper: #fbfdfd;
          --cyan: #9bd8df;
          --cyan-deep: #208da2;
          --sun: #f6c95f;
          min-height: 100%;
          width: 100%;
          overflow: hidden;
          color: var(--ink);
          background:
            radial-gradient(circle at 71% 0%, rgba(201,239,241,.72), transparent 24rem),
            linear-gradient(135deg, #edf6f7 0%, #f8fbfa 49%, #e8f3f4 100%);
          font-family: 'DM Sans', sans-serif;
        }
        .phl-surface *, .phl-surface *::before, .phl-surface *::after { box-sizing: border-box; }
        .phl-frame {
          display: grid;
          grid-template-columns: 76px minmax(0, 1fr);
          min-height: 100vh;
        }
        .phl-rail {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          padding: 24px 0 20px;
          border-right: 1px solid rgba(23,63,81,.1);
          background: rgba(255,255,255,.38);
          backdrop-filter: blur(12px);
        }
        .phl-rail-top, .phl-rail-nav, .phl-rail-bottom { display:flex; flex-direction:column; align-items:center; }
        .phl-rail-nav { gap: 10px; margin-top: 48px; }
        .phl-rail-bottom { gap: 18px; }
        .phl-rail-icon {
          display: grid;
          place-items: center;
          width: 38px;
          height: 38px;
          border: 1px solid transparent;
          border-radius: 10px;
          color: #79929a;
          background: transparent;
          cursor: pointer;
          transition: background-color 180ms ease, color 180ms ease, transform 180ms ease;
        }
        .phl-rail-icon:hover { color: var(--ink); transform: translateY(-1px); }
        .phl-rail-icon.is-active { color: var(--ink); background: var(--cyan); border-color: rgba(32,141,162,.2); box-shadow: 3px 3px 0 rgba(32,141,162,.16); }
        .phl-rail-seal {
          display:grid; place-items:center; width:30px; height:30px; border-radius:50%;
          border: 1px solid var(--line); color: var(--cyan-deep); font: 700 10px/1 'Space Mono', monospace;
          background: rgba(255,255,255,.6);
        }
        .phl-main { min-width: 0; padding: 28px clamp(24px, 4vw, 64px) 36px; }
        .phl-topbar { display:flex; align-items:center; justify-content:space-between; gap:20px; }
        .phl-brand { display:flex; align-items:center; gap:10px; }
        .phl-brand-mark {
          display:grid; place-items:center; width:34px; height:34px; border: 2px solid var(--ink);
          border-radius: 9px 9px 9px 3px; color: var(--ink); background: var(--cyan);
          box-shadow: 3px 3px 0 var(--sun); font: 26px/1 'Instrument Serif', serif;
        }
        .phl-brand strong { display:block; font: 18px/1 'Instrument Serif', serif; letter-spacing:-.02em; }
        .phl-brand small { display:block; margin-top:4px; color:var(--ink-soft); font: 8px/1 'Space Mono', monospace; letter-spacing:.11em; text-transform:uppercase; }
        .phl-top-actions { display:flex; align-items:center; gap:12px; }
        .phl-eyebrow { color:var(--cyan-deep); font: 700 9px/1 'Space Mono', monospace; letter-spacing:.17em; text-transform:uppercase; }
        .phl-top-note { display:flex; align-items:center; gap:8px; color:var(--ink-soft); font-size:11px; }
        .phl-icon-button { display:none; border:1px solid var(--line); border-radius:8px; padding:8px; color:var(--ink); background:rgba(255,255,255,.7); }
        .phl-layout { display:grid; grid-template-columns: minmax(0, 1fr) 286px; gap:clamp(22px, 3.2vw, 52px); margin-top:34px; }
        .phl-primary { min-width:0; }
        .phl-headline-row { display:flex; align-items:flex-end; justify-content:space-between; gap:28px; border-bottom:1px solid var(--line); padding-bottom:22px; }
        .phl-heading { margin:0; max-width:660px; font: 400 clamp(52px, 6.3vw, 96px)/.82 'Instrument Serif', serif; letter-spacing:-.055em; }
        .phl-heading em { color:var(--cyan-deep); }
        .phl-date-chip { flex:0 0 auto; display:flex; align-items:center; gap:10px; padding:10px 0 3px 16px; border-left:1px solid var(--line); color:var(--ink-soft); font: 10px/1.5 'Space Mono', monospace; }
        .phl-date-chip strong { display:block; color:var(--ink); font: 26px/1 'Instrument Serif', serif; }
        .phl-stage { position:relative; display:grid; grid-template-columns:minmax(0, 1.18fr) minmax(220px, .82fr); gap:26px; margin-top:26px; padding:28px; border:1px solid rgba(32,141,162,.22); border-radius:18px; background:rgba(251,253,253,.7); box-shadow: 0 22px 40px -30px rgba(23,63,81,.55), inset 0 1px 0 rgba(255,255,255,.9); }
        .phl-stage::after { content:'TODAY'; position:absolute; top:18px; right:22px; color:rgba(32,141,162,.34); font:700 9px/1 'Space Mono',monospace; letter-spacing:.2em; transform:rotate(90deg) translateX(100%); transform-origin:top right; }
        .phl-stage-copy { display:flex; flex-direction:column; justify-content:center; min-height:250px; }
        .phl-story-label { display:flex; align-items:center; gap:8px; color:var(--ink-soft); font:700 9px/1 'Space Mono',monospace; letter-spacing:.14em; text-transform:uppercase; }
        .phl-story-quote { max-width:570px; margin:22px 0 0; font:400 clamp(30px, 3.3vw, 51px)/.96 'Instrument Serif',serif; letter-spacing:-.035em; }
        .phl-story-author { margin:16px 0 0; color:var(--ink-soft); font-size:12px; }
        .phl-story-author strong { color:var(--ink); }
        .phl-action-row { display:flex; align-items:center; gap:12px; margin-top:27px; }
        .phl-button { display:inline-flex; align-items:center; justify-content:center; gap:8px; min-height:40px; border:0; border-radius:6px; padding:0 16px; color:#f7fcfc; background:var(--ink); box-shadow:4px 4px 0 var(--sun); cursor:pointer; font:700 11px/1 'DM Sans',sans-serif; transition:transform 180ms ease, box-shadow 180ms ease; }
        .phl-button:hover { transform:translateY(-2px); box-shadow:5px 6px 0 var(--sun); }
        .phl-text-button { border:0; padding:10px 2px; color:var(--ink-soft); background:transparent; cursor:pointer; font:700 11px/1 'DM Sans',sans-serif; }
        .phl-text-button:hover { color:var(--ink); }
        .phl-ticket { position:relative; display:flex; flex-direction:column; justify-content:space-between; min-height:250px; padding:20px; border-radius:13px; background:var(--ink); color:#eef9fa; overflow:hidden; }
        .phl-ticket::before { content:''; position:absolute; inset:auto -30px -60px auto; width:180px; height:180px; border:1px solid rgba(155,216,223,.35); border-radius:50%; box-shadow:0 0 0 18px rgba(155,216,223,.08), 0 0 0 36px rgba(155,216,223,.05); }
        .phl-ticket-top, .phl-ticket-bottom { position:relative; display:flex; justify-content:space-between; align-items:flex-start; gap:10px; }
        .phl-ticket-title { margin-top:23px; font:400 27px/.96 'Instrument Serif',serif; }
        .phl-ticket-amount { color:var(--sun); font:400 42px/.9 'Instrument Serif',serif; }
        .phl-ticket-label { color:rgba(238,249,250,.55); font:9px/1.35 'Space Mono',monospace; letter-spacing:.12em; text-transform:uppercase; }
        .phl-ticket-name { margin-top:5px; font-size:12px; font-weight:600; }
        .phl-countdown { color:#d4eef0; font:700 11px/1 'Space Mono',monospace; }
        .phl-board { display:grid; grid-template-columns: minmax(0, 1fr) 190px; gap:26px; margin-top:25px; }
        .phl-section-heading { display:flex; align-items:center; justify-content:space-between; gap:10px; border-bottom:1px solid var(--line); padding-bottom:12px; }
        .phl-section-heading h2 { margin:0; font:400 25px/1 'Instrument Serif',serif; }
        .phl-section-heading span { color:var(--ink-soft); font:9px/1 'Space Mono',monospace; letter-spacing:.1em; text-transform:uppercase; }
        .phl-competition { min-width:0; }
        .phl-story-list { margin-top:5px; }
        .phl-story-row { display:grid; grid-template-columns:32px 104px minmax(0,1fr) 72px 20px; align-items:center; gap:10px; min-height:58px; border-bottom:1px solid rgba(211,227,230,.8); cursor:pointer; transition:background-color 180ms ease, padding 180ms ease; }
        .phl-story-row:hover, .phl-story-row.is-selected { padding:0 10px; background:rgba(155,216,223,.18); }
        .phl-rank { color:var(--ink-soft); font:700 10px/1 'Space Mono',monospace; }
        .phl-name { overflow:hidden; color:var(--ink); font-size:11px; font-weight:700; text-overflow:ellipsis; white-space:nowrap; }
        .phl-story-small { overflow:hidden; color:var(--ink-soft); font:13px/1.25 'Instrument Serif',serif; text-overflow:ellipsis; white-space:nowrap; }
        .phl-amount { color:var(--cyan-deep); font:700 10px/1 'Space Mono',monospace; text-align:right; }
        .phl-row-mark { color:var(--cyan-deep); }
        .phl-mini-card { padding:17px; border:1px solid var(--line); border-radius:12px; background:rgba(255,255,255,.5); }
        .phl-mini-card h3 { margin:0; font:400 23px/1 'Instrument Serif',serif; }
        .phl-mini-card p { margin:10px 0 0; color:var(--ink-soft); font-size:11px; line-height:1.45; }
        .phl-mini-card .phl-button { width:100%; margin-top:18px; box-shadow:3px 3px 0 var(--sun); }
        .phl-aside { min-width:0; padding-top:8px; }
        .phl-aside-title { display:flex; align-items:center; gap:9px; padding-bottom:13px; border-bottom:1px solid var(--line); font:400 25px/1 'Instrument Serif',serif; }
        .phl-frozen-list { display:flex; flex-direction:column; gap:8px; margin-top:12px; }
        .phl-frozen { display:block; padding:13px 12px; border:1px solid transparent; border-radius:9px; color:var(--ink); background:rgba(255,255,255,.42); text-decoration:none; transition:transform 180ms ease, border-color 180ms ease, background-color 180ms ease; }
        .phl-frozen:hover { transform:translateX(3px); border-color:var(--line); background:rgba(255,255,255,.75); }
        .phl-frozen-date { color:var(--ink-soft); font:8px/1 'Space Mono',monospace; letter-spacing:.08em; text-transform:uppercase; }
        .phl-frozen strong { display:block; margin-top:10px; font:400 18px/1 'Instrument Serif',serif; }
        .phl-frozen-meta { display:flex; align-items:center; justify-content:space-between; gap:6px; margin-top:9px; color:var(--ink-soft); font-size:10px; }
        .phl-frozen-meta b { color:var(--cyan-deep); font:700 9px/1 'Space Mono',monospace; }
        .phl-history-link { display:inline-flex; align-items:center; gap:5px; margin-top:16px; color:var(--ink-soft); font-size:10px; font-weight:700; text-decoration:underline; text-decoration-color:var(--cyan); text-underline-offset:4px; }
        .phl-aside-note { position:relative; margin-top:30px; padding:18px 17px 19px; border:1px solid rgba(155,216,223,.55); border-radius:10px; background:rgba(155,216,223,.22); overflow:hidden; }
        .phl-aside-note::after { content:'✦'; position:absolute; right:12px; top:8px; color:rgba(32,141,162,.45); font-size:34px; }
        .phl-aside-note p { max-width:170px; margin:0; font:400 21px/.98 'Instrument Serif',serif; }
        .phl-aside-note small { display:block; margin-top:12px; color:var(--ink-soft); font:9px/1.4 'Space Mono',monospace; }
        .phl-footer { display:flex; align-items:center; justify-content:space-between; gap:18px; margin-top:32px; padding-top:18px; border-top:1px solid var(--line); color:var(--ink-soft); font-size:10px; }
        .phl-footer-left { display:flex; align-items:center; gap:8px; }
        .phl-footer-left svg { color:var(--cyan-deep); }
        .phl-footer-right { display:flex; align-items:center; gap:14px; }
        .phl-footer-right span + span::before { content:'·'; margin-right:14px; color:var(--cyan-deep); }
        .phl-toast { position:fixed; right:24px; bottom:24px; z-index:10; display:flex; align-items:center; gap:9px; max-width:310px; padding:13px 16px; border:1px solid var(--line); border-radius:8px; color:var(--ink); background:rgba(251,253,253,.96); box-shadow:0 16px 34px -20px rgba(23,63,81,.65); font-size:11px; }
        @media (max-width: 980px) {
          .phl-layout { grid-template-columns:1fr; }
          .phl-aside { display:grid; grid-template-columns:1fr 1fr; gap:24px; padding-top:0; }
          .phl-aside-note { margin-top:0; align-self:start; }
        }
        @media (max-width: 720px) {
          .phl-frame { grid-template-columns:1fr; }
          .phl-rail { position:fixed; z-index:8; inset:0 auto 0 0; width:76px; transform:translateX(-100%); transition:transform 180ms ease; }
          .phl-rail.is-open { transform:translateX(0); }
          .phl-main { padding:20px 18px 28px; }
          .phl-icon-button { display:grid; place-items:center; }
          .phl-top-note { display:none; }
          .phl-brand strong { font-size:17px; }
          .phl-layout { margin-top:24px; }
          .phl-headline-row { align-items:flex-start; flex-direction:column; gap:20px; }
          .phl-date-chip { padding-left:0; border-left:0; }
          .phl-heading { font-size:57px; }
          .phl-stage { grid-template-columns:1fr; padding:20px; }
          .phl-stage::after { display:none; }
          .phl-stage-copy { min-height:0; }
          .phl-story-quote { font-size:39px; }
          .phl-ticket { min-height:190px; }
          .phl-board { grid-template-columns:1fr; }
          .phl-mini-card { display:none; }
          .phl-aside { grid-template-columns:1fr; }
          .phl-aside-note { margin-top:0; }
          .phl-footer { align-items:flex-start; flex-direction:column; }
          .phl-footer-right { flex-wrap:wrap; gap:8px; }
        }
        @media (max-width: 480px) {
          .phl-story-row { grid-template-columns:24px 86px minmax(0,1fr) 60px; gap:6px; }
          .phl-row-mark { display:none; }
          .phl-story-small { font-size:12px; }
          .phl-action-row { align-items:flex-start; flex-direction:column; gap:4px; }
          .phl-button { width:100%; }
        }
      `}</style>

      <div className="phl-frame">
        <aside className={`phl-rail ${railOpen ? 'is-open' : ''}`} aria-label="Primary navigation">
          <div className="phl-rail-top">
            <div className="phl-rail-seal">PH</div>
            <div className="phl-rail-nav">
              <RailIcon active onClick={() => setNotice('Today is open — every piece is still in play.')}>
                <CalendarDays size={17} strokeWidth={1.7} />
              </RailIcon>
              <RailIcon onClick={() => setNotice('The frozen archive keeps each winning day.')}>
                <BookOpen size={17} strokeWidth={1.7} />
              </RailIcon>
              <RailIcon onClick={() => setNotice('Piece of Internet History — one day at a time.')}>
                <Globe2 size={17} strokeWidth={1.7} />
              </RailIcon>
              <RailIcon onClick={() => setNotice('The writing desk is ready when you are.')}>
                <PenLine size={17} strokeWidth={1.7} />
              </RailIcon>
            </div>
          </div>
          <div className="phl-rail-bottom">
            <RailIcon onClick={() => setNotice('Small rituals make lasting records.')}>
              <Sparkles size={16} strokeWidth={1.7} />
            </RailIcon>
            <span className="phl-rail-seal" aria-hidden="true">24</span>
          </div>
        </aside>

        <main className="phl-main">
          <header className="phl-topbar">
            <BrandMark />
            <div className="phl-top-actions">
              <p className="phl-top-note"><Snowflake size={13} /> A small contest about what deserves to survive the day.</p>
              <button className="phl-icon-button" type="button" onClick={() => setRailOpen((open) => !open)} aria-label={railOpen ? 'Close navigation' : 'Open navigation'}>
                {railOpen ? <X size={17} /> : <Menu size={17} />}
              </button>
            </div>
          </header>

          <div className="phl-layout">
            <section className="phl-primary" aria-labelledby="phl-title">
              <div className="phl-headline-row">
                <div>
                  <div className="phl-eyebrow">Live today · daily record</div>
                  <h1 className="phl-heading" id="phl-title">Tuesday,<br /><em>March 5.</em></h1>
                </div>
                <div className="phl-date-chip">
                  <CalendarDays size={17} strokeWidth={1.5} />
                  <span><strong>05</strong>March 2026</span>
                </div>
              </div>

              <section className="phl-stage" aria-label="Current piece">
                <div className="phl-stage-copy">
                  <div className="phl-story-label"><Crown size={14} /> Current piece · first place</div>
                  <p className="phl-story-quote">“The afternoon my father taught me to fix a radio.”</p>
                  <p className="phl-story-author">— <strong>Mara Ellison</strong> · the day is still open</p>
                  <div className="phl-action-row">
                    <button className="phl-button" type="button" onClick={makeBid}>Make your bid <ArrowUpRight size={14} /></button>
                    <button className="phl-text-button" type="button" onClick={() => setNotice('Every confirmed payment becomes part of the day’s record.')}>How it works <ChevronRight size={13} /></button>
                  </div>
                </div>
                <div className="phl-ticket">
                  <div className="phl-ticket-top">
                    <span className="phl-ticket-label">Highest standing</span>
                    <span className="phl-countdown"><Clock3 size={12} /> 06:18:42</span>
                  </div>
                  <div>
                    <div className="phl-ticket-amount">$38.00</div>
                    <div className="phl-ticket-title">A piece worth<br />keeping.</div>
                  </div>
                  <div className="phl-ticket-bottom">
                    <div><div className="phl-ticket-label">Currently leading</div><div className="phl-ticket-name">Mara Ellison</div></div>
                    <Snowflake size={19} color="#9bd8df" strokeWidth={1.4} />
                  </div>
                </div>
              </section>

              <div className="phl-board">
                <section className="phl-competition" aria-labelledby="phl-competition-heading">
                  <div className="phl-section-heading">
                    <h2 id="phl-competition-heading">Today’s competition</h2>
                    <span>{stories.length} in play</span>
                  </div>
                  <div className="phl-story-list">
                    {stories.map((story) => (
                      <div className={`phl-story-row ${selectedStory === story.rank ? 'is-selected' : ''}`} key={story.rank} onClick={() => setSelectedStory(story.rank)} role="button" tabIndex={0} onKeyDown={(event) => { if (event.key === 'Enter') setSelectedStory(story.rank); }}>
                        <span className="phl-rank">0{story.rank}</span>
                        <span className="phl-name">{story.name}</span>
                        <span className="phl-story-small">“{story.story}”</span>
                        <span className="phl-amount">{story.amount}</span>
                        <span className="phl-row-mark">{story.rank === 1 ? <Crown size={13} /> : story.rank === 2 ? <Sparkles size={13} /> : <Snowflake size={13} />}</span>
                      </div>
                    ))}
                  </div>
                </section>
                <aside className="phl-mini-card">
                  <div className="phl-eyebrow">Leave a mark</div>
                  <h3>What was today about?</h3>
                  <p>Write one short, true story about one meaningful day. Ordinary is encouraged.</p>
                  <button className="phl-button" type="button" onClick={() => setNotice('The writing desk is ready when you are.')}>Start writing <PenLine size={13} /></button>
                </aside>
              </div>
            </section>

            <aside className="phl-aside" aria-labelledby="phl-archive-heading">
              <section>
                <h2 className="phl-aside-title" id="phl-archive-heading"><BookOpen size={19} color="#208da2" strokeWidth={1.6} /> Recently frozen</h2>
                <div className="phl-frozen-list">
                  {frozenDays.map((day) => (
                    <a href="#archive" className="phl-frozen" key={day.date}>
                      <div className="phl-frozen-date">{day.date}</div>
                      <strong>{day.winner}</strong>
                      <div className="phl-frozen-meta"><span><Snowflake size={10} /> Frozen</span><b>{day.amount}</b></div>
                    </a>
                  ))}
                </div>
                <a className="phl-history-link" href="#archive">Read the frozen days <ArrowUpRight size={12} /></a>
              </section>
              <div className="phl-aside-note">
                <p>One day. One winner. One tiny piece of history.</p>
                <small><Globe2 size={11} /> The archive starts here.</small>
              </div>
            </aside>
          </div>

          <footer className="phl-footer">
            <div className="phl-footer-left"><Globe2 size={13} /> Built by someone who won’t be remembered.</div>
            <div className="phl-footer-right"><span>Terms</span><span>Privacy</span><span>© 2026 Piece of History</span></div>
          </footer>
        </main>
      </div>

      {notice && <div className="phl-toast" role="status"><Check size={15} color="#208da2" /> {notice}</div>}
    </div>
  );
}