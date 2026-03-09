/**
 * CheckViewModal.jsx — Read-only view of a full check record
 */
import { BLOCK1_ITEMS, BLOCK3_ITEMS, BLOCK4_ITEMS, BLOCK5_ITEMS, BLOCK7_ITEMS, BLOCK8_ITEMS } from './checklistData';

const gradeClass = {
    'отлично': 'badge-green',
    'хорошо': 'badge-blue',
    'удовлетворительно': 'badge-yellow',
    'неудовлетворительно': 'badge-red',
};

function ViewBlock({ num, title, blockWeight, score, children }) {
    return (
        <section className="block-section">
            <div className="block-header">
                <span className="block-num">Блок {num}</span>
                <h3>{title}</h3>
                <span className="block-weight">
                    Вес: {blockWeight}% &nbsp;|&nbsp; Балл: <strong>{score !== undefined ? score + '%' : '—'}</strong>
                </span>
            </div>
            <div className="block-content">{children}</div>
        </section>
    );
}

function ViewItem({ label, weight, checked, comment }) {
    return (
        <div className="view-item-wrap">
            <div className={`check-item ${checked ? 'checked' : ''}`} style={{ cursor: 'default', opacity: checked ? 1 : 0.55 }}>
                <span style={{ marginRight: 8 }}>{checked ? '✅' : '☐'}</span>
                <span className="check-label">{label}</span>
                <span className="check-weight">{weight}%</span>
            </div>
            {comment && (
                <div className="view-comment">Комментарий: {comment}</div>
            )}
        </div>
    );
}

export default function CheckViewModal({ check, onClose }) {
    if (!check) return null;

    const p = check.payload || {};
    const d = check.details || {};
    const totalStaff = p.b2_total_staff ?? '—';
    const b2Checks = Array.isArray(p.b2_checks) ? p.b2_checks : [];
    const comments = p.comments || {};

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="modal-header">
                    <div>
                        <h2>📋 {check.store_name}</h2>
                        <span className="modal-meta">{check.timestamp}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span className={`badge ${gradeClass[check.grade] || ''}`} style={{ fontSize: '1rem', padding: '6px 14px' }}>
                            {check.total_score}% — {check.grade}
                        </span>
                        <button className="modal-close" onClick={onClose}>✕</button>
                    </div>
                </div>

                <div className="modal-body">
                    {/* Block 1 */}
                    <ViewBlock num={1} title="Общие критерии безопасности" blockWeight={15} score={d.block_1}>
                        {BLOCK1_ITEMS.map(item => (
                            <ViewItem key={item.key} label={item.label} weight={item.weight} checked={!!p[item.key]} comment={comments[item.key]} />
                        ))}
                    </ViewBlock>

                    {/* Block 2 */}
                    <ViewBlock num={2} title="% присутствия сотрудников ЧОП" blockWeight={15} score={d.block_2}>
                        <div className="view-stat">
                            <span>👤 По штату:</span>
                            <strong>{totalStaff}</strong>
                        </div>
                        {b2Checks.length > 0 ? (
                            <table className="view-b2-table">
                                <thead>
                                    <tr><th>Дата и время</th><th>Отсутствует постов</th><th>По факту</th></tr>
                                </thead>
                                <tbody>
                                    {b2Checks.map((c, i) => {
                                        const ap = typeof c.absent_posts === 'number' ? c.absent_posts : 0;
                                        const fact = typeof totalStaff === 'number' ? totalStaff - ap : '—';
                                        return (
                                            <tr key={i}>
                                                <td>{c.datetime || '—'}</td>
                                                <td>{ap}</td>
                                                <td>{fact}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        ) : (
                            <div className="numeric-row" style={{ pointerEvents: 'none' }}>
                                <div className="view-stat">
                                    <span>❌ Отсутствует постов:</span>
                                    <strong>{p.b2_absent_posts ?? '—'}</strong>
                                </div>
                                <div className="view-stat">
                                    <span>✅ По факту:</span>
                                    <strong>{typeof totalStaff === 'number' && typeof p.b2_absent_posts === 'number' ? totalStaff - p.b2_absent_posts : '—'}</strong>
                                </div>
                            </div>
                        )}
                    </ViewBlock>

                    {/* Block 3 */}
                    <ViewBlock num={3} title="КПП (входные группы)" blockWeight={15} score={d.block_3}>
                        {BLOCK3_ITEMS.map(item => (
                            <ViewItem key={item.key} label={item.label} weight={item.weight} checked={!!p[item.key]} comment={comments[item.key]} />
                        ))}
                    </ViewBlock>

                    {/* Block 4 */}
                    <ViewBlock num={4} title="Кассы" blockWeight={10} score={d.block_4}>
                        {BLOCK4_ITEMS.map(item => (
                            <ViewItem key={item.key} label={item.label} weight={item.weight} checked={!!p[item.key]} comment={comments[item.key]} />
                        ))}
                    </ViewBlock>

                    {/* Block 5 */}
                    <ViewBlock num={5} title="Инкасса" blockWeight={10} score={d.block_5}>
                        {BLOCK5_ITEMS.map(item => (
                            <ViewItem key={item.key} label={item.label} weight={item.weight} checked={!!p[item.key]} comment={comments[item.key]} />
                        ))}
                    </ViewBlock>

                    {/* Block 6 */}
                    <ViewBlock num={6} title="Двери (СКУД)" blockWeight={5} score={d.block_6}>
                        <div className="view-stat">
                            <span>🚪 Закрыто дверей:</span>
                            <strong>{p.b6_closed_doors ?? '—'} из {p.b6_total_doors ?? '—'}</strong>
                        </div>
                    </ViewBlock>

                    {/* Block 7 */}
                    <ViewBlock num={7} title="ЧОП — Внешний вид" blockWeight={15} score={d.block_7}>
                        {BLOCK7_ITEMS.map(item => (
                            <ViewItem key={item.key} label={item.label} weight={item.weight} checked={!!p[item.key]} comment={comments[item.key]} />
                        ))}
                    </ViewBlock>

                    {/* Block 8 */}
                    <ViewBlock num={8} title="Мониторка" blockWeight={15} score={d.block_8}>
                        {BLOCK8_ITEMS.map(item => (
                            <ViewItem key={item.key} label={item.label} weight={item.weight} checked={!!p[item.key]} comment={comments[item.key]} />
                        ))}
                    </ViewBlock>
                </div>

                <div className="modal-footer">
                    <button className="btn-submit" style={{ maxWidth: 200 }} onClick={onClose}>Закрыть</button>
                </div>
            </div>
        </div>
    );
}
