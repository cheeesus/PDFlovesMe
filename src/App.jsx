import React, { useCallback, useRef, useState } from 'react';
import {
  ArrowDownAZ, ArrowUpAZ, Check, ChevronDown, FilePlus2, Files, Grip, LoaderCircle,
  LockKeyhole, Menu, Plus, RotateCw, ShieldCheck, Trash2, Upload, X,
} from 'lucide-react';
import { createThumbnail, isPdf, mergePdfs } from './pdf.js';

function App() {
  const inputRef = useRef(null);
  const [items, setItems] = useState([]);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [result, setResult] = useState('');
  const [dragId, setDragId] = useState(null);

  const addFiles = useCallback(async (fileList) => {
    const files = [...fileList];
    const valid = files.filter(isPdf);
    const invalidFilesError = files.length !== valid.length
      ? 'Certains fichiers ont été ignorés : seuls les PDF sont acceptés.'
      : '';
    setError(invalidFilesError);
    if (!valid.length) return;
    setResult('');
    const pending = valid.map((file) => ({ id: crypto.randomUUID(), file, name: file.name, pageCount: null, thumbnail: '', rotation: 0, status: 'loading' }));
    setItems((current) => [...current, ...pending]);
    for (const item of pending) {
      try {
        const preview = await createThumbnail(item.file);
        setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, ...preview, status: 'ready' } : entry));
      } catch {
        setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, status: 'error' } : entry));
        setError((current) => [current, `${item.name} n’a pas pu être lu. Vérifiez qu’il s’agit d’un PDF valide.`].filter(Boolean).join(' '));
      }
    }
  }, []);

  const moveItem = (targetId) => {
    if (!dragId || dragId === targetId) return;
    setItems((current) => {
      const from = current.findIndex((item) => item.id === dragId);
      const to = current.findIndex((item) => item.id === targetId);
      const next = [...current]; const [moved] = next.splice(from, 1); next.splice(to, 0, moved); return next;
    });
    setDragId(null);
  };

  const rotate = (id) => setItems((current) => current.map((item) => item.id === id ? { ...item, rotation: (item.rotation + 90) % 360 } : item));
  const remove = (id) => setItems((current) => current.filter((item) => item.id !== id));
  const sort = (direction) => setItems((current) => [...current].sort((a, b) => direction * a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' })));

  const handleMerge = async () => {
    if (items.length < 2 || items.some((item) => item.status !== 'ready')) return;
    setBusy(true); setProgress(0); setError('');
    try {
      const bytes = await mergePdfs(items, setProgress);
      const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
      setResult(url);
      const link = document.createElement('a');
      link.href = url; link.download = `fusionné_${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(link); link.click(); link.remove();
    } catch (cause) {
      console.error(cause); setError('La fusion a échoué. Un des PDF est peut-être protégé ou endommagé.');
    } finally { setBusy(false); }
  };

  const reset = () => {
    if (result) URL.revokeObjectURL(result);
    setItems([]); setResult(''); setError(''); setProgress(0);
  };
  const totalPages = items.reduce((sum, item) => sum + (item.pageCount || 0), 0);
  const canMerge = items.length >= 2 && items.every((item) => item.status === 'ready') && !busy;

  return <div className="app-shell" onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setDragging(false); }} onDrop={(event) => { event.preventDefault(); setDragging(false); addFiles(event.dataTransfer.files); }}>
    <header className="topbar">
      <a className="brand" href="#" onClick={(event) => { event.preventDefault(); reset(); }} aria-label="Merge PDF, accueil"><span className="brand-mark"><Files size={21} strokeWidth={2.6} /></span><span>PDFLoves<span className="brand-red">ME</span></span></a>
      <nav className="main-nav"><a className="active" href="#merge">OUTILS PDF</a><a href="#how-it-works">COMMENT ÇA MARCHE</a></nav>
      <div className="top-actions"><button className="icon-button mobile-menu" aria-label="Ouvrir le menu"><Menu /></button></div>
    </header>

    <main id="merge">
      {!items.length ? <section className="hero">
        <div className="hero-copy"><div className="eyebrow"><span className="eyebrow-dot" /> SIMPLE. RAPIDE. SÉCURISÉ.</div><h1>Fusionnez vos PDF<br /><span>en un clin d’œil.</span></h1><p>Combinez plusieurs fichiers PDF en un seul document. Réorganisez vos pages, choisissez l’ordre et téléchargez votre nouveau fichier.</p><div className="hero-trust"><span><ShieldCheck size={17} /> 100 % privé</span><i /><span>Gratuit et sans inscription</span></div></div>
        <div className={`upload-panel ${dragging ? 'drop-active' : ''}`}>
          <div className="upload-art"><div className="paper paper-back"><span /></div><div className="paper paper-front"><span /><b>PDF</b></div><div className="upload-plus"><Plus size={20} strokeWidth={3} /></div></div>
          <h2>Déposez vos fichiers PDF ici</h2><p>ou sélectionnez-les depuis votre appareil</p>
          <button className="primary-button upload-button" onClick={() => inputRef.current?.click()}><Upload size={18} /> Sélectionner les fichiers PDF</button>
          <div className="upload-foot"><LockKeyhole size={14} /> Vos fichiers restent privés et sécurisés</div>
        </div>
        <input ref={inputRef} className="visually-hidden" type="file" accept="application/pdf,.pdf" multiple onChange={(event) => { addFiles(event.target.files); event.target.value = ''; }} />
      </section> : <section className="workspace">
        <div className="workspace-heading"><div><div className="eyebrow"><span className="eyebrow-dot" /> ORGANISEZ VOS DOCUMENTS</div><h1>Fusionner <span>PDF</span></h1><p>Faites glisser les fichiers pour choisir leur ordre de fusion.</p></div><button className="add-files" onClick={() => inputRef.current?.click()}><FilePlus2 size={18} /> Ajouter des fichiers</button></div>
        <input ref={inputRef} className="visually-hidden" type="file" accept="application/pdf,.pdf" multiple onChange={(event) => { addFiles(event.target.files); event.target.value = ''; }} />
        <div className="toolbar"><div className="file-count"><span className="count-icon"><Files size={17} /></span><strong>{items.length} {items.length > 1 ? 'fichiers' : 'fichier'}</strong><span className="toolbar-divider" />{totalPages} pages au total</div><div className="sort-actions"><span>Trier par nom</span><button className="sort-button" title="Trier de A à Z" onClick={() => sort(1)}><ArrowDownAZ size={18} /><span>A–Z</span></button><button className="sort-button" title="Trier de Z à A" onClick={() => sort(-1)}><ArrowUpAZ size={18} /><span>Z–A</span></button></div></div>
        {error && <div className="error-banner" role="alert"><X size={16} />{error}<button onClick={() => setError('')} aria-label="Fermer"><X size={16} /></button></div>}
        <div className="file-grid" aria-label="Fichiers à fusionner">{items.map((item, index) => <article className={`file-card ${dragId === item.id ? 'is-dragging' : ''}`} key={item.id} draggable onDragStart={(event) => { setDragId(item.id); event.dataTransfer.effectAllowed = 'move'; }} onDragEnd={() => setDragId(null)} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); moveItem(item.id); }}>
          <div className="card-top"><span className="order-badge">{String(index + 1).padStart(2, '0')}</span><button className="card-action" title="Pivoter toutes les pages de 90°" aria-label={`Pivoter ${item.name}`} onClick={() => rotate(item.id)}><RotateCw size={16} /></button><button className="card-action remove-action" title="Supprimer" aria-label={`Supprimer ${item.name}`} onClick={() => remove(item.id)}><Trash2 size={16} /></button></div>
          <div className="preview-wrap"><div className="preview-paper" style={{ transform: `rotate(${item.rotation}deg)` }}>{item.thumbnail ? <img src={item.thumbnail} alt={`Première page de ${item.name}`} /> : item.status === 'error' ? <div className="preview-error"><X size={20} /></div> : <div className="preview-loading"><LoaderCircle size={22} className="spin" /></div>}<span className="pdf-stamp">PDF</span></div></div>
          <div className="card-meta"><div className="filename" title={item.name}>{item.name}</div><div className="page-meta">{item.status === 'loading' ? 'Lecture du document…' : item.status === 'error' ? 'Fichier illisible' : `${item.pageCount} ${item.pageCount > 1 ? 'pages' : 'page'}`}</div></div><div className="drag-handle" title="Faire glisser pour réorganiser"><Grip size={17} /></div>
        </article>)}<button className="add-card" onClick={() => inputRef.current?.click()}><span className="add-card-icon"><Plus size={22} /></span><strong>Ajouter un PDF</strong><span>Glissez-déposez ou parcourez</span></button></div>
        <div className="merge-bar"><div className="merge-summary"><span className="merge-check"><Check size={17} /></span><div><strong>Prêt à fusionner</strong><span>{items.length} fichiers · {totalPages} pages</span></div></div><div className="merge-actions">{busy && <div className="progress-wrap"><span>Fusion en cours… {progress}%</span><div className="progress-track"><div style={{ width: `${progress}%` }} /></div></div>}<button className="primary-button merge-button" onClick={handleMerge} disabled={!canMerge}>{busy ? <><LoaderCircle className="spin" size={19} /> Fusion en cours…</> : <><Files size={19} /> Fusionner PDF</>}</button></div></div>
      </section>}
      {result && <div className="success-banner" role="status"><span className="success-icon"><Check size={17} /></span><div><strong>Vos PDF ont été fusionnés avec succès !</strong><span>Le téléchargement a démarré automatiquement.</span></div><a href={result} download={`fusionné_${new Date().toISOString().slice(0, 10)}.pdf`}>Télécharger à nouveau</a><button onClick={reset} className="restart-button">Nouvelle fusion <ChevronDown size={15} /></button></div>}
      <section className="steps" id="how-it-works"><div className="section-kicker">COMMENT ÇA MARCHE</div><h2>Trois étapes, un seul PDF.</h2><div className="step-grid"><div className="step"><span className="step-number">01</span><span className="step-icon"><Upload size={20} /></span><h3>Ajoutez vos fichiers</h3><p>Choisissez plusieurs PDF depuis votre appareil ou faites-les glisser.</p></div><div className="step"><span className="step-number">02</span><span className="step-icon"><Grip size={20} /></span><h3>Organisez l’ordre</h3><p>Déplacez les documents, pivotez les pages ou retirez un fichier.</p></div><div className="step"><span className="step-number">03</span><span className="step-icon"><Files size={20} /></span><h3>Fusionnez et téléchargez</h3><p>Un clic suffit pour obtenir votre PDF combiné, prêt à partager.</p></div></div></section>
    </main>
    <footer><a className="brand footer-brand" href="#merge"><span className="brand-mark"><Files size={18} strokeWidth={2.6} /></span><span>PDFLoves<span className="brand-red">ME</span></span></a><span>Tous vos PDF, simplement.</span><span className="footer-secure"><LockKeyhole size={14} /> Traitement sécurisé dans votre navigateur</span></footer>
  </div>;
}

export default App;
