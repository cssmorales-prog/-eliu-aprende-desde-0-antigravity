/* ==========================================================================
   MANEJADOR DEL PANEL DE PADRES (ÁREA CONTROLADORA DE APRENDIZAJE)
   Módulo: js/parent.js
   Administración del historial, descarga de arte y respaldo completo.
   ========================================================================== */

const ParentDashboard = {
    examDate: new Date('2026-10-15T09:00:00'), // Fecha estimada Exámenes Libres Octubre 2026
    currentMathAnswer: 0,

    init() {
        this.loadBookPages();
        this.renderCountdown();
        this.renderSubjectProgress();
        this.renderParentStats();
        this.renderParentGallery();
        this.loadVoiceSettings();
        this.renderWeeklyPlanner();

        // Configurar navegación de Tabs en Panel CAS
        document.querySelectorAll('.btn-parent-tab').forEach(tabBtn => {
            tabBtn.addEventListener('click', (e) => {
                const targetTabId = e.currentTarget.getAttribute('data-tab');
                this.switchTab(targetTabId);
            });
        });

        // Configurar botón Volver a niños en el sidebar
        const backKidsSidebar = document.getElementById('btn-back-to-kids-sidebar');
        if (backKidsSidebar) {
            backKidsSidebar.onclick = () => {
                if (typeof App !== 'undefined') {
                    App.showView('kids-dashboard-view');
                }
            };
        }

        // Botón de imprimir portafolio
        const printBtn = document.getElementById('btn-print-portfolio');
        if (printBtn) {
            printBtn.onclick = () => window.print();
        }

        // Botón de limpiar bitácora de chats
        const clearChatBtn = document.getElementById('btn-clear-chat-logs');
        if (clearChatBtn) {
            clearChatBtn.onclick = () => this.clearChatLogsConfirm();
        }

        // Eventos
        document.getElementById('btn-save-pages').addEventListener('click', () => this.saveBookPages());
        document.getElementById('btn-export-backup').addEventListener('click', () => this.exportBackup());
        document.getElementById('btn-import-backup').addEventListener('click', () => {
            document.getElementById('import-file-selector').click();
        });
        document.getElementById('import-file-selector').addEventListener('change', (e) => this.importBackup(e));

        // Eventos Sliders de Voz y Volumen
        const speedSlider = document.getElementById('voice-speed-slider');
        if (speedSlider) {
            speedSlider.addEventListener('input', (e) => this.updateVoiceSpeedLabel(parseFloat(e.target.value)));
            speedSlider.addEventListener('change', (e) => this.saveVoiceSpeed(parseFloat(e.target.value)));
        }

        const volSlider = document.getElementById('voice-volume-slider');
        if (volSlider) {
            volSlider.addEventListener('input', (e) => this.updateVoiceVolumeLabel(parseFloat(e.target.value)));
            volSlider.addEventListener('change', (e) => this.saveVoiceVolume(parseFloat(e.target.value)));
        }

        // Eventos ElevenLabs Key e ID
        const keyInput = document.getElementById('voice-eleven-key');
        if (keyInput) {
            keyInput.addEventListener('input', () => this.saveElevenSettings());
        }

        const idInput = document.getElementById('voice-eleven-id');
        if (idInput) {
            idInput.addEventListener('input', () => this.saveElevenSettings());
        }

        // Evento Gemini API Key
        const geminiInput = document.getElementById('voice-gemini-key');
        if (geminiInput) {
            geminiInput.addEventListener('input', () => this.saveElevenSettings());
        }

        // Botón Probar Voz
        const testVoiceBtn = document.getElementById('btn-test-voice');
        if (testVoiceBtn) {
            testVoiceBtn.addEventListener('click', () => this.testEliubotVoice());
        }
    },

    // 🔒 ACCESO DE SEGURIDAD (Clave de Padres: 1801)
    triggerMathLock(onSuccess) {
        const modal = document.getElementById('parent-lock-modal');
        const questionText = document.getElementById('lock-question-text');
        const inputField = document.getElementById('lock-answer-input');
        
        if (questionText) questionText.innerText = "🔑 Código de Acceso";
        inputField.value = '';
        
        modal.classList.add('active');
        inputField.focus();

        // Configurar botones del modal
        const submitBtn = document.getElementById('btn-lock-submit');
        const cancelBtn = document.getElementById('btn-lock-cancel');

        // Limpiar manejadores antiguos
        const newSubmitBtn = submitBtn.cloneNode(true);
        submitBtn.parentNode.replaceChild(newSubmitBtn, submitBtn);

        const newCancelBtn = cancelBtn.cloneNode(true);
        cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);

        newSubmitBtn.addEventListener('click', () => {
            const val = inputField.value.trim();
            if (val === '1801') {
                modal.classList.remove('active');
                SoundManager.play('success');
                onSuccess();
            } else {
                alert("¡Clave incorrecta! Acceso denegado. Solo adultos en esta zona 🔒");
                inputField.value = '';
                inputField.focus();
            }
        });

        newCancelBtn.addEventListener('click', () => {
            modal.classList.remove('active');
        });

        // Soporte para presionar 'Enter'
        inputField.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                newSubmitBtn.click();
            }
        });
    },

    // ⏳ CUENTA REGRESIVA AL EXAMEN LIBRE
    renderCountdown() {
        const countdownEl = document.getElementById('parent-countdown');
        if (!countdownEl) return;

        const now = new Date();
        const diffTime = this.examDate - now;

        if (diffTime <= 0) {
            countdownEl.innerHTML = "<span style='color: var(--roblox-red);'>¡Llegó el Mes del Examen! (Octubre 2026) 📅</span>";
            return;
        }

        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const diffWeeks = Math.floor(diffDays / 7);
        const remainingDays = diffDays % 7;

        countdownEl.innerHTML = `
            <div style="font-weight: 700; color: #1a202c; font-size: 16px;">
                Faltan <span style="color: var(--roblox-red); font-size: 20px;">${diffWeeks} semanas</span> y <span style="color: var(--roblox-red); font-size: 20px;">${remainingDays} días</span>
            </div>
            <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">
                Fecha objetivo: 15 de Octubre, 2026 (Validación Mineduc, Chile)
            </div>
        `;
    },

    // 📚 CARGAR Y GUARDAR PÁGINAS DE LIBROS
    loadBookPages() {
        const defaultPages = {
            supermatematicos: 56,
            jugandoSonidos: 49,
            caligrafia: 75
        };

        const saved = localStorage.getItem('eliu_aprende_paginas');
        const pages = saved ? JSON.parse(saved) : defaultPages;

        document.getElementById('page-supermatematicos').value = pages.supermatematicos;
        document.getElementById('page-jugandosonidos').value = pages.jugandoSonidos;
        document.getElementById('page-caligrafia').value = pages.caligrafia;
    },

    saveBookPages() {
        const supermatematicos = parseInt(document.getElementById('page-supermatematicos').value) || 56;
        const jugandoSonidos = parseInt(document.getElementById('page-jugandosonidos').value) || 49;
        const caligrafia = parseInt(document.getElementById('page-caligrafia').value) || 75;

        const pages = {
            supermatematicos,
            jugandoSonidos,
            caligrafia
        };

        localStorage.setItem('eliu_aprende_paginas', JSON.stringify(pages));
        SoundManager.play('success');
        alert("¡Páginas de los libros actualizadas! Las tareas recomendadas de Eliu en su pantalla principal se adaptarán de inmediato. 📘🔢✍️");
        
        // Actualizar dashboard infantil
        if (typeof Gamification !== 'undefined') {
            Gamification.renderKidsDashboard();
        }
    },

    getBookPages() {
        const defaultPages = {
            supermatematicos: 56,
            jugandoSonidos: 49,
            caligrafia: 75
        };
        const saved = localStorage.getItem('eliu_aprende_paginas');
        return saved ? JSON.parse(saved) : defaultPages;
    },

    // 📈 ESTADÍSTICAS Y PROGRESO DE EXAMEN
    renderParentStats() {
        const entries = DiaryManager.getEntries();
        const lecciones = this.getCompletedLessons();
        const totalEstrellas = localStorage.getItem('eliu_aprende_estrellas') || 0;
        const racha = localStorage.getItem('eliu_aprende_racha') || 0;

        document.getElementById('parent-stat-diarios').innerText = entries.length;
        document.getElementById('parent-stat-lecciones').innerText = lecciones.length;
        document.getElementById('parent-stat-estrellas').innerText = totalEstrellas;
        document.getElementById('parent-stat-racha').innerText = `${racha} días`;
    },

    getCompletedLessons() {
        const data = localStorage.getItem('eliu_aprende_lecciones_completas');
        return data ? JSON.parse(data) : [];
    },

    renderSubjectProgress() {
        const completed = this.getCompletedLessons();
        
        // Contar el total por materia
        const subjects = {
            lenguaje: { total: 2, completed: 0, color: 'var(--color-lenguaje)' },
            matematica: { total: 1, completed: 0, color: 'var(--color-matematica)' },
            ciencias: { total: 1, completed: 0, color: 'var(--color-ciencias)' },
            historia: { total: 1, completed: 0, color: 'var(--color-historia)' }
        };

        completed.forEach(lId => {
            if (lId.startsWith('lenguaje')) subjects.lenguaje.completed++;
            if (lId.startsWith('matematica')) subjects.matematica.completed++;
            if (lId.startsWith('ciencias')) subjects.ciencias.completed++;
            if (lId.startsWith('historia')) subjects.historia.completed++;
        });

        const listContainer = document.getElementById('parent-subject-progress');
        if (!listContainer) return;

        listContainer.innerHTML = Object.keys(subjects).map(key => {
            const sub = subjects[key];
            const name = key.charAt(0).toUpperCase() + key.slice(1);
            const percent = Math.round((sub.completed / sub.total) * 100);

            let subjectLabel = "Matemática";
            if (key === 'lenguaje') subjectLabel = "Lenguaje y Fónica";
            if (key === 'ciencias') subjectLabel = "Ciencias Naturales";
            if (key === 'historia') subjectLabel = "Historia, Geografía y Sociedad";

            return `
                <div class="subject-progress-row">
                    <div class="subject-progress-info">
                        <span>${subjectLabel}</span>
                        <span>${sub.completed}/${sub.total} Lecciones (${percent}%)</span>
                    </div>
                    <div class="progress-bar-bg">
                        <div class="progress-bar-fill" style="width: ${percent}%; background-color: ${sub.color};"></div>
                    </div>
                </div>
            `;
        }).join('');
    },

    // 🖼️ GALERÍA DE ARTE COMPLETA PARA PADRES
    renderParentGallery() {
        const container = document.getElementById('parent-diary-list');
        if (!container) return;

        const entries = DiaryManager.getEntries();
        if (entries.length === 0) {
            container.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; color: var(--text-muted); padding: 32px 16px;">
                    <span style="font-size: 64px;">🎨</span>
                    <p style="margin-top: 12px; font-weight: 700; font-size: 18px;">¡Aún no hay obras de arte registradas!</p>
                    <p>El historial de dibujos y bitácoras del diario de Eliu aparecerá completo aquí.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = entries.map(entry => {
            let emoji = '🤖';
            if (entry.emocion === 'feliz') emoji = '😄 Feliz';
            if (entry.emocion === 'increible') emoji = '🤩 Super';
            if (entry.emocion === 'cansado') emoji = '😴 Cansado';
            if (entry.emocion === 'triste') emoji = '😢 Triste';
            if (entry.emocion === 'divertido') emoji = '🤪 Divertido';

            return `
                <div class="diary-item-card" id="card_${entry.id}">
                    <div class="diary-item-header">
                        <span>${entry.fecha}</span>
                        <span>${emoji}</span>
                    </div>
                    <img class="diary-item-thumb" src="${entry.dibujo}" alt="Dibujo de Eliu">
                    <p class="diary-item-text">"${entry.nota}"</p>
                    <div class="diary-item-actions">
                        <button class="btn-download-art" onclick="ParentDashboard.downloadArtwork('${entry.dibujo}', '${entry.id}')">
                            💾 Guardar Dibujo
                        </button>
                        <button class="btn-delete-entry" onclick="ParentDashboard.deleteEntryConfirm('${entry.id}')">
                            🗑️ Borrar
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    },

    // Guardar imagen en PNG localmente
    downloadArtwork(base64Data, id) {
        const link = document.createElement('a');
        link.href = base64Data;
        link.download = `dibujo_eliu_aprende_${id}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        SoundManager.play('success');
    },

    deleteEntryConfirm(id) {
        if (confirm("¿Estás seguro de que deseas eliminar permanentemente esta entrada de diario? Esto borrará el dibujo y la emoción de este día.")) {
            DiaryManager.deleteEntry(id);
            this.renderParentGallery();
            this.renderParentStats();
        }
    },

    // 💾 EXPORTACIÓN DE RESPALDO COMPLETO A ARCHIVO LOCAL JSON
    exportBackup() {
        const backupData = {
            diarios: DiaryManager.getEntries(),
            leccionesCompletas: this.getCompletedLessons(),
            paginasLibros: this.getBookPages(),
            estrellas: localStorage.getItem('eliu_aprende_estrellas') || 0,
            racha: localStorage.getItem('eliu_aprende_racha') || 0,
            stickersColocados: localStorage.getItem('eliu_aprende_stickers_colocados') || '[]',
            stickersDesbloqueados: localStorage.getItem('eliu_aprende_stickers_desbloqueados') || '[]',
            velocidadVoz: localStorage.getItem('eliu_aprende_velocidad_voz') || '0.75',
            planSemanal: localStorage.getItem('eliu_aprende_plan_semanal') || '[]',
            fechaRespaldo: new Date().toISOString()
        };

        const jsonString = JSON.stringify(backupData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const dateStr = new Date().toISOString().split('T')[0];
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `eliu_aprende_respaldo_${dateStr}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        SoundManager.play('success');
        alert("¡Historial exportado con éxito! Se ha descargado un archivo de seguridad .json en tu dispositivo. Guárdalo bien 🛡️");
    },

    // 📤 IMPORTACIÓN DE RESPALDO LOCAL JSON
    importBackup(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                
                // Validación básica de estructura
                if (!data.diarios || !data.paginasLibros) {
                    throw new Error("El archivo no tiene el formato correcto de Eliu Aprende");
                }

                // Confirmar antes de sobreescribir
                if (confirm("¡Se encontró un respaldo válido! Se importarán " + data.diarios.length + " dibujos del diario y su progreso acumulado de estudio. ¿Deseas sobreescribir los datos actuales?")) {
                    localStorage.setItem('eliu_aprende_diarios', JSON.stringify(data.diarios));
                    localStorage.setItem('eliu_aprende_lecciones_completas', JSON.stringify(data.leccionesCompletas || []));
                    localStorage.setItem('eliu_aprende_paginas', JSON.stringify(data.paginasLibros));
                    localStorage.setItem('eliu_aprende_estrellas', data.estrellas || 0);
                    localStorage.setItem('eliu_aprende_racha', data.racha || 0);
                    localStorage.setItem('eliu_aprende_stickers_colocados', data.stickersColocados || '[]');
                    localStorage.setItem('eliu_aprende_stickers_desbloqueados', data.stickersDesbloqueados || '[]');
                    localStorage.setItem('eliu_aprende_velocidad_voz', data.velocidadVoz || '0.75');
                    if (data.planSemanal) {
                        localStorage.setItem('eliu_aprende_plan_semanal', typeof data.planSemanal === 'string' ? data.planSemanal : JSON.stringify(data.planSemanal));
                    }

                    // Recargar todo el panel y vistas
                    this.init();
                    DiaryManager.init();
                    if (typeof Gamification !== 'undefined') {
                        Gamification.init();
                    }

                    SoundManager.play('success');
                    alert("¡Carga completada! Todos los datos, el historial de dibujos y el avance del examen libre han sido restaurados con éxito 🤖🎉");
                }
            } catch (err) {
                alert("Error al cargar el archivo de respaldo: " + err.message + "\nAsegúrate de seleccionar un archivo válido de respaldo de Eliu Aprende (.json)");
            }
        };
        reader.readAsText(file);
        
        // Resetear input file
        e.target.value = '';
    },

    // 🔊 MÉTODOS DE AJUSTES DE VOZ DE ELIUBOT
    loadVoiceSettings() {
        const savedSpeed = localStorage.getItem('eliu_aprende_velocidad_voz');
        const speed = savedSpeed ? parseFloat(savedSpeed) : 0.75;
        const speedSlider = document.getElementById('voice-speed-slider');
        if (speedSlider) {
            speedSlider.value = speed;
            this.updateVoiceSpeedLabel(speed);
        }

        const savedVol = localStorage.getItem('eliu_aprende_volumen_voz');
        const vol = savedVol !== null ? parseFloat(savedVol) : 1.0;
        const volSlider = document.getElementById('voice-volume-slider');
        if (volSlider) {
            volSlider.value = vol;
            this.updateVoiceVolumeLabel(vol);
        }

        const savedKey = localStorage.getItem('eliu_aprende_eleven_key') || '';
        const savedId = localStorage.getItem('eliu_aprende_eleven_id') || '';
        const keyInput = document.getElementById('voice-eleven-key');
        const idInput = document.getElementById('voice-eleven-id');
        if (keyInput) keyInput.value = savedKey;
        if (idInput) idInput.value = savedId;

        let savedGemini = localStorage.getItem('eliu_aprende_gemini_key');
        if (!savedGemini) {
            savedGemini = 'AIzaSyDiztJS8-qRAuDZO2Re83LF63Z5x-aIQTc';
            localStorage.setItem('eliu_aprende_gemini_key', savedGemini);
        }
        const geminiInput = document.getElementById('voice-gemini-key');
        if (geminiInput) geminiInput.value = savedGemini;

        // --- POPULAR SELECTOR DE VOCES NATIVAS EN ESPAÑOL ---
        this.populateSystemVoices();
        if (window.speechSynthesis) {
            window.speechSynthesis.onvoiceschanged = () => this.populateSystemVoices();
        }

        const systemVoiceSelect = document.getElementById('voice-system-selector');
        if (systemVoiceSelect) {
            systemVoiceSelect.onchange = (e) => {
                const voiceName = e.target.value;
                localStorage.setItem('eliu_aprende_voz_sistema', voiceName);
                SoundManager.play('success');
                if (typeof VoiceEngine !== 'undefined') {
                    VoiceEngine.speak("¡Hola Eliu! Esta es mi nueva voz del sistema en español.");
                }
            };
        }
    },

    updateVoiceSpeedLabel(val) {
        const label = document.getElementById('lbl-voice-speed');
        if (!label) return;
        
        let speedText = "Pausada";
        if (val <= 0.5) speedText = "Súper Lenta";
        else if (val <= 0.65) speedText = "Muy Lenta";
        else if (val >= 0.9) speedText = "Normal";
        
        label.innerText = `${speedText} (${val.toFixed(2)}x)`;
    },

    updateVoiceVolumeLabel(val) {
        const label = document.getElementById('lbl-voice-volume');
        if (label) label.innerText = `${Math.round(val * 100)}%`;
    },

    saveVoiceSpeed(val) {
        localStorage.setItem('eliu_aprende_velocidad_voz', val);
        this.updateVoiceSpeedLabel(val);
        SoundManager.play('success');
    },

    saveVoiceVolume(val) {
        localStorage.setItem('eliu_aprende_volumen_voz', val);
        this.updateVoiceVolumeLabel(val);
        SoundManager.play('success');
    },

    saveElevenSettings() {
        const keyInput = document.getElementById('voice-eleven-key');
        const idInput = document.getElementById('voice-eleven-id');
        const geminiInput = document.getElementById('voice-gemini-key');
        if (keyInput) localStorage.setItem('eliu_aprende_eleven_key', keyInput.value.trim());
        if (idInput) localStorage.setItem('eliu_aprende_eleven_id', idInput.value.trim());
        if (geminiInput) localStorage.setItem('eliu_aprende_gemini_key', geminiInput.value.trim());
    },

    testEliubotVoice() {
        SoundManager.play('click');
        // Simular habla de Eliubot
        if (typeof VoiceEngine !== 'undefined') {
            VoiceEngine.speak("¡Hola Eliu! Estoy hablando muy pausado y claro para que me entiendas súper bien. ¡Sigamos aprendiendo bloques!");
        }
    },

    // 📅 MÉTODOS DE PLANIFICACIÓN SEMANAL DE ESTUDIO
    getWeeklyPlan() {
        const saved = localStorage.getItem('eliu_aprende_plan_semanal');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                // Si el formato es antiguo (no tiene tasks), lo convertimos al nuevo formato
                if (parsed.length > 0 && !parsed[0].hasOwnProperty('tasks')) {
                    throw new Error("Formato antiguo");
                }
                return parsed;
            } catch (e) {
                // Fallback / Reset al nuevo plan con 2 materias
            }
        }
        
        // Plan por defecto con al menos dos materias por día
        const defaultPlan = [
            {
                day: "Lunes",
                tasks: [
                    { id: "lunes_1", subject: "lenguaje", subjectName: "Lenguaje", badgeColor: "var(--color-lenguaje)", icon: "📘", book: "Jugando con los Sonidos 3", pageKey: "jugandoSonidos", goal: "Separar palabras en sílabas y buscar rimas.", checked: false },
                    { id: "lunes_2", subject: "matematica", subjectName: "Caligrafía Números", badgeColor: "var(--color-matematica)", icon: "✍️", book: "Caligrafía 1° Básico", pageKey: "caligrafia", goal: "Trazar los números del 1 al 10 en cuadrícula.", checked: false }
                ]
            },
            {
                day: "Martes",
                tasks: [
                    { id: "martes_1", subject: "matematica", subjectName: "Matemática", badgeColor: "var(--color-matematica)", icon: "🔢", book: "Supermatemáticos 1", pageKey: "supermatematicos", goal: "Aprender a juntar bloques y sumar números.", checked: false },
                    { id: "martes_2", subject: "lenguaje", subjectName: "Caligrafía Letras", badgeColor: "var(--color-lenguaje)", icon: "✍️", book: "Caligrafía 1° Básico", pageKey: "caligrafia", goal: "Trazar vocales y consonantes M y P.", checked: false }
                ]
            },
            {
                day: "Miércoles",
                tasks: [
                    { id: "miercoles_1", subject: "ciencias", subjectName: "Ciencias", badgeColor: "var(--color-ciencias)", icon: "🌿", book: "Ciencias 1° Básico", pageKey: "ciencias", goal: "Sentidos del cuerpo y el búho Tucúquere.", checked: false },
                    { id: "miercoles_2", subject: "lenguaje", subjectName: "Lectura Vocal", badgeColor: "var(--color-lenguaje)", icon: "📖", book: "Jugando con los Sonidos 3", pageKey: "jugandoSonidos", goal: "Reconocer el sonido inicial de palabras.", checked: false }
                ]
            },
            {
                day: "Jueves",
                tasks: [
                    { id: "jueves_1", subject: "historia", subjectName: "Historia", badgeColor: "var(--color-historia)", icon: "🗺️", book: "Historia 1° Básico", pageKey: "historia", goal: "Días de la semana y la bandera chilena.", checked: false },
                    { id: "jueves_2", subject: "matematica", subjectName: "Matemática Bloques", badgeColor: "var(--color-matematica)", icon: "🔢", book: "Supermatemáticos 1", pageKey: "supermatematicos", goal: "Contar colecciones y agrupar en decenas.", checked: false }
                ]
            },
            {
                day: "Viernes",
                tasks: [
                    { id: "viernes_1", subject: "lenguaje", subjectName: "Caligrafía", badgeColor: "var(--color-lenguaje)", icon: "✍️", book: "Caligrafía 1° Básico", pageKey: "caligrafia", goal: "Trazar consonantes en triple renglón.", checked: false },
                    { id: "viernes_2", subject: "ciencias", subjectName: "Ciencias Plantas", badgeColor: "var(--color-ciencias)", icon: "🌿", book: "Ciencias 1° Básico", pageKey: "ciencias", goal: "Identificar partes de una planta y hojas.", checked: false }
                ]
            }
        ];
        this.saveWeeklyPlan(defaultPlan);
        return defaultPlan;
    },

    saveWeeklyPlan(plan) {
        localStorage.setItem('eliu_aprende_plan_semanal', JSON.stringify(plan));
    },

    renderWeeklyPlanner() {
        const grid = document.getElementById('parent-weekly-planner-grid');
        if (!grid) return;
        
        const plan = this.getWeeklyPlan();
        const bookPages = this.getBookPages();
        
        // Calcular porcentaje completado
        let totalTasks = 0;
        let completedTasks = 0;
        plan.forEach(day => {
            day.tasks.forEach(task => {
                totalTasks++;
                if (task.checked) completedTasks++;
            });
        });
        const percent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        
        document.getElementById('weekly-progress-percent').innerText = `${percent}%`;
        document.getElementById('weekly-progress-fill').style.width = `${percent}%`;
        
        // Obtener el día actual (0 es Domingo, 1 Lunes, 5 Viernes, etc.)
        const todayNum = new Date().getDay();
        const dayMap = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
        const todayName = dayMap[todayNum];
        
        grid.innerHTML = plan.map((dayItem, dayIdx) => {
            const isToday = dayItem.day === todayName;
            const activeClass = isToday ? 'active-day' : '';
            
            // Renderizar las misiones del día
            const tasksHtml = dayItem.tasks.map((task, taskIdx) => {
                // Obtener número de página dinámicamente si aplica
                let pageText = "";
                if (task.pageKey === "supermatematicos") pageText = ` (Pág. ${bookPages.supermatematicos})`;
                if (task.pageKey === "jugandoSonidos") pageText = ` (Pág. ${bookPages.jugandoSonidos})`;
                if (task.pageKey === "caligrafia") pageText = ` (Pág. ${bookPages.caligrafia})`;
                
                return `
                    <div class="weekly-task-item" style="border-left: 4px solid ${task.badgeColor}; padding-left: 10px; margin-bottom: 12px; background: rgba(255,255,255,0.05); padding: 8px 12px; border-radius: 8px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                            <span class="weekly-day-subject-badge" style="background-color: ${task.badgeColor}; font-size: 10px; padding: 2px 6px;">${task.subjectName}</span>
                        </div>
                        <div style="font-weight: 700; color: var(--text-main); font-size: 13px; margin-bottom: 2px;">
                            ${task.icon} ${task.book}${pageText}
                        </div>
                        <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 6px;">${task.goal}</div>
                        <label class="weekly-day-checkbox-label" style="margin-top: 4px; font-size: 12px;">
                            <input type="checkbox" class="weekly-day-checkbox-input" 
                                   ${task.checked ? 'checked' : ''} 
                                   onchange="ParentDashboard.toggleWeeklyDayCheck(${dayIdx}, ${taskIdx})">
                            <span>¡Meta lograda! ⭐</span>
                        </label>
                    </div>
                `;
            }).join('');

            return `
                <div class="weekly-day-card ${activeClass}" style="display: flex; flex-direction: column; gap: 8px; padding: 14px;">
                    <div class="weekly-day-header" style="border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 8px; margin-bottom: 8px;">
                        <span class="weekly-day-name" style="font-size: 16px; font-weight: 800;">${dayItem.day}</span>
                        ${isToday ? '<span style="background: var(--roblox-red); color: white; font-size: 10px; padding: 2px 6px; border-radius: 4px; font-family: var(--font-parents); font-weight: 700; margin-left: 8px;">HOY</span>' : ''}
                    </div>
                    <div class="weekly-day-body" style="flex: 1;">
                        ${tasksHtml}
                    </div>
                </div>
            `;
        }).join('');
    },

    toggleWeeklyDayCheck(dayIdx, taskIdx) {
        const plan = this.getWeeklyPlan();
        plan[dayIdx].tasks[taskIdx].checked = !plan[dayIdx].tasks[taskIdx].checked;
        this.saveWeeklyPlan(plan);
        this.renderWeeklyPlanner();
        this.renderParentStats();
        SoundManager.play('success');
        
        // Recargar dashboard infantil para ver actualización
        if (typeof Gamification !== 'undefined') {
            Gamification.renderKidsDashboard();
        }
    },

    // 🔀 NAVEGACIÓN Y CAMBIO DE PESTAÑAS (TABS)
    switchTab(tabId) {
        SoundManager.play('click');
        
        // Desactivar todos los botones de tab y secciones
        document.querySelectorAll('.btn-parent-tab').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.parent-tab-section').forEach(sec => sec.classList.remove('active'));
        
        // Activar el tab seleccionado
        const targetBtn = document.querySelector(`.btn-parent-tab[data-tab="${tabId}"]`);
        if (targetBtn) targetBtn.classList.add('active');
        
        const targetSec = document.getElementById(tabId);
        if (targetSec) targetSec.classList.add('active');

        // Cargar datos específicos del tab
        if (tabId === 'tab-resumen') {
            this.renderParentStats();
            this.renderSubjectProgress();
            this.renderParentGallery();
            this.renderWeeklyPlanner();
        } else if (tabId === 'tab-avance-temario') {
            this.renderAvanceTemario();
        } else if (tabId === 'tab-historial-sesiones') {
            this.renderHistorialSesiones();
        } else if (tabId === 'tab-areas-debiles') {
            this.renderAreasDebiles();
        } else if (tabId === 'tab-retencion') {
            this.renderRetencion();
        } else if (tabId === 'tab-habitos') {
            this.renderHabitsCalendar();
        } else if (tabId === 'tab-chats') {
            this.renderChatLogs();
        } else if (tabId === 'tab-cofre') {
            this.renderCofreAudios();
        } else if (tabId === 'tab-patrones') {
            this.renderAIPatterns();
        }
    },

    // 📈 RENDERIZAR TAB AVANCE TEMARIO (FASE 3)
    async renderAvanceTemario() {
        const container = document.getElementById('parent-avance-temario-container');
        if (!container) return;

        if (typeof supabaseClient === 'undefined') {
            container.innerHTML = '<div style="color:var(--roblox-red); padding: 20px; font-weight: bold;">⚠️ Supabase no está conectado. Verifica tu conexión.</div>';
            return;
        }

        container.innerHTML = '<div style="text-align: center; padding: 20px; color: var(--text-muted);">Cargando OAs desde la base de datos... ⏳</div>';

        try {
            const { data, error } = await supabaseClient
                .from('vista_panel_padres')
                .select('*')
                .order('materia', { ascending: true })
                .order('oa_codigo', { ascending: true });

            if (error) throw error;

            if (!data || data.length === 0) {
                container.innerHTML = '<div style="padding: 20px; color: var(--text-muted);">No hay datos de OAs registrados en la base de datos.</div>';
                return;
            }

            // Agrupar por materia
            const materiasObj = {};
            data.forEach(row => {
                const mat = row.materia || 'Otra';
                if (!materiasObj[mat]) materiasObj[mat] = [];
                materiasObj[mat].push(row);
            });

            let html = '';
            const order = ['Lenguaje', 'Matemática', 'Ciencias', 'Historia'];
            const sortedMaterias = Object.keys(materiasObj).sort((a, b) => {
                const ia = order.indexOf(a);
                const ib = order.indexOf(b);
                return (ia > -1 ? ia : 99) - (ib > -1 ? ib : 99);
            });

            sortedMaterias.forEach(mat => {
                const rows = materiasObj[mat];
                let matColor = "var(--text-main)";
                if (mat === 'Lenguaje') matColor = "var(--color-lenguaje)";
                if (mat === 'Matemática') matColor = "var(--color-matematica)";
                if (mat === 'Ciencias') matColor = "var(--color-ciencias)";
                if (mat === 'Historia') matColor = "var(--color-historia)";

                html += `<h4 style="margin-top: 20px; margin-bottom: 10px; color: ${matColor}; font-size: 16px; border-bottom: 2px solid ${matColor}; padding-bottom: 6px; font-weight: 800;">📚 ${mat}</h4>`;
                
                rows.forEach(oa => {
                    let statusEmoji = '⏳';
                    let statusColor = '#e2e8f0';
                    let statusLabel = 'No Iniciado';

                    if (oa.estado === 'en_progreso' || oa.estado === 'debil') {
                        statusEmoji = '🔄';
                        statusColor = '#fef08a';
                        statusLabel = oa.estado === 'debil' ? 'Requiere Apoyo' : 'En Progreso';
                    } else if (oa.estado === 'consolidado') {
                        statusEmoji = '✅';
                        statusColor = '#bbf7d0';
                        statusLabel = 'Consolidado';
                    }

                    html += `
                        <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(0,0,0,0.1); border-radius: 8px; padding: 12px; margin-bottom: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
                                <div style="font-weight: 700; font-size: 14px; color: var(--text-main); flex: 1;">
                                    <span style="background: ${matColor}; color: white; padding: 3px 6px; border-radius: 4px; font-size: 12px; margin-right: 8px; display: inline-block;">${oa.oa_codigo}</span>
                                    <span style="display: inline-block;">${oa.descripcion || 'Sin descripción'}</span>
                                </div>
                                <div style="background: ${statusColor}; color: #1f2937; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 700; white-space: nowrap; display: flex; align-items: center; gap: 6px; margin-left: 12px;">
                                    <span>${statusEmoji}</span> ${statusLabel}
                                </div>
                            </div>
                            <div style="font-size: 13px; color: var(--text-muted); display: flex; gap: 16px;">
                                <span>🎯 <b>Practicado:</b> ${oa.veces_practicado || 0} veces</span>
                            </div>
                            ${oa.recomendacion_ia ? `<div style="margin-top: 10px; font-size: 13px; background: #eff6ff; color: #1e40af; padding: 10px; border-radius: 6px; border-left: 4px solid #3b82f6;">🤖 <b>IA:</b> ${oa.recomendacion_ia}</div>` : ''}
                        </div>
                    `;
                });
            });

            container.innerHTML = html;
        } catch (error) {
            console.error("Error cargando vista_panel_padres:", error);
            container.innerHTML = '<div style="color:var(--roblox-red); padding: 20px;">Ocurrió un error al cargar el avance del temario desde el servidor.</div>';
        }
    },

    // 📋 RENDERIZAR TAB HISTORIAL DE SESIONES
    async renderHistorialSesiones() {
        const container = document.getElementById('parent-historial-container');
        if (!container || typeof supabaseClient === 'undefined') return;
        
        const { data, error } = await supabaseClient
            .from('sesiones')
            .select(`
            id, fecha, hora_inicio, hora_fin, oa_codigo, duracion_minutos,
            evaluaciones (porcentaje, correctas, total)
            `)
            .eq('user_id', USER_ID)
            .order('hora_inicio', { ascending: false })
            .limit(50);
        
        if (error || !data) { container.innerHTML = '<p>Error al cargar historial</p>'; return; }
        
        let html = '<table style="width:100%; font-size:13px; text-align: left; border-collapse: collapse;"><thead><tr style="border-bottom: 2px solid #e2e8f0;">' +
            '<th style="padding: 8px;">Fecha</th><th style="padding: 8px;">Hora</th><th style="padding: 8px;">OA</th><th style="padding: 8px;">Duración</th><th style="padding: 8px;">% Score</th>' +
            '</tr></thead><tbody>';
        data.forEach(s => {
            const eval = s.evaluaciones?.[0];
            const pct = eval ? `${eval.correctas}/${eval.total} (${eval.porcentaje}%)` : '—';
            const hora = s.hora_inicio ? new Date(s.hora_inicio).toLocaleTimeString('es-CL', {hour:'2-digit', minute:'2-digit'}) : '—';
            html += `<tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 8px;">${s.fecha}</td><td style="padding: 8px;">${hora}</td><td style="padding: 8px; font-weight: bold;">${s.oa_codigo || '—'}</td><td style="padding: 8px;">${s.duracion_minutos || '—'} min</td><td style="padding: 8px;">${pct}</td></tr>`;
        });
        html += '</tbody></table>';
        container.innerHTML = html;
    },

    // 🚨 RENDERIZAR TAB ÁREAS A REFORZAR
    async renderAreasDebiles() {
        const container = document.getElementById('parent-areas-debiles-container');
        if (!container || typeof supabaseClient === 'undefined') return;
        
        const { data, error } = await supabaseClient
            .from('areas_debiles')
            .select('*')
            .eq('user_id', USER_ID)
            .eq('resuelto', false)
            .order('fecha_detectado', { ascending: false });
        
        if (error) { container.innerHTML = '<p>Error</p>'; return; }
        
        if (!data || data.length === 0) {
            container.innerHTML = '<div style="padding:20px; color:#16a34a; font-weight: bold; text-align: center;">🎉 ¡No hay áreas débiles por ahora!</div>';
            return;
        }
        
        let html = '';
        data.forEach(a => {
            html += `
            <div style="background:#fef2f2; border-left:4px solid #ef4444; padding:12px; margin-bottom:10px; border-radius:6px;">
                <strong>${a.oa_codigo}</strong> — ${a.porcentaje}% el ${new Date(a.fecha_detectado).toLocaleDateString('es-CL')}
                <button onclick="ParentDashboard.marcarResuelto('${a.id}')" 
                        style="float:right; background:#16a34a; color:white; border:0; padding:6px 12px; border-radius:6px; cursor:pointer;">
                ✓ Resuelto
                </button>
            </div>`;
        });
        container.innerHTML = html;
    },

    async marcarResuelto(id) {
        if (typeof supabaseClient === 'undefined') return;
        await supabaseClient.from('areas_debiles')
            .update({ resuelto: true, resuelto_fecha: new Date().toISOString() })
            .eq('id', id);
        this.renderAreasDebiles();  // refrescar
    },

    // 📈 Gráfico de evolución: promedio de aciertos agrupado cada 3 días
    async construirGraficoEvolucion() {
        try {
            const { data, error } = await supabaseClient
                .from('evaluaciones')
                .select('porcentaje, created_at')
                .order('created_at', { ascending: true })
                .limit(300);
            if (error || !data || data.length < 1) {
                return '<p style="font-size:13px; color:#94a3b8; margin-bottom:16px;">📈 El gráfico de evolución aparecerá cuando Eliú tenga evaluaciones registradas.</p>';
            }
            // Agrupar en bloques de 3 días (basado en días desde epoch)
            const DIAS = 3;
            const buckets = {};
            data.forEach(d => {
                const t = new Date(d.created_at).getTime();
                const diaEpoch = Math.floor(t / (1000 * 60 * 60 * 24));
                const bloque = Math.floor(diaEpoch / DIAS);
                if (!buckets[bloque]) buckets[bloque] = { suma: 0, n: 0, primerDia: diaEpoch };
                buckets[bloque].suma += Number(d.porcentaje) || 0;
                buckets[bloque].n++;
            });
            const claves = Object.keys(buckets).map(Number).sort((a, b) => a - b);
            const pts = claves.map(k => Math.round(buckets[k].suma / buckets[k].n));
            const etiquetas = claves.map(k => {
                const fecha = new Date(buckets[k].primerDia * 24 * 60 * 60 * 1000);
                return (fecha.getDate()) + '/' + (fecha.getMonth() + 1);
            });

            if (pts.length < 2) {
                return `<div style="background:white; border:1px solid #e2e8f0; border-radius:12px; padding:14px; margin-bottom:16px;">
                    <strong style="font-size:14px; color:#1e293b;">📈 Evolución (cada 3 días)</strong>
                    <p style="font-size:13px; color:#64748b; margin-top:8px;">Por ahora hay un solo bloque (promedio ${pts[0]}%). El gráfico de tendencia aparecerá cuando pasen más días con práctica.</p>
                </div>`;
            }

            const W = 320, H = 130, pad = 26;
            const stepX = (W - pad * 2) / (pts.length - 1);
            const coords = pts.map((p, i) => {
                const x = pad + i * stepX;
                const y = H - pad - (p / 100) * (H - pad * 2);
                return [x, y];
            });
            const linea = coords.map((c, i) => (i === 0 ? 'M' : 'L') + c[0].toFixed(1) + ',' + c[1].toFixed(1)).join(' ');
            const puntos = coords.map((c, i) =>
                `<circle cx="${c[0].toFixed(1)}" cy="${c[1].toFixed(1)}" r="3.5" fill="#3b82f6"/>` +
                `<text x="${c[0].toFixed(1)}" y="${(c[1] - 7).toFixed(1)}" font-size="9" fill="#1e293b" text-anchor="middle">${pts[i]}%</text>`
            ).join('');
            const ejeX = coords.map((c, i) =>
                `<text x="${c[0].toFixed(1)}" y="${H - 6}" font-size="8" fill="#94a3b8" text-anchor="middle">${etiquetas[i]}</text>`
            ).join('');
            const y60 = H - pad - 0.60 * (H - pad * 2);
            const tendencia = pts[pts.length - 1] > pts[0] ? '📈 subiendo' : (pts[pts.length - 1] < pts[0] ? '📉 bajando' : '➡️ estable');
            return `
                <div style="background:white; border:1px solid #e2e8f0; border-radius:12px; padding:14px; margin-bottom:16px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                        <strong style="font-size:14px; color:#1e293b;">📈 Evolución (promedio cada 3 días)</strong>
                        <span style="font-size:12px; color:#64748b;">${tendencia}</span>
                    </div>
                    <svg viewBox="0 0 ${W} ${H}" style="width:100%; height:auto;">
                        <line x1="${pad}" y1="${y60.toFixed(1)}" x2="${W - pad}" y2="${y60.toFixed(1)}" stroke="#fca5a5" stroke-dasharray="4 4" stroke-width="1"/>
                        <text x="${pad}" y="${(y60 - 4).toFixed(1)}" font-size="9" fill="#ef4444">60% (mínimo)</text>
                        <path d="${linea}" fill="none" stroke="#3b82f6" stroke-width="2.5"/>
                        ${puntos}
                        ${ejeX}
                    </svg>
                    <div style="font-size:11px; color:#94a3b8; text-align:center;">Cada punto es el promedio de un período de 3 días</div>
                </div>`;
        } catch (e) {
            return '';
        }
    },

    // 🧠 RETENCIÓN: ¿memorizó de verdad o solo de corto plazo?
    async renderRetencion() {
        const container = document.getElementById('parent-retencion-container');
        if (!container || typeof supabaseClient === 'undefined') return;
        container.innerHTML = '<div style="padding:20px; color:#64748b;">Analizando la retención… ⏳</div>';

        const grafico = await this.construirGraficoEvolucion();

        const { data, error } = await supabaseClient
            .from('vista_retencion')
            .select('*')
            .eq('user_id', USER_ID);

        if (error) { container.innerHTML = '<div style="padding:20px; color:#ef4444;">Error al cargar retención.</div>'; return; }
        if (!data || data.length === 0) {
            container.innerHTML = grafico + '<div style="padding:20px; color:#64748b;">Todavía no hay suficientes prácticas para medir la retención por tema. Cuando Eliú repita un mismo tema varias veces, aquí verás si lo aprendió de verdad o solo lo recordó un rato.</div>';
            return;
        }

        const meta = {
            memorizado:   { e:'🟢', t:'Aprendido de verdad', c:'#16a34a' },
            mejorando:    { e:'🔵', t:'Mejorando',            c:'#2563eb' },
            practicando:  { e:'🟡', t:'Practicando',          c:'#ca8a04' },
            olvidando:    { e:'🟠', t:'Está olvidando',       c:'#ea580c' },
            riesgo_olvido:{ e:'🔴', t:'Riesgo de olvido',     c:'#dc2626' },
            recien_visto: { e:'⚪', t:'Recién visto',         c:'#64748b' }
        };
        const orden = ['riesgo_olvido','olvidando','practicando','mejorando','recien_visto','memorizado'];
        data.sort((a,b) => orden.indexOf(a.estado_retencion) - orden.indexOf(b.estado_retencion));

        let html = grafico + '<p style="font-size:13px; color:#64748b; margin-bottom:14px;">Esto distingue si Eliú <b>realmente aprendió</b> un tema (lo recuerda después de varios días) o si solo lo tuvo en memoria de corto plazo.</p>';
        data.forEach(r => {
            const m = meta[r.estado_retencion] || meta.recien_visto;
            html += `
                <div style="background:rgba(255,255,255,0.05); border:1px solid rgba(0,0,0,0.1); border-left:4px solid ${m.c}; border-radius:8px; padding:12px; margin-bottom:10px;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span style="font-weight:700; font-size:14px;">${r.oa_codigo} · ${r.titulo}</span>
                        <span style="background:${m.c}; color:white; padding:3px 10px; border-radius:20px; font-size:12px; font-weight:700; white-space:nowrap;">${m.e} ${m.t}</span>
                    </div>
                    <div style="font-size:12px; color:#64748b; margin-top:6px;">
                        Practicado ${r.total_evals} ${r.total_evals === 1 ? 'vez' : 'veces'} ·
                        promedio ${r.promedio_global || 0}% ·
                        última práctica hace ${r.dias_desde_ultima} ${r.dias_desde_ultima === 1 ? 'día' : 'días'}
                    </div>
                </div>`;
        });
        container.innerHTML = html;
    },

    // 🦷🚿 RENDERIZAR REGISTRO DE HÁBITOS COMPLETO
    renderHabitsCalendar() {
        const container = document.getElementById('parent-habits-calendar-grid');
        if (!container) return;

        let history = [];
        const savedHistory = localStorage.getItem('eliu_aprende_habitos_historial');
        if (savedHistory) {
            try { history = JSON.parse(savedHistory); } catch(e) {}
        }

        if (history.length === 0) {
            container.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; color: var(--text-muted); padding: 32px 16px; font-family: var(--font-parents);">
                    <span style="font-size: 48px;">🦷🚿</span>
                    <p style="margin-top: 12px; font-weight: 700; font-size: 16px; color: #2d3748;">¡Aún no hay registros de hábitos!</p>
                    <p>Cuando Eliu complete sus misiones de hábitos diarios por la mañana, los detalles aparecerán aquí.</p>
                </div>
            `;
            return;
        }

        const habitsMeta = {
            dientes: { label: 'Dientes 🦷', icon: '🦷' },
            banar: { label: 'Bañarse 🚿', icon: '🚿' },
            manos: { label: 'Manos 🧼', icon: '🧼' },
            cama: { label: 'Cama 🛏️', icon: '🛏️' },
            juguetes: { label: 'Juguetes 🧸', icon: '🧸' },
            agua: { label: 'Agua 💧', icon: '💧' }
        };

        // Render logs
        container.innerHTML = history.map(dayLog => {
            const checks = dayLog.checks || {};
            
            // Build mini badges
            const badgesHtml = Object.keys(habitsMeta).map(key => {
                const checked = checks[key] === true;
                const statusClass = checked ? 'yes' : 'no';
                const statusEmoji = checked ? '👍' : '👎';
                return `
                    <div class="habit-mini-badge ${statusClass}">
                        <span>${habitsMeta[key].icon}</span>
                        <span style="margin-top: 2px;">${statusEmoji}</span>
                    </div>
                `;
            }).join('');

            // Buscar explicaciones de "No" en esta misma fecha
            let explanationHtml = "";
            let chatLogs = [];
            try {
                chatLogs = JSON.parse(localStorage.getItem('eliu_aprende_chat_logs')) || [];
            } catch(e) {}
            
            const relevantChats = chatLogs.filter(log => log.fecha === dayLog.fecha && log.tipo === "Hábitos (No)");

            if (relevantChats.length > 0) {
                explanationHtml = relevantChats.map(chat => `
                    <div style="font-size: 12px; font-style: italic; background: #fff5f5; border-left: 3px solid var(--roblox-red); padding: 6px 10px; border-radius: 4px; margin-top: 8px; color: #9b2c2c; font-weight: 600;">
                        🗣️ ${chat.nino}
                    </div>
                `).join('');
            }

            return `
                <div class="habit-day-card">
                    <div class="habit-day-header">
                        <span>📅 Día: ${dayLog.fecha}</span>
                        <span style="color: var(--neon-gold); font-weight: 800;">⭐ +30 Puntos</span>
                    </div>
                    <div class="habit-day-row-grid">
                        ${badgesHtml}
                    </div>
                    ${explanationHtml}
                </div>
            `;
        }).join('');
    },

    // 💬 RENDERIZAR BITÁCORA DE CHATS
    renderChatLogs() {
        const container = document.getElementById('parent-chat-logs-container');
        if (!container) return;

        let logs = [];
        try {
            logs = JSON.parse(localStorage.getItem('eliu_aprende_chat_logs')) || [];
        } catch(e) {}

        if (logs.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; color: var(--text-muted); padding: 32px 16px; font-family: var(--font-parents);">
                    <span style="font-size: 48px;">💬</span>
                    <p style="margin-top: 12px; font-weight: 700; font-size: 16px; color: #2d3748;">¡Aún no hay conversaciones registradas!</p>
                    <p>Las dudas por voz y las videollamadas con IA de Eliu se registrarán de forma transparente aquí.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = logs.map(log => {
            let badgeColor = "#3182ce";
            if (log.tipo === "Videollamada Sandbox") badgeColor = "#2ecc71";
            if (log.tipo === "Duda de Voz") badgeColor = "#9b59b6";
            if (log.tipo.startsWith("Hábitos")) badgeColor = "var(--color-diario)";

            return `
                <div class="chat-log-card">
                    <div class="chat-log-header">
                        <span style="background: ${badgeColor}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 700;">${log.tipo}</span>
                        <span>📅 ${log.fecha} a las ${log.hora}</span>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 8px;">
                        <div class="chat-log-bubble nino">
                            👦 Eliu: "${log.nino}"
                        </div>
                        <div class="chat-log-bubble bot">
                            🤖 Eliubot: "${log.bot}"
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    },

    clearChatLogsConfirm() {
        SoundManager.play('click');
        if (confirm("¿Estás seguro de que deseas vaciar por completo la bitácora de chats? Esta acción no se puede deshacer.")) {
            localStorage.removeItem('eliu_aprende_chat_logs');
            SoundManager.play('wrong');
            this.renderChatLogs();
            this.renderParentStats();
        }
    },

    // 🎁 Playlist de Audios del Cofre de Recuerdos
    renderCofreAudios() {
        const container = document.getElementById('parent-cofre-playlist-container');
        if (!container) return;

        let audios = [];
        const savedAudios = localStorage.getItem('eliu_aprende_recorded_audios');
        if (savedAudios) {
            try { audios = JSON.parse(savedAudios); } catch(e) {}
        }

        if (audios.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; color: var(--text-muted); padding: 32px 16px; font-family: var(--font-parents);">
                    <span style="font-size: 48px;">🎁</span>
                    <p style="margin-top: 12px; font-weight: 700; font-size: 16px; color: #2d3748;">¡Aún no hay audios grabados en el cofre!</p>
                    <p>Las gemas de voz que grabe Eliu en sus súper desafíos infantiles aparecerán aquí con controles de reproducción directa.</p>
                </div>
            `;
            return;
        }

        const typeLabels = {
            chiste: '💬 Chiste Divertido',
            historia: '🐱 Historia Loca',
            cancion: '🎵 Canción del Corazón',
            imitacion: '🦖 Imitación Graciosa',
            felicidad: '☀️ Cosas Felices'
        };

        container.innerHTML = audios.map(audio => {
            const labelText = typeLabels[audio.type] || audio.label || 'Recuerdo Mágico';
            return `
                <div class="playlist-audio-item" id="audio_item_${audio.id}">
                    <div class="audio-item-info">
                        <div class="audio-item-title">${labelText}</div>
                        <div class="audio-item-meta">📅 Grabado el ${audio.date} a las ${audio.time} | Desafío: "${audio.label}"</div>
                    </div>
                    <div class="audio-item-controls">
                        <button class="btn-audio-play" onclick="ParentDashboard.playRecordedAudio('${audio.id}')" title="Reproducir Audio">
                            ▶️ Play
                        </button>
                        <button class="btn-audio-delete" onclick="ParentDashboard.deleteRecordedAudioConfirm('${audio.id}')" title="Borrar Audio">
                            🗑️ Borrar
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    },

    currentPlayingAudio: null,
    playRecordedAudio(id) {
        SoundManager.play('click');
        let audios = [];
        const savedAudios = localStorage.getItem('eliu_aprende_recorded_audios');
        if (savedAudios) {
            try { audios = JSON.parse(savedAudios); } catch(e) {}
        }

        const audio = audios.find(a => a.id === id);
        if (!audio) return;

        // Detener audio previo si hay uno sonando
        if (this.currentPlayingAudio) {
            this.currentPlayingAudio.pause();
            this.currentPlayingAudio = null;
            // Restablecer etiquetas visuales
            this.renderCofreAudios();
            return;
        }

        try {
            this.currentPlayingAudio = new Audio(audio.dataUrl);
            this.currentPlayingAudio.play();
            
            const btn = document.querySelector(`#audio_item_${id} .btn-audio-play`);
            if (btn) {
                btn.innerText = "⏹️ Stop";
                btn.onclick = () => {
                    this.currentPlayingAudio.pause();
                    this.currentPlayingAudio = null;
                    btn.innerText = "▶️ Play";
                    btn.onclick = () => this.playRecordedAudio(id);
                };
            }
            
            this.currentPlayingAudio.onended = () => {
                if (btn) {
                    btn.innerText = "▶️ Play";
                    btn.onclick = () => this.playRecordedAudio(id);
                }
                this.currentPlayingAudio = null;
            };
        } catch(e) {
            console.error("Error al reproducir audio:", e);
        }
    },

    deleteRecordedAudioConfirm(id) {
        SoundManager.play('click');
        if (confirm("¿Estás seguro de que deseas eliminar permanentemente este audio grabado del cofre?")) {
            let audios = [];
            const savedAudios = localStorage.getItem('eliu_aprende_recorded_audios');
            if (savedAudios) {
                try { audios = JSON.parse(savedAudios); } catch(e) {}
            }

            audios = audios.filter(a => a.id !== id);
            localStorage.setItem('eliu_aprende_recorded_audios', JSON.stringify(audios));

            SoundManager.play('wrong');
            this.renderCofreAudios();
            
            // Recargar gemas del cofre infantil
            if (typeof CofreManager !== 'undefined' && CofreManager.loadGems) {
                CofreManager.loadGems();
            }
        }
    },

    // 🧠 RENDERIZAR PATRONES DE APRENDIZAJE E INFORMES
    renderAIPatterns() {
        const grid = document.getElementById('parent-ai-insights-grid');
        if (!grid) return;

        const bookPages = this.getBookPages();
        const lecciones = this.getCompletedLessons();
        const totalEstrellas = localStorage.getItem('eliu_aprende_estrellas') || 0;
        const entries = DiaryManager.getEntries();

        // Calcular fortalezas y recomendaciones dinámicas
        let mathCount = lecciones.filter(l => l.startsWith('matematica')).length;
        let langCount = lecciones.filter(l => l.startsWith('lenguaje')).length;

        // Fortalezas
        let fortalezaText = "Eliu ha demostrado un gran entusiasmo por el mapa interactivo Roblox. Muestra perseverancia y le encanta recolectar estrellas de premios.";
        if (mathCount > langCount) {
            fortalezaText = "Muestra una excelente habilidad lógico-matemática y concentración para juntar bloques. Eliu resolvió rápidamente sumas y conteos en la Isla de Números.";
        } else if (langCount > 0) {
            fortalezaText = "Muestra gran interés en el reconocimiento fónico, lectura silábica y caligrafía de letras. Le gusta escuchar la voz de Eliubot leer cuentos.";
        }

        // Áreas de mejora
        let mejoraText = "En caligrafía se sugiere continuar trazando en triple renglón para fortalecer la motricidad fina y la separación clara de letras.";
        if (bookPages.jugandoSonidos < 50) {
            mejoraText = `Se sugiere practicar la segmentación de sílabas y rimas en la página ${bookPages.jugandoSonidos} del libro "Jugando con los Sonidos 3" para mejorar fluidez de lectura.`;
        }

        // Recomendación de Eliubot (IA)
        let recomendacionText = `1. Continuar con la planificación semanal. Mañana se sugiere avanzar a la página ${bookPages.supermatematicos + 1} de Supermatemáticos.\n2. Mantener la racha de hábitos de salud diarios (especialmente el cepillado de dientes 🦷 por la noche).\n3. Incentivar a Eliu a contar un chiste o cantar en su Cofre de Recuerdos para evaluar pronunciación oral de forma lúdica.`;

        grid.innerHTML = `
            <div class="insight-card" style="border-left: 5px solid #2ecc71; background: white;">
                <h4><span>💪</span> Fortalezas del Estudiante</h4>
                <p>${fortalezaText}</p>
                <div style="font-size: 11px; color: var(--text-muted); font-weight: 700; margin-top: 10px;">Basado en ${lecciones.length} lecciones completadas y ${totalEstrellas}⭐ de Roblox acumuladas.</div>
            </div>
            
            <div class="insight-card" style="border-left: 5px solid #f1c40f; background: white;">
                <h4><span>⚠️</span> Áreas de Refuerzo</h4>
                <p>${mejoraText}</p>
                <div style="font-size: 11px; color: var(--text-muted); font-weight: 700; margin-top: 10px;">Basado en páginas actuales de libros y autoevaluación emocional del diario (${entries.length} dibujos).</div>
            </div>
            
            <div class="insight-card" style="border-left: 5px solid #3498db; grid-column: 1 / -1; background: white;">
                <h4><span>🤖</span> Plan de Acción Pedagógico Recomendado</h4>
                <p style="white-space: pre-line;">${recomendacionText}</p>
                <div style="font-size: 11px; color: var(--text-muted); font-weight: 700; margin-top: 10px;">Este plan de acción se adapta dinámicamente según la racha y hábitos logrados.</div>
            </div>
        `;
    },

    // 🔊 POPULAR LAS VOCES EN ESPAÑOL DISPONIBLES EN EL NAVEGADOR
    populateSystemVoices(retryCount = 0) {
        const selector = document.getElementById('voice-system-selector');
        if (!selector || !window.speechSynthesis) return;

        let voices = window.speechSynthesis.getVoices();
        
        // Si la lista de voces está vacía, reintentar en 250ms con límite de 10 veces (Soluciona la carga asíncrona en Chrome/Edge sin bucle infinito)
        if (voices.length === 0) {
            if (retryCount < 10) {
                setTimeout(() => this.populateSystemVoices(retryCount + 1), 250);
            } else {
                selector.innerHTML = '<option value="">No se detectaron voces en el sistema</option>';
            }
            return;
        }

        const esVoices = voices.filter(v => v.lang.toLowerCase().startsWith('es'));

        if (esVoices.length === 0) {
            // Mostrar todas las voces si por alguna razón no hay ninguna en español en el equipo
            selector.innerHTML = '<option value="">Elige una voz disponible:</option>' + 
                                 voices.map(v => `<option value="${v.name}">${v.name} (${v.lang})</option>`).join('');
            return;
        }

        const savedVoice = localStorage.getItem('eliu_aprende_voz_sistema') || '';

        selector.innerHTML = esVoices.map(v => {
            const selected = v.name === savedVoice ? 'selected' : '';
            return `<option value="${v.name}" ${selected}>${v.name} (${v.lang})</option>`;
        }).join('');
    }
};
