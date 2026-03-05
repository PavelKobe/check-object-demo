/**
 * CheckHistory.jsx
 */
export default function CheckHistory({ checks }) {
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
        <div className="history">
            <h2>📋 Последние проверки</h2>
            <div className="history-table-wrap">
                <table className="history-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Дата / Время</th>
                            <th>Магазин</th>
                            <th>Балл</th>
                            <th>Категория</th>
                        </tr>
                    </thead>
                    <tbody>
                        {checks.map((c, i) => (
                            <tr key={c.id}>
                                <td>{checks.length - i}</td>
                                <td>{c.timestamp}</td>
                                <td>{c.store_name}</td>
                                <td><strong>{c.total_score}%</strong></td>
                                <td>
                                    <span className={`badge ${gradeClass[c.grade] || ''}`}>
                                        {c.grade}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
