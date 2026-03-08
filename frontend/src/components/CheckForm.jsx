import { useState, useEffect } from 'react';
import { submitCheck, updateCheck } from '../api';
import ScoreResult from './ScoreResult';
import { STORES_DATA } from '../data/storesData';
import {
    BLOCK1_ITEMS, BLOCK3_ITEMS, BLOCK4_ITEMS,
    BLOCK5_ITEMS, BLOCK7_ITEMS, BLOCK8_ITEMS,
} from './checklistData';

const OTHER_OPTION = '__other__';

// ─── Subcomponents ────────────────────────────────────────────────────────
function CheckItem({ item, value, onChange }) {
    return (
        <label className={`check-item ${value ? 'checked' : ''}`}>
            <input
                type="checkbox"
                checked={value}
                onChange={() => onChange(item.key)}
            />
            <span className="check-label">{item.label}</span>
            <span className="check-weight">{item.weight}%</span>
        </label>
    );
}

function BlockSection({ num, title, blockWeight, children }) {
    return (
        <section className="block-section">
            <div className="block-header">
                <span className="block-num">Блок {num}</span>
                <h3>{title}</h3>
                <span className="block-weight">Вес: {blockWeight}%</span>
            </div>
            <div className="block-content">{children}</div>
        </section>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────
// Props:
//   creds        — { username, password }
//   onResult     — called with result after submit/update
//   initialData  — pre-fill from a saved check's payload (edit mode)
//   editCheckId  — ID of check being edited (edit mode)
//   onCancelEdit — called when user cancels edit
export default function CheckForm({ creds, onResult, initialData, editCheckId, onCancelEdit }) {
    const isEditMode = !!editCheckId;

    function initChecks(data) {
        if (!data) return {};
        const keys = [...BLOCK1_ITEMS, ...BLOCK3_ITEMS, ...BLOCK4_ITEMS, ...BLOCK5_ITEMS, ...BLOCK7_ITEMS, ...BLOCK8_ITEMS]
            .map(i => i.key);
        const result = {};
        keys.forEach(k => { if (data[k]) result[k] = true; });
        return result;
    }

    function initDoors(data) {
        if (!data || !data.b6_total_doors) return {};
        // We only know total closed, not per-door state — pre-check first N doors
        const closed = data.b6_closed_doors ?? 0;
        const result = {};
        for (let i = 0; i < closed; i++) result[i] = true;
        return result;
    }

    const storeFromInitial = initialData && STORES_DATA.find(s => s.storeName === initialData.store_name);
    const [storeName, setStoreName] = useState(initialData?.store_name || '');
    const [chopName, setChopName] = useState(storeFromInitial?.chopName || '');
    const [isOtherStore, setIsOtherStore] = useState(
        !!(initialData?.store_name && !STORES_DATA.some(s => s.storeName === initialData.store_name))
    );
    const [checks, setChecks] = useState(() => initChecks(initialData));
    const [b2TotalStaff, setB2TotalStaff] = useState(
        initialData?.b2_total_staff ?? storeFromInitial?.staffCount ?? 5
    );
    const [b2AbsentPosts, setB2AbsentPosts] = useState(initialData?.b2_absent_posts ?? 0);
    const [b6TotalDoors, setB6TotalDoors] = useState(initialData?.b6_total_doors ?? 3);
    const [b6ClosedDoors, setB6ClosedDoors] = useState(() => initDoors(initialData));
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [result, setResult] = useState(null);

    // Re-init if initialData changes (switching edits)
    useEffect(() => {
        const store = initialData?.store_name && STORES_DATA.find(s => s.storeName === initialData.store_name);
        setStoreName(initialData?.store_name || '');
        setChopName(store?.chopName || '');
        setIsOtherStore(!!(initialData?.store_name && !STORES_DATA.some(s => s.storeName === initialData.store_name)));
        setChecks(initChecks(initialData));
        setB2TotalStaff(initialData?.b2_total_staff ?? store?.staffCount ?? 5);
        setB2AbsentPosts(initialData?.b2_absent_posts ?? 0);
        setB6TotalDoors(initialData?.b6_total_doors ?? 3);
        setB6ClosedDoors(initDoors(initialData));
        setResult(null);
        setError('');
    }, [editCheckId]);

    function toggle(key) {
        setChecks(prev => ({ ...prev, [key]: !prev[key] }));
    }

    function toggleDoor(i) {
        setB6ClosedDoors(prev => ({ ...prev, [i]: !prev[i] }));
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (!storeName.trim()) { setError('Укажите название магазина'); return; }
        setError('');
        setLoading(true);
        try {
            const closedCount = Object.values(b6ClosedDoors).filter(Boolean).length;
            const payload = {
                store_name: storeName.trim(),
                ...checks,
                b2_total_staff: Number(b2TotalStaff),
                b2_absent_posts: Number(b2AbsentPosts),
                b6_total_doors: Number(b6TotalDoors),
                b6_closed_doors: closedCount,
            };
            let res;
            if (isEditMode) {
                res = await updateCheck(editCheckId, payload, creds.username, creds.password);
            } else {
                res = await submitCheck(payload, creds.username, creds.password);
            }
            setResult(res);
            onResult(res);
        } catch (err) {
            if (err.message === '401') {
                setError('Неверные данные авторизации');
            } else {
                setError(err.message);
            }
        } finally {
            setLoading(false);
        }
    }

    const allItems = [...BLOCK1_ITEMS, ...BLOCK3_ITEMS, ...BLOCK4_ITEMS,
    ...BLOCK5_ITEMS, ...BLOCK7_ITEMS, ...BLOCK8_ITEMS];
    const checkedCount = allItems.filter(i => checks[i.key]).length;

    return (
        <form onSubmit={handleSubmit} className="check-form">
            {/* Edit mode banner */}
            {isEditMode && (
                <div className="edit-banner">
                    ✏️ Режим редактирования — проверка #{editCheckId}
                    <button type="button" className="btn-cancel-edit" onClick={onCancelEdit}>
                        ✕ Отмена
                    </button>
                </div>
            )}

            {/* Store name */}
            <div className="store-field">
                <label>🏪 Название магазина</label>
                <select
                    value={
                        STORES_DATA.some(s => s.storeName === storeName)
                            ? storeName
                            : isOtherStore ? OTHER_OPTION : ''
                    }
                    onChange={e => {
                        const val = e.target.value;
                        if (val === OTHER_OPTION) {
                            setIsOtherStore(true);
                            setStoreName('');
                            setChopName('');
                        } else if (val) {
                            setIsOtherStore(false);
                            const store = STORES_DATA.find(s => s.storeName === val);
                            if (store) {
                                setStoreName(store.storeName);
                                setB2TotalStaff(store.staffCount);
                                setChopName(store.chopName);
                            }
                        }
                    }}
                    className="store-input store-select"
                >
                    <option value="">— Выберите магазин —</option>
                    {STORES_DATA.map(s => (
                        <option key={s.storeName} value={s.storeName}>{s.storeName}</option>
                    ))}
                    <option value={OTHER_OPTION}>Другое</option>
                </select>
                {isOtherStore && (
                    <input
                        type="text"
                        value={storeName}
                        onChange={e => setStoreName(e.target.value)}
                        placeholder="Введите название объекта..."
                        className="store-input store-input-other"
                    />
                )}
                {chopName && (
                    <div className="store-chop-badge">{chopName}</div>
                )}
            </div>

            {/* Progress */}
            <div className="form-progress">
                <span>{checkedCount} / {allItems.length} пунктов отмечено</span>
                <div className="progress-bar">
                    <div style={{ width: `${allItems.length ? checkedCount / allItems.length * 100 : 0}%` }} />
                </div>
            </div>

            {/* Block 1 */}
            <BlockSection num={1} title="Общие критерии безопасности" blockWeight={15}>
                {BLOCK1_ITEMS.map(item => (
                    <CheckItem key={item.key} item={item} value={!!checks[item.key]} onChange={toggle} />
                ))}
            </BlockSection>

            {/* Block 2 */}
            <BlockSection num={2} title="% присутствия сотрудников ЧОП" blockWeight={15}>
                <div className="numeric-row">
                    <label>
                        👤 Штатная численность ЧОП:
                        <input type="number" min={1} max={50} value={b2TotalStaff}
                            onChange={e => setB2TotalStaff(e.target.value)} />
                    </label>
                    <label>
                        ❌ Отсутствующих постов:
                        <input type="number" min={0} max={b2TotalStaff} value={b2AbsentPosts}
                            onChange={e => setB2AbsentPosts(e.target.value)} />
                    </label>
                </div>
                <div className="block-hint">
                    {Number(b2TotalStaff) <= 5
                        ? '⚠️ Штат ≤5: отсутствие даже 1 поста = 0%'
                        : '⚠️ Штат ≥6: 1 пост = 50%, 2 поста = 0%'}
                </div>
            </BlockSection>

            {/* Block 3 */}
            <BlockSection num={3} title="КПП (входные группы)" blockWeight={15}>
                {BLOCK3_ITEMS.map(item => (
                    <CheckItem key={item.key} item={item} value={!!checks[item.key]} onChange={toggle} />
                ))}
            </BlockSection>

            {/* Block 4 */}
            <BlockSection num={4} title="Кассы" blockWeight={10}>
                {BLOCK4_ITEMS.map(item => (
                    <CheckItem key={item.key} item={item} value={!!checks[item.key]} onChange={toggle} />
                ))}
            </BlockSection>

            {/* Block 5 */}
            <BlockSection num={5} title="Инкасса" blockWeight={10}>
                {BLOCK5_ITEMS.map(item => (
                    <CheckItem key={item.key} item={item} value={!!checks[item.key]} onChange={toggle} />
                ))}
            </BlockSection>

            {/* Block 6 */}
            <BlockSection num={6} title="Двери (оборудованные СКУД)" blockWeight={5}>
                <div className="numeric-row">
                    <label>
                        🚪 Количество дверей со СКУД:
                        <input type="number" min={1} max={20} value={b6TotalDoors}
                            onChange={e => {
                                const n = parseInt(e.target.value) || 1;
                                setB6TotalDoors(n);
                                setB6ClosedDoors({});
                            }} />
                    </label>
                </div>
                <div className="doors-grid">
                    {Array.from({ length: Number(b6TotalDoors) }).map((_, i) => (
                        <label key={i} className={`check-item ${b6ClosedDoors[i] ? 'checked' : ''}`}>
                            <input type="checkbox" checked={!!b6ClosedDoors[i]} onChange={() => toggleDoor(i)} />
                            <span className="check-label">Дверь #{i + 1} закрыта</span>
                            <span className="check-weight">{(100 / Number(b6TotalDoors)).toFixed(1)}%</span>
                        </label>
                    ))}
                </div>
                <div className="block-hint">
                    Закрыто {Object.values(b6ClosedDoors).filter(Boolean).length} из {b6TotalDoors} дверей
                </div>
            </BlockSection>

            {/* Block 7 */}
            <BlockSection num={7} title="ЧОП — Внешний вид" blockWeight={15}>
                {BLOCK7_ITEMS.map(item => (
                    <CheckItem key={item.key} item={item} value={!!checks[item.key]} onChange={toggle} />
                ))}
            </BlockSection>

            {/* Block 8 */}
            <BlockSection num={8} title="Мониторка (комната оператора)" blockWeight={15}>
                {BLOCK8_ITEMS.map(item => (
                    <CheckItem key={item.key} item={item} value={!!checks[item.key]} onChange={toggle} />
                ))}
            </BlockSection>

            {/* Error */}
            {error && <div className="form-error">⚠️ {error}</div>}

            {/* Submit */}
            <button type="submit" className="btn-submit" disabled={loading}>
                {loading
                    ? '⏳ Сохранение...'
                    : isEditMode ? '💾 Сохранить изменения' : '🧮 Рассчитать и сохранить'}
            </button>

            {/* Result */}
            {result && <ScoreResult result={result} />}
        </form>
    );
}
