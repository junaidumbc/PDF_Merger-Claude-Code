document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const fileList = document.getElementById('fileList');
    const fileListSection = document.getElementById('fileListSection');
    const fileCount = document.getElementById('fileCount');
    const mergeSection = document.getElementById('mergeSection');
    const clearAllBtn = document.getElementById('clearAllBtn');
    const mergeBtn = document.getElementById('mergeBtn');
    const progressSection = document.getElementById('progressSection');
    const successSection = document.getElementById('successSection');

    let files = [];

    // Toast helper
    function showToast(message, type = 'danger') {
        const icons = {
            danger: 'bi-exclamation-triangle-fill',
            warning: 'bi-exclamation-circle-fill',
            success: 'bi-check-circle-fill',
            info: 'bi-info-circle-fill',
        };
        const toast = document.createElement('div');
        toast.className = `toast align-items-center text-bg-${type} border-0 show`;
        toast.setAttribute('role', 'alert');
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body"><i class="bi ${icons[type] || icons.info} me-2"></i>${message}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>`;
        document.getElementById('toastBox').appendChild(toast);
        setTimeout(() => toast.remove(), 4000);
    }

    // Click to upload
    dropZone.addEventListener('click', (e) => {
        if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'LABEL') {
            fileInput.click();
        }
    });

    fileInput.addEventListener('change', (e) => {
        addFiles(Array.from(e.target.files));
        fileInput.value = '';
    });

    // Drag and drop
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('drag-over');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        const droppedFiles = Array.from(e.dataTransfer.files).filter(
            f => f.type === 'application/pdf'
        );
        if (droppedFiles.length === 0) {
            showToast('Please drop PDF files only.', 'warning');
            return;
        }
        addFiles(droppedFiles);
    });

    // Add files to list
    function addFiles(newFiles) {
        const pdfFiles = newFiles.filter(f => f.type === 'application/pdf');
        if (pdfFiles.length === 0) {
            showToast('Please select PDF files only.', 'warning');
            return;
        }
        files = files.concat(pdfFiles);
        successSection.classList.add('d-none');
        showToast(`Added ${pdfFiles.length} file${pdfFiles.length > 1 ? 's' : ''}.`, 'success');
        renderFileList();
    }

    // Render file list
    function renderFileList() {
        fileList.innerHTML = '';

        if (files.length === 0) {
            fileListSection.classList.add('d-none');
            mergeSection.style.display = 'none';
            return;
        }

        fileListSection.classList.remove('d-none');
        mergeSection.style.display = files.length >= 2 ? 'block' : 'none';
        fileCount.textContent = files.length;

        files.forEach((file, index) => {
            const li = document.createElement('li');
            li.className = 'file-item';
            li.draggable = true;
            li.dataset.index = index;

            li.innerHTML = `
                <span class="drag-handle"><i class="bi bi-grip-vertical"></i></span>
                <span class="file-number">${index + 1}</span>
                <div class="file-icon"><i class="bi bi-file-earmark-pdf-fill"></i></div>
                <div class="file-info">
                    <div class="file-name" title="${file.name}">${file.name}</div>
                    <div class="file-size">${formatSize(file.size)}</div>
                </div>
                <button class="remove-btn" title="Remove file"><i class="bi bi-x-lg"></i></button>
            `;

            li.querySelector('.remove-btn').addEventListener('click', () => {
                files.splice(index, 1);
                renderFileList();
            });

            li.addEventListener('dragstart', handleDragStart);
            li.addEventListener('dragover', handleDragOver);
            li.addEventListener('drop', handleDrop);
            li.addEventListener('dragend', handleDragEnd);

            fileList.appendChild(li);
        });
    }

    // Drag reordering
    let dragIndex = null;

    function handleDragStart(e) {
        dragIndex = parseInt(this.dataset.index);
        this.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
    }

    function handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }

    function handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        const dropIndex = parseInt(this.dataset.index);
        if (dragIndex !== null && dragIndex !== dropIndex) {
            const [moved] = files.splice(dragIndex, 1);
            files.splice(dropIndex, 0, moved);
            renderFileList();
        }
    }

    function handleDragEnd() {
        this.classList.remove('dragging');
        dragIndex = null;
    }

    // Clear all
    clearAllBtn.addEventListener('click', () => {
        files = [];
        renderFileList();
    });

    // Merge
    mergeBtn.addEventListener('click', async () => {
        if (files.length < 2) {
            showToast('Please add at least 2 PDF files to merge.', 'warning');
            return;
        }

        const formData = new FormData();
        files.forEach(f => formData.append('pdfs', f));

        mergeBtn.disabled = true;
        mergeBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Merging...';
        progressSection.classList.remove('d-none');

        try {
            const response = await fetch('/api/merge', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Merge failed.');
            }

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'merged.pdf';
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);

            // Show success state
            progressSection.classList.add('d-none');
            mergeSection.style.display = 'none';
            fileListSection.classList.add('d-none');
            dropZone.classList.add('d-none');
            successSection.classList.remove('d-none');
        } catch (err) {
            showToast(err.message, 'danger');
            progressSection.classList.add('d-none');
        } finally {
            mergeBtn.disabled = false;
            mergeBtn.innerHTML = '<i class="bi bi-union me-2"></i>Merge PDFs';
        }
    });

    // Merge another
    document.getElementById('mergeAnotherBtn').addEventListener('click', () => {
        files = [];
        successSection.classList.add('d-none');
        dropZone.classList.remove('d-none');
        renderFileList();
    });

    // Helpers
    function formatSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }
});
