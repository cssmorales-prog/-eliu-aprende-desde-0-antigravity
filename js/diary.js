/* ==========================================================================
   LÓGICA DEL DIARIO DE VIDA E INTERACTIVIDAD DEL LIENZO (CANVAS)
   Módulo: js/diary.js
   Soporte completo para Tablet / Touch y computadores.
   ========================================================================== */

const DiaryManager = {
    canvas: null,
    ctx: null,
    isDrawing: false,
    brushColor: '#ff006e',
    brushSize: 6,
    isEraser: false,
    selectedEmotion: '',
    currentLetterToTrace: null, // Para caligrafía

    init() {
        this.canvas = document.getElementById('drawing-canvas');
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        
        // Ajustar el tamaño lógico del canvas a su tamaño CSS real
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        // Configurar Eventos del Ratón
        this.canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
        this.canvas.addEventListener('mousemove', (e) => this.draw(e));
        this.canvas.addEventListener('mouseup', () => this.stopDrawing());
        this.canvas.addEventListener('mouseleave', () => this.stopDrawing());

        // Configurar Eventos Táctiles (Tablets / Celulares)
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousedown', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.canvas.dispatchEvent(mouseEvent);
        }, { passive: false });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousemove', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.canvas.dispatchEvent(mouseEvent);
        }, { passive: false });

        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            const mouseEvent = new MouseEvent('mouseup', {});
            this.canvas.dispatchEvent(mouseEvent);
        }, { passive: false });

        // Inicializar controles UI del Canvas
        this.setupControls();

        // Cargar historial
        this.renderKidsDiaryHistory();
    },

    resizeCanvas() {
        if (!this.canvas) return;
        const rect = this.canvas.getBoundingClientRect();
        
        // Crear un canvas temporal para guardar lo dibujado antes de redimensionar
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = this.canvas.width;
        tempCanvas.height = this.canvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.drawImage(this.canvas, 0, 0);

        // Cambiar tamaño
        this.canvas.width = rect.width || 500;
        this.canvas.height = rect.height || 350;

        // Restaurar contenido dibujado y volver a pintar guías si es necesario
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.drawImage(tempCanvas, 0, 0, this.canvas.width, this.canvas.height);

        if (this.currentLetterToTrace) {
            this.drawCaligrafiaGuides();
        }
    },

    startDrawing(e) {
        this.isDrawing = true;
        this.ctx.beginPath();
        const pos = this.getMousePos(e);
        this.ctx.moveTo(pos.x, pos.y);
    },

    draw(e) {
        if (!this.isDrawing) return;
        
        this.ctx.lineWidth = this.isEraser ? 24 : this.brushSize;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.strokeStyle = this.isEraser ? '#ffffff' : this.brushColor;

        const pos = this.getMousePos(e);
        this.ctx.lineTo(pos.x, pos.y);
        this.ctx.stroke();
    },

    stopDrawing() {
        if (this.isDrawing) {
            this.ctx.closePath();
            this.isDrawing = false;
        }
    },

    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    },

    // Configurar pinceles, colores y borrador
    setupControls() {
        // Colores
        const dots = document.querySelectorAll('.color-dot');
        dots.forEach(dot => {
            dot.addEventListener('click', (e) => {
                dots.forEach(d => d.classList.remove('active'));
                dot.classList.add('active');
                this.brushColor = dot.getAttribute('data-color');
                this.isEraser = false;
                document.getElementById('btn-tool-brush').classList.add('active');
                document.getElementById('btn-tool-eraser').classList.remove('active');
            });
        });

        // Pincel vs Borrador
        document.getElementById('btn-tool-brush').addEventListener('click', (e) => {
            this.isEraser = false;
            e.target.classList.add('active');
            document.getElementById('btn-tool-eraser').classList.remove('active');
        });

        document.getElementById('btn-tool-eraser').addEventListener('click', (e) => {
            this.isEraser = true;
            e.target.classList.add('active');
            document.getElementById('btn-tool-brush').classList.remove('active');
        });

        // Limpiar
        document.getElementById('btn-canvas-clear').addEventListener('click', () => {
            this.clearCanvas();
        });

        // Emojis de Emoción
        const emotionBtns = document.querySelectorAll('.btn-emotion');
        emotionBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                emotionBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.selectedEmotion = btn.getAttribute('data-emotion');
                
                // Efecto de sonido corto de click
                SoundManager.play('click');
            });
        });
    },

    clearCanvas() {
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        if (this.currentLetterToTrace) {
            this.drawCaligrafiaGuides();
        }
    },

    // MODO CALIGRAFÍA: Dibuja renglón de caligrafía 1° Básico
    activateCaligrafiaMode(letter) {
        this.currentLetterToTrace = letter;
        this.canvas.parentElement.classList.add('caligrafia-mode');
        
        const hintBox = document.getElementById('caligrafia-hint');
        if (hintBox) {
            hintBox.innerText = `¡Dibuja la letra: ${letter}! ✍️`;
            hintBox.style.display = 'block';
        }
        
        this.clearCanvas();
    },

    deactivateCaligrafiaMode() {
        this.currentLetterToTrace = null;
        this.canvas.parentElement.classList.remove('caligrafia-mode');
        
        const hintBox = document.getElementById('caligrafia-hint');
        if (hintBox) {
            hintBox.style.display = 'none';
        }
        
        this.clearCanvas();
    },

    drawCaligrafiaGuides() {
        const w = this.canvas.width;
        const h = this.canvas.height;
        const ctx = this.ctx;

        // 1. Dibujar el renglón caligráfico clásico (Cielo, Pasto, Tierra)
        // Tres líneas horizontales
        const lineY1 = h * 0.3; // Límite cielo-pasto
        const lineY2 = h * 0.55; // Límite pasto-tierra
        const lineY3 = h * 0.8; // Fondo tierra

        ctx.save();
        
        // Dibujar franja central de pasto con un color verde pastel de fondo
        ctx.fillStyle = 'rgba(6, 214, 160, 0.05)';
        ctx.fillRect(0, lineY1, w, lineY2 - lineY1);

        // Dibujar franja de tierra con un fondo café claro
        ctx.fillStyle = 'rgba(218, 119, 86, 0.03)';
        ctx.fillRect(0, lineY2, w, lineY3 - lineY2);

        // Líneas punteadas
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(58, 134, 255, 0.3)';
        ctx.setLineDash([8, 6]);

        ctx.beginPath();
        ctx.moveTo(0, lineY1);
        ctx.lineTo(w, lineY1);
        ctx.moveTo(0, lineY2);
        ctx.lineTo(w, lineY2);
        ctx.moveTo(0, lineY3);
        ctx.lineTo(w, lineY3);
        ctx.stroke();

        // 2. Dibujar la letra modelo gigante en gris muy claro en el centro del canvas
        ctx.font = 'bold 220px Quicksand, Fredoka, sans-serif';
        ctx.fillStyle = 'rgba(100, 110, 120, 0.08)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.setLineDash([]); // Reset line dash
        
        ctx.fillText(this.currentLetterToTrace, w / 2, h * 0.5);
        ctx.restore();
    },

    // GUARDAR ENTRADA DEL DIARIO DE VIDA
    saveDiaryEntry() {
        const noteInput = document.getElementById('diary-note-input');
        const textNote = noteInput ? noteInput.value.trim() : "";
        const emotion = this.selectedEmotion;

        if (!emotion) {
            alert("¡Eliubot quiere saber cómo te sientes! Por favor selecciona una carita de emoción 🤖");
            return false;
        }

        // Obtener imagen del Canvas comprimida a PNG 0.5
        const imgData = this.canvas.toDataURL('image/png', 0.5);

        // Crear objeto de entrada
        const newEntry = {
            id: 'diary_' + Date.now(),
            fecha: new Date().toLocaleDateString('es-CL', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
            }),
            rawDate: new Date().toISOString(),
            emocion: emotion,
            nota: textNote || "¡Hoy fue un súper día de estudio!",
            dibujo: imgData
        };

        // Guardar en array en localStorage
        const entries = this.getEntries();
        entries.unshift(newEntry); // Insertar al inicio para que aparezca primero
        localStorage.setItem('eliu_aprende_diarios', JSON.stringify(entries));

        // Limpiar formulario
        if (noteInput) noteInput.value = "";
        this.clearCanvas();
        
        // Resetear emociones
        const emotionBtns = document.querySelectorAll('.btn-emotion');
        emotionBtns.forEach(b => b.classList.remove('active'));
        this.selectedEmotion = '';

        // Refrescar vistas
        this.renderKidsDiaryHistory();
        
        // Registrar logro e historia de estrella
        Gamification.awardStars(10);
        Gamification.completeDailyTask('diario');

        return true;
    },

    getEntries() {
        const data = localStorage.getItem('eliu_aprende_diarios');
        return data ? JSON.parse(data) : [];
    },

    deleteEntry(id) {
        let entries = this.getEntries();
        entries = entries.filter(e => e.id !== id);
        localStorage.setItem('eliu_aprende_diarios', JSON.stringify(entries));
        this.renderKidsDiaryHistory();
        
        // Si el panel de padres está cargado, refrescarlo también
        if (typeof ParentDashboard !== 'undefined' && ParentDashboard.renderParentGallery) {
            ParentDashboard.renderParentGallery();
        }
    },

    // Renderizar historial de bitácora en la pantalla del niño
    renderKidsDiaryHistory() {
        const container = document.getElementById('kids-diary-list');
        if (!container) return;

        const entries = this.getEntries();
        if (entries.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; color: var(--text-muted); padding: 32px 16px;">
                    <span style="font-size: 48px;">🎨</span>
                    <p style="margin-top: 8px; font-weight: 700;">¡Tu bitácora está vacía!</p>
                    <p style="font-size: 12px;">Dibuja hoy y escribe para llenar de colores tu diario de vida escolar.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = entries.map(entry => {
            // Traducir emoji de la emoción
            let emoji = '🤖';
            if (entry.emocion === 'feliz') emoji = '😄';
            if (entry.emocion === 'increible') emoji = '🤩';
            if (entry.emocion === 'cansado') emoji = '😴';
            if (entry.emocion === 'triste') emoji = '😢';
            if (entry.emocion === 'divertido') emoji = '🤪';

            return `
                <div class="child-diary-card" onclick="DiaryManager.previewEntry('${entry.id}')">
                    <img class="child-diary-thumb" src="${entry.dibujo}" alt="Dibujo">
                    <div class="child-diary-info">
                        <span class="child-diary-date">${entry.fecha}</span>
                        <p class="child-diary-note">${entry.nota}</p>
                    </div>
                    <span class="child-diary-emocion">${emoji}</span>
                </div>
            `;
        }).join('');
    },

    // Visualizar un dibujo en grande
    previewEntry(id) {
        const entries = this.getEntries();
        const entry = entries.find(e => e.id === id);
        if (!entry) return;

        let emoji = '🤖';
        if (entry.emocion === 'feliz') emoji = '😄 Feliz';
        if (entry.emocion === 'increible') emoji = '🤩 ¡Súper Genial!';
        if (entry.emocion === 'cansado') emoji = '😴 Cansado';
        if (entry.emocion === 'triste') emoji = '😢 Triste';
        if (entry.emocion === 'divertido') emoji = '🤪 Divertido';

        // Mostrar un modal amigable de previsualización
        const previewModal = document.createElement('div');
        previewModal.className = 'parent-lock-modal active';
        previewModal.style.zIndex = '3000';
        previewModal.innerHTML = `
            <div class="lock-card" style="max-width: 500px; padding: 24px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                    <span style="font-weight: 700; font-size: 13px; color: var(--text-muted);">${entry.fecha}</span>
                    <span style="font-size: 18px; font-weight: 700;">${emoji}</span>
                </div>
                <img src="${entry.dibujo}" style="width: 100%; border-radius: 12px; border: 2px solid var(--border-color); background: white; margin-bottom: 12px; max-height: 280px; object-fit: contain;">
                <p style="font-size: 16px; font-style: italic; background: #f8fafc; padding: 12px; border-radius: 8px; margin-bottom: 16px; color: var(--text-main); font-weight: 500;">
                    "${entry.nota}"
                </p>
                <button class="btn-lock-submit" style="width: 100%;" onclick="this.parentElement.parentElement.remove()">¡Cerrar Bitácora! 📖</button>
            </div>
        `;
        document.body.appendChild(previewModal);
    }
};
