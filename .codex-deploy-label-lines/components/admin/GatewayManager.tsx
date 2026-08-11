import React, { useState } from 'react';
import { GatewayLocation, addGateway, updateGateway, deleteGateway } from '@/lib/gateway-data';
import { Edit2, Trash2, MapPin, Activity } from 'lucide-react';
import { Pagination } from './Pagination';

interface GatewayManagerProps {
    gateways: GatewayLocation[];
    refreshEntries: () => Promise<void>;
    setStatus: (status: string) => void;
}

export const GatewayManager: React.FC<GatewayManagerProps> = ({ gateways, refreshEntries, setStatus }) => {
    const [editingGwId, setEditingGwId] = useState<string | null>(null);
    const [gwName, setGwName] = useState('');
    const [gwNumber, setGwNumber] = useState('');
    const [gwAddress, setGwAddress] = useState('');
    const [gwDesc, setGwDesc] = useState('');
    const [gwX, setGwX] = useState(50);
    const [gwY, setGwY] = useState(50);
    const [gwZ, setGwZ] = useState(0.5);
    const [gwLat, setGwLat] = useState(37.5665);
    const [gwLng, setGwLng] = useState(126.9780);
    const [gwParticipation, setGwParticipation] = useState(0);
    const [gwSync, setGwSync] = useState(0);
    const [gwImageUrl, setGwImageUrl] = useState('');
    const [gwRegion, setGwRegion] = useState('수도권');
    const [isSearching, setIsSearching] = useState(false);

    // Sort Gateways by Number (Ascending)
    const sortedGateways = [...gateways].sort((a, b) => {
        const numA = a.gatewayNumber || 'ZZZZ';
        const numB = b.gatewayNumber || 'ZZZZ';
        return numA.localeCompare(numB, undefined, { numeric: true });
    });

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 30;
    const totalPages = Math.ceil(sortedGateways.length / ITEMS_PER_PAGE);
    const currentGateways = sortedGateways.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const REGIONS = [
        '서울', '인천', '경기도', '부산', '대구', '광주', '대전', '울산', '세종',
        '강원도', '충청도', '전라도', '경상도', '제주도', '울릉도/독도'
    ];

    const resetForm = () => {
        setEditingGwId(null);
        setGwName('');
        setGwNumber('');
        setGwAddress('');
        setGwDesc('');
        setGwX(50);
        setGwY(50);
        setGwZ(0.5);
        setGwLat(37.5665);
        setGwLng(126.9780);
        setGwParticipation(0);
        setGwSync(0);
        setGwImageUrl('');
        setGwRegion('수도권');
    };

    const handleGwSubmit = async () => {
        // validation
        if (!gwName.trim()) {
            setStatus('Error: Gateway Name is required.');
            setTimeout(() => setStatus(''), 3000);
            return;
        }

        const gwData = {
            name: gwName,
            gatewayNumber: gwNumber,
            address: gwAddress,
            desc: gwDesc,
            x: Number(gwX),
            y: Number(gwY),
            z: Number(gwZ),
            lat: Number(gwLat),
            lng: Number(gwLng),
            participation: Number(gwParticipation),
            sync: Number(gwSync),
            mainstream: 0, // Default value for new gateways
            imageUrl: gwImageUrl,
            region: gwRegion
        };

        if (editingGwId) {
            await updateGateway(editingGwId, gwData);
            setStatus('Gateway updated!');
        } else {
            await addGateway(gwData);
            setStatus('Gateway added!');
        }

        resetForm();
        await refreshEntries();
        setTimeout(() => setStatus(''), 3000);
    };

    const handleGwEdit = (gw: GatewayLocation) => {
        setEditingGwId(gw.id);
        setGwName(gw.name);
        setGwNumber(gw.gatewayNumber || '');
        setGwAddress(gw.address);
        setGwDesc(gw.desc);
        setGwX(gw.x);
        setGwY(gw.y);
        setGwZ(gw.z);
        setGwLat(gw.lat);
        setGwLng(gw.lng);
        setGwParticipation(gw.participation);
        setGwSync(gw.sync);
        setGwImageUrl(gw.imageUrl || '');
        setGwRegion(gw.region || '수도권');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleGwDelete = async (id: string) => {
        if (confirm('Delete this gateway permanently?')) {
            await deleteGateway(id);
            await refreshEntries();
            setStatus('Gateway deleted.');
            setTimeout(() => setStatus(''), 3000);
        }
    };

    // --- Transverse Mercator Projection Logic ---

    interface ProjectedCoords { x: number; y: number; }

    const transverseMercator = (lat: number, lon: number, lon0: number = 127.5): ProjectedCoords => {
        const a = 6378137.0;
        const f = 1 / 298.257223563;
        const e2 = 2 * f - f * f;
        const latRad = lat * Math.PI / 180;
        const lonRad = lon * Math.PI / 180;
        const lon0Rad = lon0 * Math.PI / 180;
        const dlon = lonRad - lon0Rad;
        const N = a / Math.sqrt(1 - e2 * Math.sin(latRad) ** 2);
        const T = Math.tan(latRad) ** 2;
        const C = (e2 / (1 - e2)) * Math.cos(latRad) ** 2;
        const A = dlon * Math.cos(latRad);
        const M = a * (
            (1 - e2 / 4 - 3 * e2 ** 2 / 64 - 5 * e2 ** 3 / 256) * latRad -
            (3 * e2 / 8 + 3 * e2 ** 2 / 32 + 45 * e2 ** 3 / 1024) * Math.sin(2 * latRad) +
            (15 * e2 ** 2 / 256 + 45 * e2 ** 3 / 1024) * Math.sin(4 * latRad) -
            (35 * e2 ** 3 / 3072) * Math.sin(6 * latRad)
        );
        const x = N * (
            A +
            (1 - T + C) * A ** 3 / 6 +
            (5 - 18 * T + T ** 2 + 72 * C - 58 * (e2 / (1 - e2))) * A ** 5 / 120
        );
        const y = M + N * Math.tan(latRad) * (
            A ** 2 / 2 +
            (5 - T + 9 * C + 4 * C ** 2) * A ** 4 / 24 +
            (61 - 58 * T + T ** 2 + 600 * C - 330 * (e2 / (1 - e2))) * A ** 6 / 720
        );
        return { x, y };
    };

    // Reference Bounds Calculation based on key locations
    const calculateMapBounds = () => {
        const locations = [
            { lat: 37.5665, lon: 126.9780 }, // Seoul
            { lat: 35.1796, lon: 129.0756 }, // Busan
            { lat: 33.4996, lon: 126.5312 }, // Jeju
            { lat: 37.2428, lon: 131.8689 }, // Dokdo
            { lat: 36.7500, lon: 124.6167 }, // Gyeokryeolbiyeoldo (West)
            { lat: 38.6100, lon: 128.3500 }, // Goseong (North approx)
        ];

        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        locations.forEach(loc => {
            const proj = transverseMercator(loc.lat, loc.lon);
            minX = Math.min(minX, proj.x);
            maxX = Math.max(maxX, proj.x);
            minY = Math.min(minY, proj.y);
            maxY = Math.max(maxY, proj.y);
        });

        // Add padding (approx 5% similar to the user's provided SVG padding logic)
        const paddingX = (maxX - minX) * 0.1;
        const paddingY = (maxY - minY) * 0.1;

        return {
            minX: minX - paddingX,
            maxX: maxX + paddingX,
            minY: minY - paddingY,
            maxY: maxY + paddingY
        };
    };

    const handleAddressSearch = async () => {
        if (!gwAddress) return;
        setIsSearching(true);
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(gwAddress)}&countrycodes=kr`);
            const data = await response.json();
            if (data && data.length > 0) {
                const lat = parseFloat(data[0].lat);
                const lng = parseFloat(data[0].lon);
                setGwLat(lat);
                setGwLng(lng);

                // 1. Project GPS to Meters (TM)
                const proj = transverseMercator(lat, lng);
                const bounds = calculateMapBounds();

                // 2. Convert Meters to Percentage (0-100%)
                // X: (current - min) / span * 100
                // Y: 100 - ((current - min) / span * 100)  <-- Flip Y for CSS/SVG
                const xPercent = ((proj.x - bounds.minX) / (bounds.maxX - bounds.minX)) * 100;
                const yPercent = 100 - ((proj.y - bounds.minY) / (bounds.maxY - bounds.minY)) * 100;

                setGwX(Math.round(xPercent * 10) / 10);
                setGwY(Math.round(yPercent * 10) / 10);

                setStatus(`Found: ${lat.toFixed(4)}, ${lng.toFixed(4)} -> Map: ${xPercent.toFixed(1)}%, ${yPercent.toFixed(1)}%`);
            } else {
                setStatus('Error: Address not found.');
            }
        } catch (error) {
            console.error(error);
            setStatus('Error: Geocoding failed.');
        } finally {
            setIsSearching(false);
            setTimeout(() => setStatus(''), 3000);
        }
    };

    const handleGwImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setGwImageUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="gateway-manager-view">
            <div className="upload-form">
                <h2 style={{ marginBottom: '1.5rem', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <MapPin size={20} />
                    {editingGwId ? `Editing Gateway: ${gwName}` : 'Register New Resonance Gateway'}
                </h2>
                <div>
                    <div className="form-row-2">
                        <div className="form-group" style={{ flex: 1 }}>
                            <label>Gateway Number (e.g. 001)</label>
                            <input
                                type="text"
                                className="admin-input"
                                value={gwNumber}
                                onChange={(e) => setGwNumber(e.target.value)}
                                placeholder="000"
                            />
                        </div>
                        <div className="form-group" style={{ flex: 3 }}>
                            <label>Gateway Name</label>
                            <input
                                type="text"
                                className="admin-input"
                                value={gwName}
                                onChange={(e) => setGwName(e.target.value)}
                                placeholder="e.g. Seoul Station Hub"
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Region</label>
                        <select
                            className="admin-input"
                            value={gwRegion}
                            onChange={(e) => setGwRegion(e.target.value)}
                        >
                            {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Address (for Auto-Coordinate)</label>
                        <div className="admin-input-group-stack">
                            <input
                                type="text"
                                className="admin-input"
                                value={gwAddress}
                                onChange={(e) => setGwAddress(e.target.value)}
                                placeholder="e.g. 서울특별시 중구 세종대로 110"
                            />
                            <button
                                type="button"
                                onClick={handleAddressSearch}
                                disabled={isSearching}
                                className="admin-btn"
                                style={{ width: 'auto', background: isSearching ? '#555' : '#444' }}
                            >
                                {isSearching ? 'SEARCHING...' : 'FIND COORDINATES'}
                            </button>
                        </div>
                    </div>

                    <div className="form-row-3">
                        <div className="form-group">
                            <label>Lat</label>
                            <input type="number" step="0.0001" className="admin-input" value={isNaN(gwLat) ? '' : gwLat} onChange={(e) => setGwLat(parseFloat(e.target.value))} />
                        </div>
                        <div className="form-group">
                            <label>Lng</label>
                            <input type="number" step="0.0001" className="admin-input" value={isNaN(gwLng) ? '' : gwLng} onChange={(e) => setGwLng(parseFloat(e.target.value))} />
                        </div>
                    </div>

                    <div className="form-row-3">
                        <div className="form-group">
                            <label>SVG X (%)</label>
                            <input type="number" step="0.1" className="admin-input" value={isNaN(gwX) ? '' : gwX} onChange={(e) => setGwX(parseFloat(e.target.value))} />
                        </div>
                        <div className="form-group">
                            <label>SVG Y (%)</label>
                            <input type="number" step="0.1" className="admin-input" value={isNaN(gwY) ? '' : gwY} onChange={(e) => setGwY(parseFloat(e.target.value))} />
                        </div>
                        <div className="form-group">
                            <label>Z-Index</label>
                            <input type="number" step="0.1" className="admin-input" value={isNaN(gwZ) ? '' : gwZ} onChange={(e) => setGwZ(parseFloat(e.target.value))} />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Description</label>
                        <textarea
                            className="admin-input"
                            style={{ height: '80px' }}
                            value={gwDesc}
                            onChange={(e) => setGwDesc(e.target.value)}
                        />
                    </div>

                    <div className="form-group">
                        <label>Gateway Image</label>
                        <input type="file" accept="image/*" onChange={handleGwImageUpload} className="admin-input" />
                        {gwImageUrl && <img src={gwImageUrl} alt="Preview" style={{ marginTop: '10px', maxHeight: '100px', borderRadius: '4px' }} />}
                    </div>

                    <div className="form-row-2">
                        <div className="form-group">
                            <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Activity size={14} /> Participation (0-100)</label>
                            <input type="number" className="admin-input" value={gwParticipation} onChange={(e) => setGwParticipation(Number(e.target.value))} />
                        </div>
                        <div className="form-group">
                            <label>Sync Rate (0-100)</label>
                            <input type="number" className="admin-input" value={gwSync} onChange={(e) => setGwSync(Number(e.target.value))} />
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                        <button type="button" onClick={handleGwSubmit} className="admin-btn">
                            {editingGwId ? 'UPDATE GATEWAY' : 'ADD GATEWAY'}
                        </button>
                        {editingGwId && (
                            <button type="button" onClick={resetForm} className="admin-btn" style={{ background: '#333', color: 'white' }}>
                                CANCEL
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div style={{ marginTop: '3rem' }}>
                <h2 style={{ fontWeight: '300', marginBottom: '1rem', fontSize: '0.9rem' }}>REGISTERED GATEWAYS ({gateways.length})</h2>
                <div style={{ background: '#111', borderTop: '1px solid #222' }}>
                    {currentGateways.map(gw => (
                        <div key={gw.id} className="dictionary-list-item" style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '1rem',
                            borderBottom: '1px solid #222'
                        }}>
                            <div>
                                <span style={{ fontWeight: '500', color: '#fff' }}>
                                    {gw.gatewayNumber ? <span style={{ color: '#CCFF00', marginRight: '8px', fontFamily: 'monospace' }}>[{gw.gatewayNumber}]</span> : null}
                                    {gw.name}
                                </span>
                                <span style={{ marginLeft: '10px', fontSize: '0.8rem', color: '#888' }}>{gw.region}</span>
                                <div style={{ fontSize: '0.7rem', color: '#555', marginTop: '4px' }}>{gw.address}</div>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button onClick={() => handleGwEdit(gw)} style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer' }}>
                                    <Edit2 size={16} />
                                </button>
                                <button onClick={() => handleGwDelete(gw.id)} style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer' }}>
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                />
            </div>
        </div>
    );
};
