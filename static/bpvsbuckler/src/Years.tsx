import React, { useEffect, useState } from 'react';
import story from './data/story.json';
import type { Scene, SceneMedia, Story } from './data/story.d';

const S = story as unknown as Story;
const SCENES = S.scenes;
const SITE = 'https://bpvsbuckler.bucklerfamily.estate';

type ImageItem = {
  key: string; url: string; title: string; date: string; item: string; source: string; event: string;
};
type YearGroup = {
  year: number; scenes: { scene: Scene; index: number }[]; images: ImageItem[];
  firstIndex: number | null; label: string; description: string;
};

function yearFrom(value?: string | null): number | null {
  const match = (value || '').match(/^(-?[0-9]{1,4})/);
  if (!match) return null;
  const year = Number(match[1]);
  return Number.isFinite(year) && Math.abs(year) < 9998 ? year : null;
}
function imageUrl(value: string): string {
  if (value.startsWith('https://') || value.startsWith('http://')) return value;
  return new URL(value, SITE).toString();
}
function labelForYear(year: number, scenes: Scene[]): string {
  if (year < 0) return 'c. ' + Math.abs(year) + ' BC';
  const period = scenes.find((s) => /century/i.test(s.when))?.when;
  if (period) return period;
  const approximate = scenes.find((s) => { const w = s.when.toLowerCase(); return w.startsWith('c.') || w.startsWith('circa') || w.startsWith('approx'); });
  return approximate ? approximate.when : String(year);
}
function kindFor(text: string): 'church' | 'radio' | 'quarry' | 'paper' | 'demolition' | 'archaeology' | 'development' | 'farm' {
  const t = text.toLowerCase();
  if (/marconi|wireless|radio|signal|telegraph|telegram|preece/.test(t)) return 'radio';
  if (/quarry|limeworks|lime kiln|stoneworks/.test(t)) return 'quarry';
  if (/demolition|demolished|razed|eviction|chainsaw|rubble/.test(t)) return 'demolition';
  if (/cemetery|burial|excavation|archaeolog|pottery|roman villa|iron age/.test(t)) return 'archaeology';
  if (/church|monastery|st dochdwy|manor/.test(t)) return 'church';
  if (/planning|development|houses|reserved matters|building work/.test(t)) return 'development';
  if (/court|judgment|writ|deed|lease|tenancy|conveyance|title|registration|letter|records request|complaint|appeal|land registry|petition|order/.test(t)) return 'paper';
  return 'farm';
}
function YearArtwork({ year, scenes }: { year: number; scenes: Scene[] }) {
  const text = scenes.map((s) => s.title + ' ' + s.narration + ' ' + s.place).join(' ');
  const kind = kindFor(text);
  const era = year < 1700 ? 'antique' : year < 1950 ? 'pastoral' : year < 1990 ? 'slate' : 'documentary';
  const prefix = 'year-art-' + String(year).replace('-', 'b');
  return (
    <svg className={'year-art year-art-' + era} viewBox="0 0 640 360" role="img" aria-label={'Illustrative reconstruction for ' + (year < 0 ? Math.abs(year) + ' BC' : year)}>
      <defs>
        <linearGradient id={prefix + '-sky'} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#5b7180" /><stop offset="1" stopColor="#d9c9a6" /></linearGradient>
        <linearGradient id={prefix + '-ground'} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#7e8b69" /><stop offset="1" stopColor="#35483b" /></linearGradient>
      </defs>
      <rect width="640" height="360" fill={'url(#' + prefix + '-sky)'} />
      <circle cx="510" cy="82" r="36" fill="#f2d39a" opacity=".86" />
      <path d="M0 228 Q110 174 220 220 T445 211 T640 205 V360 H0Z" fill="#7d8d72" />
      <path d="M0 270 Q170 226 315 271 T640 255 V360 H0Z" fill={'url(#' + prefix + '-ground)'} />
      {kind === 'church' && <g stroke="#3c4240" strokeWidth="6" strokeLinejoin="round"><path d="M180 265 V170 L280 110 L380 170 V265Z" fill="#a9a18e" /><path d="M245 145 V84 H310 V145Z" fill="#8d887b" /><path d="M265 84 V48 M290 84 V48 M255 48 H300" fill="none" /><path d="M270 197 Q280 174 290 197 V265 H270Z" fill="#42535a" /><path d="M206 190 H232 V217 H206Z M330 190 H356 V217 H330Z" fill="#55646a" /></g>}
      {kind === 'radio' && <g stroke="#38454c" strokeWidth="5" fill="none"><path d="M315 270 L345 64 L375 270 M330 170 H360 M323 216 H368 M335 112 H355" /><path d="M345 64 V34 M345 34 L326 15 M345 34 L364 15" /><path d="M395 83 Q445 126 395 169 M420 55 Q500 126 420 197 M295 83 Q245 126 295 169" stroke="#ead9b5" strokeWidth="8" strokeLinecap="round" /></g>}
      {kind === 'quarry' && <g stroke="#474b47" strokeWidth="5" strokeLinejoin="round"><path d="M70 268 L150 102 L240 236 L330 72 L460 256 L520 130 L610 270Z" fill="#999183" /><path d="M125 183 L232 183 M212 222 L344 222 M315 164 L450 164 M450 211 L558 211" fill="none" stroke="#d5c4a1" strokeWidth="9" /><path d="M0 290 H640" /></g>}
      {kind === 'paper' && <g stroke="#454a49" strokeWidth="5" strokeLinejoin="round"><path d="M190 105 H405 L455 155 V284 H190Z" fill="#e6ddc7" /><path d="M405 105 V155 H455" fill="#c6b99e" /><path d="M225 177 H400 M225 205 H405 M225 233 H375" fill="none" stroke="#7a756b" strokeWidth="7" /><path d="M445 267 Q500 215 530 177" fill="none" stroke="#39464a" strokeWidth="7" /><path d="M530 177 L545 146 L559 177Z" fill="#39464a" /></g>}
      {kind === 'demolition' && <g stroke="#3c4544" strokeWidth="6" strokeLinejoin="round"><path d="M160 265 V178 L260 118 L348 174 L430 125 L510 188 V265Z" fill="#9a9789" /><path d="M260 118 L348 174 L430 125" fill="none" /><path d="M236 265 V206 H280 V265 M384 265 V206 H428 V265" fill="#45545a" /><path d="M90 291 L160 265 L210 298 L275 276 L345 312 L420 277 L505 302 L570 286" fill="none" stroke="#c2ad88" strokeWidth="14" /></g>}
      {kind === 'archaeology' && <g stroke="#454b49" strokeWidth="6" strokeLinejoin="round"><path d="M115 190 L500 190 L455 295 L165 295Z" fill="#af9678" /><path d="M160 230 Q245 200 320 240 T470 230" fill="none" stroke="#745c49" strokeWidth="10" /><path d="M300 238 Q260 193 285 160 Q320 136 348 173 Q365 210 330 238Z" fill="#c5a77f" /><path d="M280 173 Q315 150 350 174" fill="none" /></g>}
      {kind === 'development' && <g stroke="#424a49" strokeWidth="5" strokeLinejoin="round"><path d="M100 270 V188 L185 131 L270 188 V270Z" fill="#d0c7b1" /><path d="M300 270 V177 L390 120 L480 177 V270Z" fill="#e0d7c2" /><path d="M490 270 V205 L555 160 L620 205 V270Z" fill="#b8b09e" /><path d="M130 214 H170 V270 H130Z M335 210 H375 V247 H335Z M520 220 H545 V270 H520Z" fill="#59666a" /></g>}
      {kind === 'farm' && <g stroke="#414947" strokeWidth="6" strokeLinejoin="round"><path d="M154 270 V175 L278 100 L402 175 V270Z" fill="#d7cdb7" /><path d="M128 180 L278 88 L428 180" fill="none" stroke="#524f48" strokeWidth="17" /><path d="M238 270 V207 Q278 172 318 207 V270Z" fill="#59676b" /><path d="M180 194 H220 V228 H180Z M337 194 H377 V228 H337Z" fill="#63757a" /><path d="M485 270 Q470 222 500 202 Q540 175 548 215 Q570 250 550 270Z" fill="#4c634d" /><path d="M515 207 V270" fill="none" stroke="#5b4937" strokeWidth="9" /></g>}
      <path d="M0 315 Q160 286 300 315 T640 305" stroke="#d7c49c" strokeWidth="3" fill="none" opacity=".7" />
    </svg>
  );
}
function buildGroups(): YearGroup[] {
  const map = new Map<number, YearGroup>();
  const ensure = (year: number) => {
    if (!map.has(year)) map.set(year, { year, scenes: [], images: [], firstIndex: null, label: '', description: '' });
    return map.get(year)!;
  };
  SCENES.forEach((scene, index) => {
    const year = yearFrom(scene.date);
    if (year === null) return;
    const group = ensure(year);
    group.scenes.push({ scene, index });
    if (group.firstIndex === null) group.firstIndex = index;
  });
  SCENES.forEach((scene) => {
    (scene.media || []).forEach((media: SceneMedia) => {
      const year = yearFrom(media.date);
      if (year === null) return;
      const group = ensure(year);
      const key = media.item || media.url;
      const candidate: ImageItem = {
        key, url: imageUrl(media.url), title: media.title, date: media.date || '',
        item: media.item || '', source: media.source === 'curated' ? 'Curated scene image' : 'Archive image, assigned by date',
        event: scene.title
      };
      const existing = group.images.findIndex((x) => x.key === key);
      if (existing < 0) group.images.push(candidate);
      else if (media.url.startsWith('/media/') && !group.images[existing].url.includes('/media/')) group.images[existing] = candidate;
    });
  });
  return [...map.values()].sort((a, b) => a.year - b.year).map((group) => {
    group.images.sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title));
    const sceneList = group.scenes.map((x) => x.scene);
    group.label = labelForYear(group.year, sceneList);
    group.description = sceneList.slice(0, 3).map((s) => s.title).join(' · ');
    if (sceneList.length > 3) group.description += ' · +' + (sceneList.length - 3) + ' more events';
    return group;
  });
}
const GROUPS = buildGroups();
const ALL_IMAGES = GROUPS.flatMap((group) => group.images);
const DOCUMENTARY_IMAGE_KEYS = [
  'MAP-1824', 'MAP-1841', 'EV-0224', 'N01', 'FLATHOLM-1897',
  'N03', 'E112', 'CADW-1988-FH', 'CADW-1988-BARN', 'PURSER-1988'
];
const DOCUMENTARY_IMAGES: ImageItem[] = DOCUMENTARY_IMAGE_KEYS
  .map((key) => ALL_IMAGES.find((item) => item.item === key))
  .filter((item): item is ImageItem => Boolean(item));
