/**
 * CheckHistory.jsx — history table with view/edit actions and staff count columns
 */
import { useEffect, useState } from 'react';
import CheckViewModal from './CheckViewModal';
import { printCheckToPdf } from '../utils/printCheck';
import { exportChecksToExcel } from '../utils/exportExcel';

function useMediaQuery(query) {
    const getMatches = () => {
        if (typeof window === 'undefined') return false;
        return window.matchMedia ? window.matchMedia(query).matches : false;
    };

    const [matches, setMatches] = useState(getMatches);

    useEffect(() => {
        if (typeof window === 'undefined' || !window.matchMedia) return;
        const mql = window.matchMedia(query);
        const onChange = () => setMatches(mql.matches);
        onChange();
        if (mql.addEventListener) mql.addEventListener('change', onChange);
        else mql.addListener(onChange);
        return () => {
            if (mql.removeEventListener) mql.removeEventListener('change', onChange);
            else mql.removeListener(onChange);
        };
    }, [query]);

    return matches;
}

export default function CheckHistory({ checks, onEdit }) {
    const [viewCheck, setViewCheck] = useState(null);
    const isMobile = useMediaQuery('(max-width: 640px)');

    if (!checks || checks.length === 0) {
        return (
            <div className="history-empty">
                <p>История проверок пуста</p>
            </div>
        );
    }

    const gradeClass = {
        'отлично': 'badge-green',
        'хорошо': 'badge-blue',
        'удовлетворительно': 'badge-yellow',
        'неудовлетворительно': 'badge-red',
    };

    function renderActions(check) {
        return (
            <>
                <button
                    className="btn-icon"
                    title="Просмотр"
                    onClick={() => setViewCheck(check)}
                >👁</button>
                <button
                    className="btn-icon btn-icon-edit"
                    title="Редактировать"
                    onClick={() => onEdit && onEdit(check)}
                >✏️</button>
                <button
                    className="btn-icon"
                    title="Печать / PDF (Ctrl+P → Сохранить как PDF)"
                    onClick={() => printCheckToPdf(check)}
                >🖨</button>
            </>
        );
    }

    return (
        <>
            <div className="history">
                <h2>📋 Последние проверки</h2>
                {isMobile ? (
                    <div className="history-cards">
                        {checks.map((c, i) => {
                            const p = c.payload || {};
                            const totalStaff = p.b2_total_staff ?? '—';
                            const absent = p.b2_absent_posts ?? null;
                            const factPosts = (typeof totalStaff === 'number' && typeof absent === 'number')
                                ? totalStaff - absent : '—';
                            const hasWarn = factPosts !== '—' && typeof absent === 'number' && absent > 0;
                            return (
                                <article className="history-card" key={c.id}>
                                    <div className="history-card-top">
                                        <div className="history-card-title">
                                            <div className="history-card-id">#{checks.length - i}</div>
                                            <div className="history-card-meta">{c.timestamp}</div>
                                        </div>
                                        <div className="history-card-grade">
                                            <div className="history-card-score"><strong>{c.total_score}%</strong></div>
                                            <span className={`badge ${gradeClass[c.grade] || ''}`}>{c.grade}</span>
                                        </div>
                                    </div>

                                    <div className="history-card-store">{c.store_name}</div>

                                    <div className="history-card-grid">
                                        <div className="history-card-kv">
                                            <span>По штату</span>
                                            <strong>{totalStaff}</strong>
                                        </div>
                                        <div className="history-card-kv">
                                            <span>По факту</span>
                                            <strong className={hasWarn ? 'text-warn' : ''}>{factPosts}</strong>
                                        </div>
                                    </div>

                                    <div className="history-card-actions">
                                        {renderActions(c)}
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                ) : (
                    <div className="history-table-wrap">
                        <table className="history-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Дата / Время</th>
                                    <th>Магазин</th>
                                    <th>По штату</th>
                                    <th>По факту</th>
                                    <th>Балл</th>
                                    <th>Категория</th>
                                    <th>Действия</th>
                                </tr>
                            </thead>
                            <tbody>
                                {checks.map((c, i) => {
                                    const p = c.payload || {};
                                    const totalStaff = p.b2_total_staff ?? '—';
                                    const absent = p.b2_absent_posts ?? null;
                                    const factPosts = (typeof totalStaff === 'number' && typeof absent === 'number')
                                        ? totalStaff - absent : '—';
                                    return (
                                        <tr key={c.id}>
                                            <td>{checks.length - i}</td>
                                            <td>{c.timestamp}</td>
                                            <td>{c.store_name}</td>
                                            <td className="td-center">{totalStaff}</td>
                                            <td className="td-center">
                                                <span className={factPosts !== '—' && absent > 0 ? 'text-warn' : ''}>
                                                    {factPosts}
                                                </span>
                                            </td>
                                            <td><strong>{c.total_score}%</strong></td>
                                            <td>
                                                <span className={`badge ${gradeClass[c.grade] || ''}`}>
                                                    {c.grade}
                                                </span>
                                            </td>
                                            <td className="td-actions">
                                                {renderActions(c)}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
                <div className="history-export">
                    <button className="btn-export-excel" onClick={() => exportChecksToExcel(checks)}>
                        📊 Экспорт в Excel
                    </button>
                </div>
            </div>

            {viewCheck && (
                <CheckViewModal check={viewCheck} onClose={() => setViewCheck(null)} />
            )}
        </>
    );
}
