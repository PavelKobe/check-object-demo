import React from 'react';

/**
 * CommentModal — модальное окно для ввода комментария к критерию
 */
export default function CommentModal({ open, onClose, itemLabel, value, onSave }) {
    const [text, setText] = React.useState(value || '');

    React.useEffect(() => {
        setText(value || '');
    }, [open, value]);

    if (!open) return null;

    function handleSave() {
        onSave(text.trim());
        onClose();
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
                <div className="modal-header">
                    <h2>Комментарий: {itemLabel}</h2>
                    <button type="button" className="modal-close" onClick={onClose}>✕</button>
                </div>
                <div className="modal-body">
                    <textarea
                        value={text}
                        onChange={e => setText(e.target.value)}
                        placeholder="Введите комментарий..."
                        className="comment-textarea"
                        rows={4}
                        autoFocus
                    />
                </div>
                <div className="modal-footer">
                    <button type="button" className="btn-secondary" onClick={onClose}>Отмена</button>
                    <button type="button" className="btn-submit" onClick={handleSave}>Сохранить</button>
                </div>
            </div>
        </div>
    );
}
