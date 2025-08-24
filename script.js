// Initialize MathJax
window.MathJax = {
    tex: {
        inlineMath: [['$', '$'], ['\\(', '\\)']],
        displayMath: [['$$', '$$'], ['\\[', '\\]']]
    },
    svg: {
        fontCache: 'global'
    }
};

let exportMenuOpen = false;
const editor = document.getElementById('latexEditor');
const preview = document.getElementById('preview');

// Templates
const templates = {
    article: `\\documentclass{article}
\\usepackage[utf8]{inputenc}
\\title{My Article}
\\author{Your Name}
\\date{\\today}

\\begin{document}
\\maketitle

\\section{Introduction}
Write your introduction here...

\\section{Main Content}
Write your main content here...

\\section{Conclusion}
Write your conclusion here...

\\end{document}`,

    letter: `\\documentclass{letter}
\\usepackage[utf8]{inputenc}

\\address{Your Name\\\\Your Address\\\\Your City, State ZIP}
\\signature{Your Name}

\\begin{document}

\\begin{letter}{Recipient Name\\\\Recipient Address\\\\City, State ZIP}

\\opening{Dear Sir/Madam,}

Write your letter content here...

\\closing{Sincerely,}

\\end{letter}
\\end{document}`,

    resume: `\\documentclass{article}
\\usepackage[utf8]{inputenc}
\\usepackage[margin=1in]{geometry}

\\title{\\textbf{Your Name}}
\\author{your.email@example.com | (123) 456-7890}
\\date{}

\\begin{document}
\\maketitle

\\section*{Experience}
\\textbf{Job Title} - Company Name \\hfill Date Range\\\\
Description of your role and achievements...

\\section*{Education}
\\textbf{Degree} - University Name \\hfill Year\\\\
Relevant coursework or achievements...

\\section*{Skills}
List your skills here...

\\end{document}`,

    report: `\\documentclass{report}
\\usepackage[utf8]{inputenc}
\\title{Report Title}
\\author{Your Name}
\\date{\\today}

\\begin{document}
\\maketitle
\\tableofcontents

\\chapter{Introduction}
Write your introduction here...

\\chapter{Methodology}
Describe your methodology...

\\chapter{Results}
Present your results...

\\chapter{Conclusion}
Write your conclusion...

\\end{document}`,

    math: `\\documentclass{article}
\\usepackage[utf8]{inputenc}
\\usepackage{amsmath}
\\usepackage{amsfonts}
\\title{Mathematical Document}
\\author{Your Name}
\\date{\\today}

\\begin{document}
\\maketitle

\\section{Equations}
Here's an inline equation: $E = mc^2$

Here's a display equation:
\\[\\int_0^\\infty e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}\\]

\\section{Matrix}
\\[\\begin{bmatrix}
a & b \\\\
c & d
\\end{bmatrix}\\]

\\end{document}`,

    presentation: `\\documentclass{beamer}
\\usetheme{Madrid}
\\title{Presentation Title}
\\author{Your Name}
\\date{\\today}

\\begin{document}

\\frame{\\titlepage}

\\begin{frame}
\\frametitle{Introduction}
\\\item First point
\\item Second point
\\item Third point
\
\\end{frame}

\\begin{frame}
\\frametitle{Main Content}
Your main content here...
\\end{frame}

\\end{document}`
};

// Undo/Redo
let history = [];
let historyIndex = -1;
let debounceTimer;

function saveHistory() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        const current = editor.value;
        if (historyIndex < history.length - 1) {
            history = history.slice(0, historyIndex + 1);
        }
        history.push(current);
        historyIndex++;
        if (history.length > 50) {
            history.shift();
            historyIndex--;
        }
    }, 500);
}

function undo() {
    if (historyIndex > 0) {
        historyIndex--;
        editor.value = history[historyIndex];
        updatePreview();
    }
}

function redo() {
    if (historyIndex < history.length - 1) {
        historyIndex++;
        editor.value = history[historyIndex];
        updatePreview();
    }
}

// Handle keyboard shortcuts
editor.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z') {
            e.preventDefault();
            undo();
        } else if (e.key === 'y') {
            e.preventDefault();
            redo();
        }
    }
});

// Handle input
function handleInput() {
    saveHistory();
    updatePreview();
    localStorage.setItem('latex_content', editor.value);
}

// Template insertion
function insertTemplate(type) {
    editor.value = templates[type];
    handleInput();
}