function groupForYear(year: number): YearGroup | undefined { return GROUPS.find((g) => g.year === year); }
function yearOfScene(scene: Scene): number | null { return yearFrom(scene.date); }
function GalleryModal({ year, items, onClose }: { year: number; items: ImageItem[]; onClose: () => void }) {
  const [index, setIndex] = useState(0);
  const current = items[index] || items[0];
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowRight') setIndex((i) => (i + 1) % items.length);
      if (event.key === 'ArrowLeft') setIndex((i) => (i - 1 + items.length) % items.length);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, items.length]);
  if (!current) return null;
  return (
    <div className="year-lightbox" role="dialog" aria-modal="true" aria-label={year + ' image gallery'} onClick={onClose}>
      <figure onClick={(event) => event.stopPropagation()}>
        <img src={current.url} alt={current.title} />
        <figcaption><b>{current.title}</b><span>{current.date} · {current.source} · {current.event}</span><small>{index + 1} of {items.length}</small></figcaption>
      </figure>
      <button className="year-lightbox-close" onClick={onClose} aria-label="Close gallery">×</button>
      {items.length > 1 && <>
        <button className="year-lightbox-prev" onClick={() => setIndex((i) => (i - 1 + items.length) % items.length)} aria-label="Previous image">‹</button>
        <button className="year-lightbox-next" onClick={() => setIndex((i) => (i + 1) % items.length)} aria-label="Next image">›</button>
      </>}
    </div>
  );
}
export function YearGallery({ onPick }: { onPick: (i: number) => void }) {
  const [gallery, setGallery] = useState<YearGroup | null>(null);
  return (
    <div className="sheet year-sheet">
      <header className="year-intro">
        <div className="year-kicker">THE STORY, BY YEAR</div>
        <h1>Years in pictures</h1>
        <p>Browse the chronology visually. Each photograph is grouped by the date of what it depicts, not by the wider date range of a related event. Where no dated image is available, an original illustrative reconstruction is clearly labelled.</p>
        <div className="year-count">{GROUPS.length} years · {GROUPS.reduce((n, g) => n + g.images.length, 0)} dated images</div>
      </header>
      <div className="year-grid">
        {GROUPS.map((group) => {
          const first = group.scenes[0]?.scene;
          return (
            <article className="year-card" key={group.year}>
              <button className="year-cover" onClick={() => group.images.length ? setGallery(group) : first && group.firstIndex !== null && onPick(group.firstIndex)} aria-label={group.images.length ? 'Open images from ' + group.label : 'Open year ' + group.label}>
                {group.images.length > 0 ? <img src={group.images[0].url} alt={group.images[0].title} loading="lazy" /> : <YearArtwork year={group.year} scenes={group.scenes.map((x) => x.scene)} />}
                <span className="year-number">{group.year < 0 ? Math.abs(group.year) + ' BC' : group.year}</span>
                {group.images.length === 0 && <span className="year-art-label">Illustrative reconstruction</span>}
                {group.images.length > 1 && <span className="year-image-count">{group.images.length} images</span>}
              </button>
              <div className="year-card-copy">
                <div className="year-card-meta"><b>{group.label}</b><span>{group.scenes.length} event{group.scenes.length === 1 ? '' : 's'}</span></div>
                <h2>{first?.title || 'Archive image'}</h2>
                <p>{group.description || 'Dated image in the archive'}</p>
                <div className="year-card-actions">
                  {group.firstIndex !== null && <button onClick={() => onPick(group.firstIndex!)}>Explore year</button>}
                  {group.images.length > 0 && <button onClick={() => setGallery(group)}>Browse gallery ({group.images.length})</button>}
                </div>
              </div>
            </article>
          );
        })}
      </div>
      {gallery && <GalleryModal year={gallery.year} items={gallery.images} onClose={() => setGallery(null)} />}
    </div>
  );
}
function DocumentaryContext({ year }: { year: number }) {
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [broken, setBroken] = useState<Record<string, boolean>>({});
  const images = DOCUMENTARY_IMAGES.filter((item) => !broken[item.key]);
  return (
    <div className="year-stage-context">
      <div className="year-stage-heading">
        <span>DOCUMENTARY ARCHIVE</span>
        <b>Photographs, maps and contemporary records</b>
      </div>
      <p className="year-stage-context-note">
        No dated image is linked to this scene. These are selected archive items from other dates across the documentary collection; each date is shown as recorded, and none is presented as a depiction of the event on screen.
      </p>
      <div className="year-stage-context-grid">
        {images.map((item) => (
          <button type="button" className="year-stage-context-card" key={item.key} onClick={() => setGalleryOpen(true)}>
            <img src={item.url} alt={item.title} loading="lazy" onError={() => setBroken((old) => ({ ...old, [item.key]: true }))} />
            <span className="year-stage-context-date">{item.date}</span>
            <strong>{item.title}</strong>
          </button>
        ))}
      </div>
      {galleryOpen && images.length > 0 && <GalleryModal year={year} items={images} onClose={() => setGalleryOpen(false)} />}
    </div>
  );
}

