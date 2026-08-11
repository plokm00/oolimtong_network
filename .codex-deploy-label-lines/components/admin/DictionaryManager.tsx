import React, { useState, useRef } from 'react';
import { WordEntry, addWordEntry, updateWordEntry, VisualBlock } from '@/lib/dictionary-data';
import { Sparkles, Edit2, Trash2, Plus, Lock } from 'lucide-react';
import { Pagination } from './Pagination';

interface DictionaryManagerProps {
    entries: WordEntry[];
    refreshEntries: () => Promise<void>;
    setStatus: (status: string) => void;
    handleDelete: (id: string) => Promise<void>;
    handlePasswordChange: (e: React.FormEvent) => void;
    newPassword: string;
    setNewPassword: (pw: string) => void;
}

export const DictionaryManager: React.FC<DictionaryManagerProps> = ({
    entries, refreshEntries, setStatus, handleDelete,
    handlePasswordChange, newPassword, setNewPassword
}) => {
    const [adminSearch, setAdminSearch] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [word, setWord] = useState('');
    const [category, setCategory] = useState('순수어');
    const [description, setDescription] = useState('');
    const [imagePrompt, setImagePrompt] = useState('');
    const [visualBlocks, setVisualBlocks] = useState<VisualBlock[]>([]);
    const [isKraft, setIsKraft] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!word || !description) return;

        try {
            if (editingId) {
                await updateWordEntry(editingId, { word, category, description, imagePrompt, visualBlocks, isKraft });
                setStatus('Updated successfully!');
            } else {
                await addWordEntry({ word, category, description, imagePrompt, visualBlocks, isKraft });
                setStatus('Added successfully!');
            }

            resetForm();
            refreshEntries();
            setTimeout(() => setStatus(''), 3000);
        } catch (error: any) {
            console.error(error);
            if (error.message === 'STORAGE_QUOTA_EXCEEDED') {
                setStatus('Error: Storage limit exceeded. Try a smaller image.');
            } else {
                setStatus('Failed to save. Please try again.');
            }
        }
    };

    const resetForm = () => {
        setWord('');
        setCategory('순수어');
        setDescription('');
        setImagePrompt('');
        setVisualBlocks([]);
        setIsKraft(false);
        setEditingId(null);
    };

    const handleEdit = (entry: WordEntry) => {
        setEditingId(entry.id);
        setWord(entry.word);
        setCategory(entry.category);
        setDescription(entry.description);
        setImagePrompt(entry.imagePrompt);
        setVisualBlocks(entry.visualBlocks || []);
        setIsKraft(entry.isKraft || false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelEdit = () => {
        resetForm();
    };

    const addVisualBlock = (url: string, type: 'upload' | 'gemini') => {
        const newBlock: VisualBlock = {
            id: `block-${Date.now()}`,
            type,
            url
        };
        setVisualBlocks(prev => [...prev, newBlock]);
    };

    const removeVisualBlock = (id: string) => {
        setVisualBlocks(prev => prev.filter(b => b.id !== id));
    };

    const updateVisualBlockCaption = (id: string, caption: string) => {
        setVisualBlocks(prev => prev.map(b => b.id === id ? { ...b, caption } : b));
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const formData = new FormData();
            formData.append('file', file);
            const response = await fetch('/api/upload', { method: 'POST', body: formData });
            if (!response.ok) throw new Error('Upload failed');
            const { url } = await response.json();
            addVisualBlock(url, 'upload');
        } catch (error) {
            console.error('Dictionary image upload failed:', error);
            alert('IMAGE UPLOAD FAILED');
        } finally {
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const addVideoBlock = () => {
        const url = prompt('Enter Video URL (YouTube or Vimeo):');
        if (!url) return;

        let embedUrl = url;
        // Basic YouTube Parser
        if (url.includes('youtube.com/watch?v=')) {
            const videoId = url.split('v=')[1]?.split('&')[0];
            embedUrl = `https://www.youtube.com/embed/${videoId}`;
        } else if (url.includes('youtu.be/')) {
            const videoId = url.split('youtu.be/')[1]?.split('?')[0];
            embedUrl = `https://www.youtube.com/embed/${videoId}`;
        } else if (url.includes('vimeo.com/')) {
            const videoId = url.split('vimeo.com/')[1]?.split('?')[0];
            embedUrl = `https://player.vimeo.com/video/${videoId}`;
        }

        const newBlock: VisualBlock = {
            id: `block-${Date.now()}`,
            type: 'video',
            url: embedUrl
        };
        setVisualBlocks(prev => [...prev, newBlock]);
    };

    const handleAIGenerate = async () => {
        if (!imagePrompt) {
            alert('Please enter an AI Image Prompt first.');
            return;
        }
        setIsGenerating(true);
        setStatus('Asking Gemini 3 Pro...');

        const generateWithPollinations = async (prompt: string) => {
            setStatus('Gemini busy/unavailable. Falling back to Flux...');
            await new Promise(r => setTimeout(r, 1000)); // UI delay
            const encodedPrompt = encodeURIComponent(prompt);
            const generatedUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&model=flux&nologo=true&seed=${Math.floor(Math.random() * 1000000)}`;
            addVisualBlock(generatedUrl, 'gemini');
            setStatus('Generated via Backup Model (Flux).');
        };

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 45000);

            const response = await fetch('/api/gemini/image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', },
                body: JSON.stringify({ prompt: imagePrompt }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);
            const data = await response.json();

            if (!response.ok) throw new Error(data.error || 'Failed to generate image');

            if (data.success && data.imageUrl) {
                addVisualBlock(data.imageUrl, 'gemini');
                setStatus('Gemini generation successful! Check the list below.');
            } else {
                throw new Error('No image data received');
            }

        } catch (error: any) {
            if (error.name === 'AbortError') {
                console.warn('Gemini request timed out (15s). Switching to fallback.');
            } else {
                console.error('Primary Gen Failed, attempting fallback:', error);
            }

            try {
                await generateWithPollinations(imagePrompt);
            } catch (fallbackError) {
                console.error(fallbackError);
                setStatus(`All generation methods failed.`);
            }
        } finally {
            setIsGenerating(false);
            setTimeout(() => setStatus(''), 5000);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
            e.preventDefault();
        }
    };

    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 30;

    const filteredEntries = entries.filter(e => e.word.toLowerCase().includes(adminSearch.toLowerCase()));
    const totalPages = Math.ceil(filteredEntries.length / ITEMS_PER_PAGE);

    // Reset to page 1 when search changes
    React.useEffect(() => {
        setCurrentPage(1);
    }, [adminSearch]);

    const currentEntries = filteredEntries.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    return (
        <>
            <div className="upload-form">
                <h2 style={{ marginBottom: '1rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {editingId ? <Edit2 size={16} /> : <Plus size={16} />}
                    {editingId ? `Editing: ${word}` : 'Register New Ninnik Term'}
                </h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Word</label>
                        <input
                            type="text"
                            className="admin-input"
                            value={word}
                            onChange={(e) => setWord(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="e.g. Ninnik-Prime"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Category</label>
                        <select
                            className="admin-input"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                        >
                            <option>순수어</option>
                            <option>기존어</option>
                            <option>합성어</option>
                            <option>청록전쟁편수록</option>
                            <option>천개의문</option>
                            <option>생물</option>
                            <option>반생물</option>
                            <option>지명</option>
                            <option>캐릭터</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Description</label>
                        <textarea
                            className="admin-input"
                            style={{ height: '100px', resize: 'vertical' }}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>AI Image Prompt</label>
                        <div className="admin-input-group-stack" style={{ display: 'flex', gap: '0.5rem' }}>
                            <input
                                type="text"
                                className="admin-input"
                                style={{ marginBottom: 0 }}
                                value={imagePrompt}
                                onChange={(e) => setImagePrompt(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Visual description for AI generation..."
                            />
                            <button
                                type="button"
                                onClick={handleAIGenerate}
                                disabled={isGenerating}
                                className={`admin-btn ${isGenerating ? 'gemini-thinking' : ''}`}
                                style={{
                                    width: 'auto',
                                    padding: '0 1.5rem',
                                    background: isGenerating ? 'linear-gradient(90deg, #4285F4, #9B72CB, #D96570)' : '#8A2BE2',
                                    color: 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                <Sparkles size={18} className={isGenerating ? 'animate-spin' : ''} />
                                {isGenerating ? 'GEMINI THINKING...' : 'GEMINI GEN'}
                            </button>
                        </div>
                    </div>

                    <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1.5rem', marginBottom: '2rem' }}>
                        <input
                            type="checkbox"
                            id="isKraft"
                            checked={isKraft}
                            onChange={(e) => setIsKraft(e.target.checked)}
                            style={{ width: '20px', height: '20px' }}
                        />
                        <label htmlFor="isKraft" style={{ padding: 0, margin: 0, cursor: 'pointer' }}>
                            Add to NINNIKKRAFT Portfolio
                        </label>
                    </div>

                    <div className="form-group">
                        <label>Visual Sections ({visualBlocks.length})</label>
                        <div className="admin-visual-list" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1rem' }}>
                            {visualBlocks.map((block) => (
                                <div key={block.id} style={{ border: '1px solid #222', padding: '1.5rem', background: '#0a0a0a' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                        <span style={{ fontSize: '0.7rem', color: '#555', letterSpacing: '0.1em' }}>
                                            {block.type === 'gemini' ? 'GEMINI GENERATION' : block.type === 'video' ? 'VIDEO CONTENT' : 'MANUAL UPLOAD'}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => removeVisualBlock(block.id)}
                                            style={{ background: 'transparent', border: 'none', color: '#ff4444', cursor: 'pointer', fontSize: '0.8rem' }}
                                        >
                                            REMOVE SECTION
                                        </button>
                                    </div>
                                    {block.type === 'video' ? (
                                        <div style={{ width: '100%', aspectRatio: '16/9', background: '#000', marginBottom: '1rem' }}>
                                            <iframe
                                                src={block.url}
                                                style={{ width: '100%', height: '100%', border: 'none' }}
                                                allowFullScreen
                                            />
                                        </div>
                                    ) : (
                                        <img src={block.url} alt="Visual Section" style={{ width: '100%', maxHeight: '400px', objectFit: 'contain', background: '#000', marginBottom: '1rem' }} />
                                    )}
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label style={{ fontSize: '0.75rem', color: '#888' }}>Section Caption</label>
                                        <textarea
                                            className="admin-input"
                                            style={{ marginBottom: 0, fontSize: '0.85rem', height: '60px', resize: 'vertical' }}
                                            value={block.caption || ''}
                                            onChange={(e) => updateVisualBlockCaption(block.id, e.target.value)}
                                            placeholder="Describe this specific visual (Enter for new line)..."
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="admin-input-group-stack" style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                            <div style={{ position: 'relative', flex: 1 }}>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    id="multi-upload"
                                    ref={fileInputRef}
                                    style={{ display: 'none' }}
                                />
                                <label
                                    htmlFor="multi-upload"
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.5rem',
                                        background: '#222',
                                        padding: '1rem',
                                        cursor: 'pointer',
                                        fontSize: '0.8rem',
                                        color: '#888'
                                    }}
                                >
                                    <Plus size={16} /> ADD MANUAL UPLOAD
                                </label>
                            </div>
                            <button
                                type="button"
                                onClick={handleAIGenerate}
                                disabled={isGenerating}
                                className={`admin-btn ${isGenerating ? 'gemini-thinking' : ''}`}
                                style={{
                                    flex: 1,
                                    background: isGenerating ? 'linear-gradient(90deg, #4285F4, #9B72CB, #D96570)' : '#333',
                                    color: isGenerating ? 'white' : '#888',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem'
                                }}
                            >
                                <Sparkles size={16} className={isGenerating ? 'animate-spin' : ''} />
                                {isGenerating ? 'GEMINI THINKING...' : 'ADD GEMINI'}
                            </button>
                            <button
                                type="button"
                                onClick={addVideoBlock}
                                className="admin-btn"
                                style={{
                                    flex: 1,
                                    background: '#333',
                                    color: '#888',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem'
                                }}
                            >
                                <Plus size={16} /> ADD VIDEO URL
                            </button>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button type="submit" className="admin-btn">
                            {editingId ? 'UPDATE ENTRY' : 'UPLOAD TO DICTIONARY'}
                        </button>
                        {editingId && (
                            <button type="button" onClick={cancelEdit} className="admin-btn" style={{ background: '#333', color: 'white' }}>
                                CANCEL
                            </button>
                        )}
                    </div>
                </form>
            </div>

            <div className="upload-form" style={{ marginTop: '2rem' }}>
                <h2 style={{ marginBottom: '1.5rem', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Lock size={20} />
                    Security Settings
                </h2>
                <form onSubmit={handlePasswordChange}>
                    <div className="form-group">
                        <label>New Admin Password</label>
                        <div className="admin-input-group-stack" style={{ display: 'flex', gap: '0.5rem' }}>
                            <input
                                type="password"
                                className="admin-input"
                                style={{ marginBottom: 0 }}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Enter new password..."
                                required
                            />
                            <button
                                type="submit"
                                className="admin-btn"
                                style={{ width: 'auto', padding: '1rem 1.5rem', background: '#333', color: 'white' }}
                            >
                                UPDATE PASSWORD
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            <div style={{ marginTop: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <h2 style={{ fontWeight: '300', margin: 0, fontSize: '0.9rem' }}>EXISTING ENTRIES ({filteredEntries.length})</h2>
                    <input
                        type="text"
                        className="admin-input"
                        style={{ maxWidth: '200px', margin: 0, fontSize: '0.75rem', padding: '0.4rem 0.6rem' }}
                        placeholder="Filter..."
                        value={adminSearch}
                        onChange={(e) => setAdminSearch(e.target.value)}
                    />
                </div>
                <div style={{ background: '#111', borderTop: '1px solid #222' }}>
                    {currentEntries.map(entry => (
                        <div key={entry.id} className="dictionary-list-item" style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '1rem',
                            borderBottom: '1px solid #222'
                        }}>
                            <div>
                                <span style={{ fontWeight: '500' }}>{entry.word}</span>
                                <span style={{ marginLeft: '0.5rem', fontSize: '0.8rem', color: '#333' }}>#{entry.indexNumber}</span>
                                <span style={{ marginLeft: '1rem', fontSize: '0.8rem', color: '#555' }}>{entry.category}</span>
                                {entry.isKraft && (
                                    <span style={{ marginLeft: '1rem', fontSize: '0.6rem', background: '#333', color: '#888', padding: '0.2rem 0.5rem', letterSpacing: '0.1em' }}>KRAFT</span>
                                )}
                            </div>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button onClick={() => handleEdit(entry)} style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer' }}>
                                    <Edit2 size={16} />
                                </button>
                                <button onClick={() => handleDelete(entry.id)} style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer' }}>
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                    {currentEntries.length === 0 && (
                        <p style={{ padding: '1rem', color: '#444', fontSize: '0.8rem', textAlign: 'center' }}>
                            No entries found.
                        </p>
                    )}
                </div>
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                />
            </div>
        </>
    );
};