// Text insertion
function insertText(before, after = '') {
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const selectedText = editor.value.substring(start, end);
    const replacement = before + selectedText + after;
    
    editor.value = editor.value.substring(0, start) + replacement + editor.value.substring(end);
    editor.focus();
    editor.setSelectionRange(start + before.length, start + before.length + selectedText.length);
    handleInput();
}

// Insert list
function insertList(type) {
    const listText = `\\begin{${type}}
\\item First item
\\item Second item
\\item Third item
\\end{${type}}

`;
    insertText(listText);
}

// Insert table
function insertTable() {
    const tableText = `\\begin{table}[h]
\\centering
\\begin{tabular}{|c|c|c|}
\\hline
Header 1 & Header 2 & Header 3 \\\\
\\hline
Row 1, Col 1 & Row 1, Col 2 & Row 1, Col 3 \\\\
Row 2, Col 1 & Row 2, Col 2 & Row 2, Col 3 \\\\
\\hline
\\end{tabular}
\\caption{Your table caption}
\\end{table}

`;
    insertText(tableText);
}

// Insert math
function insertMath(type) {
    if (type === 'inline') {
        insertText('$', '$');
    } else {
        insertText('\\[', '\\]');
    }
}

// Update preview
function updatePreview() {
    let latexContent = editor.value;
    let htmlContent = latexContent;

    htmlContent = htmlContent
        .replace(/\\documentclass\{.*?\}/g, '')
        .replace(/\\usepackage\{.*?\}/g, '')
        .replace(/\\usepackage\[.*?\]\{.*?\}/g, '')
        .replace(/\\title\{(.*?)\}/g, '<h1>$1</h1>')
        .replace(/\\author\{(.*?)\}/g, '<p><strong>By: $1</strong></p>')
        .replace(/\\date\{.*?\}/g, '')
        .replace(/\\maketitle/g, '')
        .replace(/\\begin\{document\}/g, '')
        .replace(/\\end\{document\}/g, '')
        .replace(/\\section\{(.*?)\}/g, '<h2>$1</h2>')
        .replace(/\\subsection\{(.*?)\}/g, '<h3>$1</h3>')
        .replace(/\\paragraph\{(.*?)\}/g, '<h4>$1</h4>')
        .replace(/\\textbf\{(.*?)\}/g, '<strong>$1</strong>')
        .replace(/\\textit\{(.*?)\}/g, '<em>$1</em>')
        .replace(/\\underline\{(.*?)\}/g, '<u>$1</u>')
        .replace(/\\begin\{itemize\}/g, '<ul>')
        .replace(/\\end\{itemize\}/g, '</ul>')
        .replace(/\\begin\{enumerate\}/g, '<ol>')
        .replace(/\\end\{enumerate\}/g, '</ol>')
        .replace(/\\item\s/g, '<li>')
        .replace(/\\begin\{table\}[^\n]*\n?\\centering?\n?/g, '')
        .replace(/\\caption\{(.*?)\}/g, '<caption>$1</caption>')
        .replace(/\\end\{table\}/g, '')
        .replace(/\\begin\{tabular\}\{([^\}]+)\}([\s\S]*?)\\end\{tabular\}/g, (match, cols, content) => {
            let table = '<table border="1" style="border-collapse: collapse; margin: 10px 0;">';
            const rows = content.split('\\\\');
            rows.forEach(row => {
                row = row.replace(/\\hline/g, '');
                if (row.trim()) {
                    table += '<tr>';
                    const cells = row.split('&');
                    cells.forEach(cell => {
                        table += '<td style="padding: 5px;">' + cell.trim() + '</td>';
                    });
                    table += '</tr>';
                }
            });
            table += '</table>';
            return table;
        })
        .replace(/\\\[/g, '$$')
        .replace(/\\\]/g, '$$')
        .replace(/\\begin\{.*?\}/g, '')
        .replace(/\\end\{.*?\}/g, '')
        .replace(/\\\\/g, '<br>')
        .replace(/\\hfill/g, '')
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, ' ');

    if (htmlContent.trim() === '') {
        htmlContent = '<div class="math-preview"><p>Start typing to see your document preview...</p></div>';
    } else {
        htmlContent = '<p>' + htmlContent + '</p>';
    }

    preview.innerHTML = htmlContent;
    
    if (window.MathJax) {
        MathJax.typesetPromise([preview]).catch(err => console.log('MathJax error:', err));
    }
}

