import { useState } from 'react';
import { submitCheck } from '../api';
import ScoreResult from './ScoreResult';

// ─── Static checklist data ────────────────────────────────────────────────
const BLOCK1_ITEMS = [
    { key: 'b1_1', label: 'Инструктаж сотрудников ЧОП за 15–20 мин до открытия', weight: 15 },
    { key: 'b1_2', label: 'Осмотр уходящего персонала при выходе', weight: 15 },
    { key: 'b1_3', label: 'Досмотр мусора с участием ЧОП', weight: 15 },
    { key: 'b1_4', label: 'Антикражные рамки исправны, проверяются при открытии', weight: 10 },
    { key: 'b1_5', label: 'Эвакуационные выходы ничем не заставлены', weight: 15 },
    { key: 'b1_6', label: 'Соблюдены правила снятия магазина с охраны', weight: 10 },
    { key: 'b1_7', label: 'Соблюдены правила постановки магазина на охрану', weight: 10 },
    { key: 'b1_8', label: 'В серверной отсутствует мусор и посторонние предметы', weight: 10 },
];

const BLOCK3_ITEMS = [
    { key: 'b3_1', label: 'Сотрудник ЧОП реагирует на сработку антикражных рамок', weight: 30 },
    { key: 'b3_2', label: 'Входные группы открыты вовремя', weight: 15 },
    { key: 'b3_3', label: 'Входные группы закрыты вовремя', weight: 15 },
    { key: 'b3_4', label: 'Входные группы чистые (отсутствует мусор)', weight: 10 },
    { key: 'b3_5', label: 'Сотрудник в зоне видимости камер, у антикражных рамок', weight: 30 },
];

const BLOCK4_ITEMS = [
    { key: 'b4_1', label: 'Деньги отсутствуют вне денежного ящика', weight: '33.3' },
    { key: 'b4_2', label: 'Денежный ящик визуально закрыт', weight: '33.3' },
    { key: 'b4_3', label: 'Алармосъемник закрыт на неработающей кассе', weight: '33.3' },
];

const BLOCK5_ITEMS = [
    { key: 'b5_1', label: 'Дверь в помещение инкассы закрыта (СКУД)', weight: '33.3' },
    { key: 'b5_2', label: 'Сейф в инкассе закрыт в отсутствие сотрудников', weight: '33.3' },
    { key: 'b5_3', label: 'Денежный ящик отсутствует на столе кассира', weight: '33.3' },
];

const BLOCK7_ITEMS = [
    { key: 'b7_1', label: 'Внешний вид соответствует договору (костюм, обувь, рубашка)', weight: 25 },
    { key: 'b7_2', label: 'Одежда аккуратная: подходит по размеру, не мятая', weight: 20 },
    { key: 'b7_3', label: 'Отсутствие татуировок и пирсинга на видимых частях тела', weight: 10 },
    { key: 'b7_4', label: 'Наличие нагрудного бейджа', weight: 10 },
    { key: 'b7_5', label: 'Наличие беспроводной гарнитуры', weight: 10 },
    { key: 'b7_6', label: 'Сотрудник не отвлекается на телефон/гаджет на посту', weight: 25 },
];

const BLOCK8_ITEMS = [
    { key: 'b8_1', label: 'Оператор ВН ЧОП находится на рабочем месте', weight: 25 },
    { key: 'b8_2', label: 'Сотрудник реагирует на сработку СРЛ', weight: 15 },
    { key: 'b8_3', label: 'В помещении мониторной отсутствуют посторонние лица', weight: 20 },
    { key: 'b8_4', label: 'Оператор не отвлекается от выполнения должностных инструкций', weight: 20 },
    { key: 'b8_5', label: 'Нет приема пищи в мониторной (допускаются напитки)', weight: 10 },
    { key: 'b8_6', label: 'В мониторной порядок, отсутствует еда и товар', weight: 10 },
];

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
export default function CheckForm({ creds, onResult }) {
    const [storeName, setStoreName] = useState('');
    const [checks, setChecks] = useState({});
    const [b2TotalStaff, setB2TotalStaff] = useState(5);
    const [b2AbsentPosts, setB2AbsentPosts] = useState(0);
    const [b6TotalDoors, setB6TotalDoors] = useState(3);
    const [b6ClosedDoors, setB6ClosedDoors] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [result, setResult] = useState(null);

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
            const res = await submitCheck(payload, creds.username, creds.password);
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
    const totalItems = allItems.length + Number(b6TotalDoors);

    return (
        <form onSubmit={handleSubmit} className="check-form">
            {/* Store name */}
            <div className="store-field">
                <label>🏪 Название магазина</label>
                <input
                    type="text"
                    value={storeName}
                    onChange={e => setStoreName(e.target.value)}
                    placeholder="Введите название объекта..."
                    className="store-input"
                />
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
                {loading ? '⏳ Отправка...' : '🧮 Рассчитать и сохранить'}
            </button>

            {/* Result */}
            {result && <ScoreResult result={result} />}
        </form>
    );
}
