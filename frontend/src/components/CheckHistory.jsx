/**
 * CheckHistory.jsx — history table with view/edit actions and staff count columns
 */
import { useState } from 'react';
import CheckViewModal from './CheckViewModal';
import { exportCheckToPdf } from '../utils/exportPdf';
import { exportChecksToExcel } from '../utils/exportExcel';

export default function CheckHistory({ checks, onEdit }) {
    const [viewCheck, setViewCheck] = useState(null);

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

    return (
        <>
            <div className="history">
                <h2>📋 Последние проверки</h2>
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
                                            <button
                                                className="btn-icon"
                                                title="Просмотр"
                                                onClick={() => setViewCheck(c)}
                                            >👁</button>
                                            <button
                                                className="btn-icon btn-icon-edit"
                                                title="Редактировать"
                                                onClick={() => onEdit && onEdit(c)}
                                            >✏️</button>
                                            <button
                                                className="btn-icon"
                                                title="Экспорт в PDF"
                                                onClick={() => exportCheckToPdf(c)}
                                            >📄</button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
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