// Export menu
function toggleExportMenu() {
    const dropdown = document.getElementById('exportDropdown');
    const arrow = document.getElementById('dropdownArrow');
    exportMenuOpen = !exportMenuOpen;
    dropdown.classList.toggle('active', exportMenuOpen);
    arrow.textContent = exportMenuOpen ? '▲' : '▼';
}

document.addEventListener('click', function(event) {
    const exportMenu = document.querySelector('.export-menu');
    if (!exportMenu.contains(event.target) && exportMenuOpen) {
        toggleExportMenu();
    }
});

// Notifications
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 30px;
        right: 30px;
        background: ${type === 'success' ? '#28a745' : '#dc3545'};
        color: white;
        padding: 15px 25px;
        border-radius: 10px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10000;
        font-weight: bold;
        transform: translateX(100%);
        transition: transform 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => notification.style.transform = 'translateX(0)', 10);
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) notification.parentNode.removeChild(notification);
        }, 300);
    }, 2500);
}

// Download helper
function downloadFile(content, filename, contentType = 'text/plain') {
    try {
        const blob = new Blob([content], { type: contentType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        return true;
    } catch (error) {
        console.error('Download failed:', error);
        return false;
    }
}

// Export functions
async function exportPDF() {
    const content = editor.value.trim();
    if (!content) {
        showNotification('Please write some content first!', 'error');
        return;
    }

    try {
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF();
        const canvas = await html2canvas(document.getElementById('preview'), {
            scale: 2,
            useCORS: true,
            logging: false
        });
        const imgData = canvas.toDataURL('image/png');
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save('document.pdf');
        showNotification('PDF downloaded successfully!', 'success');
    } catch (error) {
        console.error('PDF Error:', error);
        showNotification('Export failed', 'error');
    }
    toggleExportMenu();
}

function exportLatex() {
    const content = editor.value.trim();
    if (!content) {
        showNotification('Please write some content first!', 'error');
        return;
    }
    downloadFile(content, 'document.tex') && showNotification('LaTeX file downloaded!', 'success');
    toggleExportMenu();
}

function exportTxt() {
    const content = editor.value.trim();
    if (!content) {
        showNotification('Please write some content first!', 'error');
        return;
    }

    const textContent = content
        .replace(/\\title\{(.*?)\}/g, '$1\n' + '='.repeat(40))
        .replace(/\\author\{(.*?)\}/g, '\nBy: $1\n')
        .replace(/\\section\{(.*?)\}/g, '\n\n$1\n' + '-'.repeat(20))
        .replace(/\\subsection\{(.*?)\}/g, '\n$1\n' + '~'.repeat(15))
        .replace(/\\textbf\{(.*?)\}/g, '**$1**')
        .replace(/\\textit\{(.*?)\}/g, '*$1*')
        .replace(/\\item/g, '• ')
        .replace(/\\begin\{.*?\}|\\end\{.*?\}/g, '')
        .replace(/\\\$.*?\\\$/g, '[Math]')
        .replace(/\\[a-zA-Z]+\{.*?\}|\\[a-zA-Z]+/g, '')
        .replace(/[{}]/g, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim();

    downloadFile(textContent || 'Empty document', 'document.txt');
    showNotification('Text file downloaded!', 'success');
    toggleExportMenu();
}

async function exportImage() {
    const content = editor.value.trim();
    if (!content) {
        showNotification('Please write some content first!', 'error');
        return;
    }

    try {
        const canvas = await html2canvas(document.getElementById('preview'), {
            scale: 2,
            useCORS: true,
            logging: false
        });
        canvas.toBlob(blob => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'document.png';
            a.click();
            URL.revokeObjectURL(url);
            showNotification('Image downloaded!', 'success');
        }, 'image/png');
    } catch (error) {
        console.error('Image Error:', error);
        showNotification('Export failed', 'error');
    }
    toggleExportMenu();
}

// UI Features
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
}

function zoomIn() {
    let size = parseInt(getComputedStyle(document.body).getPropertyValue('--font-size'));
    document.body.style.setProperty('--font-size', `${size + 2}px`);
}

function zoomOut() {
    let size = parseInt(getComputedStyle(document.body).getPropertyValue('--font-size'));
    if (size > 8) {
        document.body.style.setProperty('--font-size', `${size - 2}px`);
    }
}

// Initialize on load
window.onload = function() {
    const saved = localStorage.getItem('latex_content');
    if (saved) editor.value = saved;
    else insertTemplate('article');

    history.push(editor.value);
    historyIndex = 0;
    updatePreview();

    if (localStorage.getItem('darkMode') === 'true') {
        toggleDarkMode();
    }
};
