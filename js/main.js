document.addEventListener('DOMContentLoaded', () => {
    // Setup input handling
    const inputElement = document.getElementById('input');
    inputElement.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            document.getElementById('sendBtn').click();
        }
    });

    // Handle all click events through data-action attributes
    document.addEventListener('click', (e) => {
        const action = e.target.getAttribute('data-action');
        if (!action) return;

        switch (action) {
            case 'toggleMenu':
                document.getElementById('sidebar').classList.toggle('collapsed');
                break;
            case 'saveGame':
                saveGameState();
                break;
            case 'loadGame':
                document.getElementById('fileInput').click();
                break;
            case 'openSettings':
                document.getElementById('settingsOverlay').style.display = 'flex';
                break;
            case 'restartGame':
                if (confirm('Are you sure you want to restart? All progress will be lost.')) {
                    location.reload();
                }
                break;
            case 'editOutput':
                openOutputEditor();
                break;
            case 'undoAction':
                undoLastAction();
                break;
            case 'sendMessage':
                const input = document.getElementById('input');
                const message = input.value.trim();
                sendMessage(message);
                break;
        }
    });

    // Handle file input changes
    document.getElementById('fileInput').addEventListener('change', (event) => {
        loadFromFile(event);
    });

    // Handle input field
    document.getElementById('input').addEventListener('input', (event) => {
        // Add any input handling logic here
    });

    // Setup resizers
    setupResizers();
});

function setupResizers() {
    const resizers = [
        { id: 'resizer-row1', type: 'horizontal' },
        { id: 'resizer-row2', type: 'horizontal' },
        { id: 'resizer-col', type: 'vertical' },
        { id: 'resizer-map', type: 'vertical' }
    ];

    resizers.forEach(({ id, type }) => {
        const resizer = document.getElementById(id);
        let x = 0;
        let y = 0;
        let prevSibling;
        let nextSibling;

        resizer.addEventListener('mousedown', (e) => {
            x = e.clientX;
            y = e.clientY;
            prevSibling = resizer.previousElementSibling;
            nextSibling = resizer.nextElementSibling;

            document.addEventListener('mousemove', mouseMoveHandler);
            document.addEventListener('mouseup', mouseUpHandler);
        });

        function mouseMoveHandler(e) {
            const dx = e.clientX - x;
            const dy = e.clientY - y;

            if (type === 'vertical') {
                if (prevSibling && nextSibling) {
                    const prevWidth = (prevSibling.offsetWidth + dx) * 100 / prevSibling.parentNode.offsetWidth;
                    const nextWidth = (nextSibling.offsetWidth - dx) * 100 / nextSibling.parentNode.offsetWidth;
                    prevSibling.style.width = prevWidth + '%';
                    nextSibling.style.width = nextWidth + '%';
                }
            } else {
                if (prevSibling && nextSibling) {
                    prevSibling.style.height = prevSibling.offsetHeight + dy + 'px';
                }
            }

            x = e.clientX;
            y = e.clientY;
        }

        function mouseUpHandler() {
            document.removeEventListener('mousemove', mouseMoveHandler);
            document.removeEventListener('mouseup', mouseUpHandler);
        }
    });
}