export function YearMediaViewer({ scene }: { scene: Scene }) {
  const year = yearOfScene(scene);
  const group = year === null ? undefined : groupForYear(year);
  const items = group?.images || [];
  const [index, setIndex] = useState(0);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [broken, setBroken] = useState(false);
  useEffect(() => { setIndex(0); setGalleryOpen(false); setBroken(false); }, [year]);
  if (year === null) return <section className="year-stage"><DocumentaryContext year={0} /></section>;
  const current = items[index] || items[0];
  return (
    <section className="year-stage">
      <div className="year-stage-heading"><span>YEAR IN PICTURES</span><b>{group?.label || year}</b></div>
      {current && !broken ? (
        <div className="year-stage-photo">
          <img src={current.url} alt={current.title} onError={() => setBroken(true)} />
          <div className="year-stage-caption"><b>{current.title}</b><span>{current.date} · {index + 1} of {items.length}</span></div>
          {items.length > 1 && <div className="year-stage-controls">
            <button onClick={() => setIndex((i) => (i - 1 + items.length) % items.length)} aria-label="Previous image">‹</button>
            <button onClick={() => setIndex((i) => (i + 1) % items.length)} aria-label="Next image">›</button>
          </div>}
          <button className="year-stage-expand" onClick={() => setGalleryOpen(true)}>{items.length > 1 ? 'Open gallery' : 'View image'} ⤢</button>
        </div>
      ) : (
        <DocumentaryContext year={year} />
      )}
      {galleryOpen && items.length > 0 && <GalleryModal year={year} items={items} onClose={() => setGalleryOpen(false)} />}
    </section>
  );
}
