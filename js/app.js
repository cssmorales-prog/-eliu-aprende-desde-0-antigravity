/* ==========================================================================
   LÓGICA PRINCIPAL, RUTA, GAMIFICACIÓN Y VOZ DE ELIUBOT
   Módulo: js/app.js
   Manejo de sonido sintético, voz interactiva y simulación de videollamada.
   ========================================================================== */

const Fase1API = {
    async init() {
        if (typeof supabaseClient === 'undefined') return;
        await this.renderMisiones();
        await this.renderStats();
    },

    async renderMisiones() {
        const { data: cola, error } = await supabaseClient
            .from('cola_hoy')
            .select('*')
            .eq('user_id', USER_ID);
            
        if (error || !cola) return;
        
        const container = document.getElementById('misiones-lista');
        if (!container) return;
        
        let html = '';
        let currentAtrasadoGroup = null;
        let currentHoyGroup = null;
        
        const hoyStr = new Date().toISOString().split('T')[0];
        
        cola.forEach(item => {
            const isAtrasado = item.fecha_programada < hoyStr;
            const diffTime = Math.abs(new Date(hoyStr) - new Date(item.fecha_programada));
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (isAtrasado && currentAtrasadoGroup !== item.fecha_programada) {
                html += `<h3 style="color: #d90429; font-size: 16px; margin-top: 8px;">🟥 ATRASADO desde ${item.fecha_programada} (${diffDays} días atrás)</h3>`;
                currentAtrasadoGroup = item.fecha_programada;
            } else if (!isAtrasado && currentHoyGroup !== item.fecha_programada) {
                html += `<h3 style="color: #0077b6; font-size: 16px; margin-top: 8px;">🟦 HOY ${item.fecha_programada}</h3>`;
                currentHoyGroup = item.fecha_programada;
            }
            
            html += `
                <div class="card" style="padding: 16px; display: flex; flex-direction: column; gap: 8px;">
                    <div style="font-weight: 700; font-size: 18px;">📘 ${item.titulo || item.oa_titulo || item.oa_codigo}</div>
                    <div style="font-size: 12px; color: var(--text-muted);">${item.oa_codigo} · ${item.oa_titulo || ''}</div>
                    <div style="font-size: 14px; color: var(--text-muted);">Páginas ${item.paginas_libro || 'N/A'} · ${item.duracion_estimada || 20} min</div>
                    <div style="display: flex; gap: 8px; margin-top: 8px;">
                        <button class="btn-activity-submit" onclick="Fase1API.empezarMision('${item.id}', '${item.oa_codigo}')" style="flex: 1; padding: 10px; font-size: 14px; border: none; border-radius: 8px; background: #2ecc71; color: white; font-weight: bold; cursor: pointer;">▶ Empezar misión</button>
                        <button class="btn-canvas" onclick="Fase1API.verMaterial('${item.oa_codigo}')" style="flex: 1; padding: 10px; font-size: 14px; border: none; border-radius: 8px; background: #3498db; color: white; font-weight: bold; cursor: pointer;">📺 Material de apoyo</button>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    },
    
    async renderStats() {
        const { data: resumen, error: e1 } = await supabaseClient
            .from('vista_panel_padres')
            .select('*')
            .eq('user_id', USER_ID);
            
        const containerAvance = document.getElementById('stats-avance-container');
        if (containerAvance && resumen) {
            let html = '';
            let totalConsolidados = 0;
            const asignaturas = {};
            
            resumen.forEach(row => {
                if (!asignaturas[row.asignatura]) asignaturas[row.asignatura] = { total: 0, consolidados: 0 };
                asignaturas[row.asignatura].total++;
                if (row.estado === 'consolidado') {
                    asignaturas[row.asignatura].consolidados++;
                    totalConsolidados++;
                }
            });
            
            for (let asig in asignaturas) {
                const asigData = asignaturas[asig];
                const pct = asigData.total > 0 ? Math.round((asigData.consolidados / asigData.total) * 100) : 0;
                let bars = '';
                for(let i=0; i<5; i++) {
                    bars += i < Math.round(pct/20) ? '▓' : '░';
                }
                html += `
                    <div style="display: flex; justify-content: space-between; font-size: 14px;">
                        <span>${asig}</span>
                        <span style="font-family: monospace;">${asigData.consolidados}/${asigData.total} OAs ${bars}</span>
                    </div>
                `;
            }
            
            html += `<hr style="margin: 8px 0; border: 0; border-top: 1px solid var(--border-color);"><div style="font-weight: 700;">TOTAL: ${totalConsolidados}/27 consolidados</div>`;
            containerAvance.innerHTML = html;
        }
        
        const { data: examen, error: e2 } = await supabaseClient
            .from('vista_resumen_examen')
            .select('*')
            .limit(1)
            .single();
            
        const containerCrono = document.getElementById('stats-cronometro-container');
        if (containerCrono && examen) {
            containerCrono.innerHTML = `
                <div style="font-size: 14px; font-weight: 600;">Faltan ${examen.semanas} sem y ${examen.dias_extra} días</div>
                <div style="font-size: 14px; color: var(--text-muted); margin-top: 4px;">📅 ${examen.fecha_examen}</div>
                <div style="font-size: 12px; color: var(--text-muted);">Validación MINEDUC</div>
            `;
        }
    },
    
    async empezarMision(planId, oaCodigo) {
        const { data, error } = await supabaseClient
            .from('sesiones')
            .insert({ user_id: USER_ID, oa_codigo: oaCodigo, plan_id: planId })
            .select()
            .single();

        if (error || !data) {
            console.error('Error al crear sesion:', error);
            alert('No pude iniciar la mision. Detalle: ' + (error && error.message ? error.message : 'desconocido'));
            return;
        }

        App.currentSesionId = data.id;
        App.currentPlanId = planId;
        App.currentOACodigo = oaCodigo;  // crítico para que Fase 2 cargue preguntas dinámicas

        let subject = 'lenguaje';
        if (oaCodigo.startsWith('M')) subject = 'matematica';
        else if (oaCodigo.startsWith('C')) subject = 'ciencias';
        else if (oaCodigo.startsWith('H')) subject = 'historia';

        App.startSubjectLessons(subject);
    },
    
    async verMaterial(oaCodigo) {
        const { data, error } = await supabaseClient
            .from('recursos_complementarios')
            .select('*')
            .eq('oa_codigo', oaCodigo)
            .eq('activo', true)
            .order('prioridad', { ascending: false });
            
        if (error || !data || data.length === 0) {
            alert('No hay material de apoyo para este OA.');
            return;
        }
        
        let html = '<div style="padding: 20px; text-align: left;"><h2 style="margin-bottom: 16px;">Material de Apoyo</h2>';
        data.forEach(rec => {
            html += `<a href="${rec.url}" target="_blank" style="display: block; margin-bottom: 8px; color: var(--color-matematica); font-weight: 600;">${rec.tipo === 'video' ? '📺' : '🎮'} ${rec.titulo}</a>`;
        });
        html += '<button class="btn-canvas" onclick="document.getElementById(\'material-popup\').remove()" style="margin-top: 16px;">Cerrar</button></div>';
        
        const popup = document.createElement('div');
        popup.id = 'material-popup';
        popup.style.position = 'fixed';
        popup.style.top = '50%';
        popup.style.left = '50%';
        popup.style.transform = 'translate(-50%, -50%)';
        popup.style.background = 'white';
        popup.style.boxShadow = '0 10px 25px rgba(0,0,0,0.5)';
        popup.style.zIndex = '9999';
        popup.style.borderRadius = '16px';
        popup.style.minWidth = '300px';
        popup.innerHTML = html;
        document.body.appendChild(popup);
    }
};

// 📝 SISTEMA DE TESTS / SIMULACRO MINEDUC + diagnóstico de qué repasar
const SimulacroSystem = {
    preguntas: [],
    idx: 0,
    correctas: 0,
    tiempoRestante: 0,    // segundos
    timerId: null,
    modo: 'simulacro',    // 'simulacro' (20, 90min) o 'test' (por asignatura)
    resultadosPorOA: {},  // { 'M-OA9': {c:2,t:3}, ... }
    titulo: 'SIMULACRO MINEDUC',

    // Test de examen completo (20 preguntas, 90 min)
    async iniciar() {
        await this._cargar('generar_simulacro', { p_limit: 20 }, 'simulacro', 90 * 60, '📝 SIMULACRO MINEDUC');
    },

    // Test por asignatura (8 preguntas, sin cuenta regresiva) para identificar qué repasar
    async iniciarTest(asignatura) {
        const labels = { lenguaje: '📖 Test de Lenguaje', matematica: '🔢 Test de Matemática', ciencias: '🧪 Test de Ciencias', historia: '🗺️ Test de Historia' };
        await this._cargar('generar_test', { p_asignatura: asignatura, p_limit: 8 }, 'test', 0, labels[asignatura] || '📝 Test');
    },

    async _cargar(rpc, params, modo, segundos, titulo) {
        if (typeof supabaseClient === 'undefined') { alert('Necesitas conexión.'); return; }
        const { data, error } = await supabaseClient.rpc(rpc, params);
        if (error || !data || data.length === 0) {
            console.error('Error test:', error);
            alert('No pude cargar el test. Revisa la conexión.');
            return;
        }
        this.preguntas = data;
        this.idx = 0;
        this.correctas = 0;
        this.resultadosPorOA = {};
        this.modo = modo;
        this.titulo = titulo;
        this.tiempoRestante = segundos;
        if (segundos > 0) this.iniciarTimer();
        this.render();
    },

    iniciarTimer() {
        this.detenerTimer();
        this.timerId = setInterval(() => {
            this.tiempoRestante--;
            this.pintarTimer();
            if (this.tiempoRestante <= 0) {
                this.detenerTimer();
                alert('⏰ ¡Se acabó el tiempo! (90 minutos, como en el examen real)');
                this.resultado();
            }
        }, 1000);
    },

    detenerTimer() {
        if (this.timerId) { clearInterval(this.timerId); this.timerId = null; }
    },

    pintarTimer() {
        const el = document.getElementById('sim-timer');
        if (!el) return;
        const m = Math.floor(this.tiempoRestante / 60);
        const s = this.tiempoRestante % 60;
        el.innerText = '⏱ ' + m + ':' + (s < 10 ? '0' : '') + s;
        el.style.color = this.tiempoRestante < 300 ? '#ef4444' : '#64748b'; // rojo en últimos 5 min
    },

    cerrar() {
        this.detenerTimer();
        const ov = document.getElementById('simulacro-overlay');
        if (ov) ov.remove();
    },

    render() {
        this.cerrar();
        const total = this.preguntas.length;
        const q = this.preguntas[this.idx];
        const opciones = Array.isArray(q.opciones) ? q.opciones : (q.options || []);

        let opcionesHtml = '';
        opciones.forEach((op, i) => {
            opcionesHtml += `<button class="sim-opt" data-i="${i}" data-correct="${op.correct === true}"
                style="display:block; width:100%; text-align:left; margin:8px 0; padding:14px; font-size:17px;
                border:2px solid #cbd5e1; border-radius:12px; background:white; cursor:pointer;">
                ${op.text}</button>`;
        });

        const ov = document.createElement('div');
        ov.id = 'simulacro-overlay';
        ov.style = 'position:fixed; inset:0; z-index:10000; background:rgba(15,23,42,0.92); display:flex; align-items:center; justify-content:center; padding:16px; overflow-y:auto;';
        ov.innerHTML = `
            <div style="background:white; border-radius:18px; max-width:560px; width:100%; padding:22px; box-shadow:0 12px 40px rgba(0,0,0,0.5);">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                    <strong style="color:#3b82f6; font-size:14px;">${this.titulo}</strong>
                    <span id="sim-timer" style="font-size:14px; font-weight:700; color:#64748b;">${this.modo === 'simulacro' ? '⏱ 90:00' : ''}</span>
                </div>
                <div style="text-align:right; font-size:12px; color:#94a3b8; margin-bottom:4px;">Pregunta ${this.idx + 1} de ${total}</div>
                <div style="height:8px; background:#e2e8f0; border-radius:4px; margin-bottom:16px; overflow:hidden;">
                    <div style="height:100%; width:${Math.round((this.idx / total) * 100)}%; background:#3b82f6;"></div>
                </div>
                <div style="font-size:20px; font-weight:700; color:#1e293b; margin-bottom:16px;">${q.pregunta}</div>
                <div id="sim-opts">${opcionesHtml}</div>
                <div id="sim-feedback" style="margin-top:12px; font-size:15px; min-height:24px;"></div>
                <button id="sim-cancel" style="margin-top:14px; background:none; border:none; color:#94a3b8; font-size:13px; cursor:pointer;">Salir del simulacro</button>
            </div>`;
        document.body.appendChild(ov);

        ov.querySelectorAll('.sim-opt').forEach(btn => {
            btn.onclick = () => this.responder(btn, q);
        });
        document.getElementById('sim-cancel').onclick = () => this.cerrar();
    },

    responder(btn, q) {
        const esCorrecta = btn.getAttribute('data-correct') === 'true';
        const fb = document.getElementById('sim-feedback');
        // Registrar resultado por OA (para saber qué repasar)
        const oa = q.oa_codigo || 'desconocido';
        if (!this.resultadosPorOA[oa]) this.resultadosPorOA[oa] = { c: 0, t: 0 };
        this.resultadosPorOA[oa].t++;
        if (esCorrecta) this.resultadosPorOA[oa].c++;
        // Bloquear todos los botones
        document.querySelectorAll('.sim-opt').forEach(b => {
            b.onclick = null;
            const correcta = b.getAttribute('data-correct') === 'true';
            if (correcta) b.style.borderColor = '#16a34a', b.style.background = '#dcfce7';
        });
        if (esCorrecta) {
            this.correctas++;
            if (typeof SoundManager !== 'undefined') SoundManager.play('success');
            fb.innerHTML = '<span style="color:#16a34a; font-weight:700;">✅ ¡Correcto!</span> ' + (q.explicacion || '');
        } else {
            btn.style.borderColor = '#ef4444';
            btn.style.background = '#fee2e2';
            if (typeof SoundManager !== 'undefined') SoundManager.play('wrong');
            fb.innerHTML = '<span style="color:#ef4444; font-weight:700;">❌ Casi.</span> ' + (q.explicacion || '');
        }
        // Botón siguiente
        const next = document.createElement('button');
        next.innerText = (this.idx + 1 < this.preguntas.length) ? 'Siguiente ▶' : 'Ver resultado 🏁';
        next.style = 'margin-top:14px; width:100%; padding:14px; font-size:17px; font-weight:bold; border:none; border-radius:12px; background:#3b82f6; color:white; cursor:pointer;';
        next.onclick = () => {
            this.idx++;
            if (this.idx < this.preguntas.length) this.render();
            else this.resultado();
        };
        fb.appendChild(document.createElement('br'));
        fb.appendChild(next);
    },

    resultado() {
        this.cerrar();
        const total = this.preguntas.length;
        const pct = Math.round((this.correctas / total) * 100);
        let msg, color;
        if (pct >= 80) { msg = '¡Excelente! Muy preparado 🌟'; color = '#16a34a'; }
        else if (pct >= 60) { msg = 'Bien, pero conviene reforzar algunos temas 💪'; color = '#f59e0b'; }
        else { msg = 'Hay que practicar más. ¡A repasar! 📚'; color = '#ef4444'; }

        // Calcular qué OAs repasar (los que salieron < 60% en este test) y registrar en BD
        const titulosOA = {};
        this.preguntas.forEach(q => { if (q.oa_codigo) titulosOA[q.oa_codigo] = q.oa_codigo; });
        const repasar = [];
        Object.keys(this.resultadosPorOA).forEach(oa => {
            const r = this.resultadosPorOA[oa];
            const poa = Math.round((r.c / r.t) * 100);
            // Registrar resultado por OA (alimenta áreas débiles y retención)
            if (oa !== 'desconocido' && typeof USER_ID !== 'undefined') {
                try {
                    supabaseClient.rpc('registrar_resultado_oa', {
                        p_user: USER_ID, p_oa: oa, p_correctas: r.c, p_total: r.t
                    });
                } catch (e) { console.warn('No se registró OA', oa, e); }
            }
            if (poa < 60) repasar.push({ oa, pct: poa, c: r.c, t: r.t });
        });

        let repasarHtml = '';
        if (repasar.length === 0) {
            repasarHtml = '<div style="background:#dcfce7; color:#166534; padding:12px; border-radius:10px; font-size:14px; margin-top:12px;">🎉 ¡No hay temas flojos en este test!</div>';
        } else {
            repasarHtml = '<div style="margin-top:16px; text-align:left;"><div style="font-weight:700; color:#dc2626; margin-bottom:8px;">📚 Temas para repasar:</div>';
            repasar.forEach(item => {
                repasarHtml += `
                    <div style="display:flex; justify-content:space-between; align-items:center; background:#fef2f2; border:1px solid #fecaca; border-radius:8px; padding:10px; margin-bottom:6px;">
                        <span style="font-size:13px; color:#7f1d1d;">${item.oa} (${item.c}/${item.t})</span>
                        <button onclick="document.getElementById('simulacro-overlay').remove(); Fase1API.verMaterial('${item.oa}');"
                            style="font-size:12px; background:#3b82f6; color:white; border:none; padding:6px 10px; border-radius:6px; cursor:pointer; white-space:nowrap;">📺 Ver material</button>
                    </div>`;
            });
            repasarHtml += '</div>';
        }

        const reiniciar = this.modo === 'simulacro'
            ? 'SimulacroSystem.iniciar()'
            : `SimulacroSystem.iniciarTest('${this.preguntas[0] && this.preguntas[0].oa_codigo ? this.preguntas[0].oa_codigo.charAt(0) : ''}')`;

        const ov = document.createElement('div');
        ov.id = 'simulacro-overlay';
        ov.style = 'position:fixed; inset:0; z-index:10000; background:rgba(15,23,42,0.92); display:flex; align-items:center; justify-content:center; padding:16px; overflow-y:auto;';
        ov.innerHTML = `
            <div style="background:white; border-radius:18px; max-width:480px; width:100%; padding:24px; text-align:center; box-shadow:0 12px 40px rgba(0,0,0,0.5); margin:16px 0;">
                <div style="font-size:48px;">🏁</div>
                <h2 style="margin:6px 0; color:#1e293b;">Resultado</h2>
                <div style="font-size:42px; font-weight:800; color:${color};">${this.correctas}/${total}</div>
                <div style="font-size:20px; color:${color}; margin-bottom:8px;">${pct}%</div>
                <p style="color:#475569; font-size:15px;">${msg}</p>
                ${repasarHtml}
                <button onclick="SimulacroSystem.cerrar()" style="margin-top:16px; padding:12px 28px; font-size:16px; font-weight:bold; border:none; border-radius:12px; background:#3b82f6; color:white; cursor:pointer;">Cerrar</button>
            </div>`;
        document.body.appendChild(ov);
    }
};

// 🎵 GESTOR DE EFECTOS DE SONIDO SINTÉTICOS (NATIVO - WEB AUDIO API)
const SoundManager = {
    audioCtx: null,

    init() {
        // Inicializar el contexto en la primera interacción
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    },

    play(type) {
        if (!this.audioCtx) {
            try { this.init(); } catch (e) { return; }
        }
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }

        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        const now = this.audioCtx.currentTime;

        if (type === 'click') {
            // Un blip robótico corto y agudo
            osc.type = 'sine';
            osc.frequency.setValueAtTime(800, now);
            osc.frequency.exponentialRampToValueAtTime(1200, now + 0.08);
            gain.gain.setValueAtTime(0.15, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
            osc.start(now);
            osc.stop(now + 0.08);
        } 
        else if (type === 'success') {
            // Acorde alegre y ascendente
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(523.25, now); // C5 (Do)
            osc.frequency.setValueAtTime(659.25, now + 0.1); // E5 (Mi)
            osc.frequency.setValueAtTime(783.99, now + 0.2); // G5 (Sol)
            osc.frequency.exponentialRampToValueAtTime(1046.50, now + 0.35); // C6 (Do alto)
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
            osc.start(now);
            osc.stop(now + 0.45);
        } 
        else if (type === 'wrong') {
            // Zumbido grave doble
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(180, now);
            osc.frequency.linearRampToValueAtTime(120, now + 0.15);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
            osc.start(now);
            osc.stop(now + 0.2);
        }
        else if (type === 'phone-ring') {
            // Sonido de llamada robótica oscilante
            osc.type = 'sine';
            osc.frequency.setValueAtTime(440, now);
            osc.frequency.setValueAtTime(480, now + 0.1);
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.5);
            osc.start(now);
            osc.stop(now + 0.5);
        }
        else if (type === 'delight') {
            // Sonido de campanillas y silbido de agrado robótico alegre
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(600, now);
            osc.frequency.exponentialRampToValueAtTime(900, now + 0.1);
            osc.frequency.setValueAtTime(1200, now + 0.15);
            osc.frequency.exponentialRampToValueAtTime(1600, now + 0.3);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
            osc.start(now);
            osc.stop(now + 0.4);
        }
    }
};

// 🎙️ SÍNTESIS DE VOZ DE ELIUBOT (TEXT-TO-SPEECH)
const VoiceEngine = {
    synth: window.speechSynthesis,
    activeUtterance: null,
    activeAudio: null,
    speakId: 0,

    speak(text, onEndCallback) {
        this.stop();
        
        this.speakId++;
        const currentSpeakId = this.speakId;

        // Cargar velocidad de habla y volumen unificado
        const savedSpeed = localStorage.getItem('eliu_aprende_velocidad_voz');
        const rate = savedSpeed ? parseFloat(savedSpeed) : 0.75;
        
        const savedVol = localStorage.getItem('eliu_aprende_volumen_voz');
        const volume = savedVol !== null ? parseFloat(savedVol) : 1.0;

        // Cargar credenciales ElevenLabs
        const apiKey = localStorage.getItem('eliu_aprende_eleven_key');
        const voiceId = localStorage.getItem('eliu_aprende_eleven_id');

        const robotHeads = document.querySelectorAll('.robot-head, .talking-head');
        const silenceBtn = document.getElementById('btn-silence-global');

        // Mostrar botón de silencio flotante
        if (silenceBtn) silenceBtn.style.display = 'flex';

        const startVisualTalking = () => {
            robotHeads.forEach(head => head.classList.add('talking'));
        };

        const stopVisualTalking = () => {
            robotHeads.forEach(head => head.classList.remove('talking'));
            if (silenceBtn) silenceBtn.style.display = 'none';
        };

        if (apiKey && voiceId) {
            // --- MODO ELEVENLABS REALISTA ---
            startVisualTalking();

            const cleanedText = text.replace(/[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD00-\uDFFF]/g, "");

            fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
                method: 'POST',
                headers: {
                    'xi-api-key': apiKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    text: cleanedText,
                    model_id: 'eleven_multilingual_v2',
                    voice_settings: {
                        stability: 0.6,
                        similarity_boost: 0.75,
                        style: 0.0,
                        use_speaker_boost: true
                    }
                })
            })
            .then(res => {
                if (currentSpeakId !== this.speakId) throw new Error("Cancelled speak");
                if (!res.ok) throw new Error("ElevenLabs API Error");
                return res.blob();
            })
            .then(blob => {
                if (currentSpeakId !== this.speakId) return;
                const url = URL.createObjectURL(blob);
                this.activeAudio = new Audio(url);
                
                // Sincronizar volumen y velocidad de audio
                this.activeAudio.volume = volume;
                this.activeAudio.playbackRate = rate;

                this.activeAudio.onended = () => {
                    if (currentSpeakId !== this.speakId) return;
                    stopVisualTalking();
                    if (onEndCallback) onEndCallback();
                };

                this.activeAudio.onerror = () => {
                    if (currentSpeakId !== this.speakId) return;
                    stopVisualTalking();
                    if (onEndCallback) onEndCallback();
                };

                this.activeAudio.play().catch(() => {
                    stopVisualTalking();
                    if (onEndCallback) onEndCallback();
                });
            })
            .catch(err => {
                if (currentSpeakId !== this.speakId) return;
                console.error("ElevenLabs Fallback:", err);
                // Caer graciosamente al modo Nativo si hay error o falta de red
                this.speakNative(text, rate, volume, startVisualTalking, stopVisualTalking, onEndCallback, currentSpeakId);
            });
        } else {
            // --- MODO NATIVO INFANTIL ---
            this.speakNative(text, rate, volume, startVisualTalking, stopVisualTalking, onEndCallback, currentSpeakId);
        }
    },

    speakNative(text, rate, volume, startVisual, stopVisual, onEndCallback, currentSpeakId) {
        if (currentSpeakId !== undefined && currentSpeakId !== this.speakId) return;
        if (!this.synth) return;
        startVisual();

        const cleanedText = text.replace(/[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD00-\uDFFF]/g, "");

        this.activeUtterance = new SpeechSynthesisUtterance(cleanedText);
        
        // 🌟 SELECCIÓN DE VOZ INTELIGENTE DE NIÑO/FEMENINA EN ESPAÑOL
        const voices = this.synth.getVoices();
        
        const savedVoiceName = localStorage.getItem('eliu_aprende_voz_sistema');
        let selectedVoice = null;
        if (savedVoiceName) {
            selectedVoice = voices.find(v => v.name === savedVoiceName);
        }

        if (!selectedVoice) {
            // Priorizar la voz de Google en español ("la voz de Gemini") por sobre todo
            selectedVoice = voices.find(v => v.lang.startsWith('es') && v.name.includes('Google')) ||
                            voices.find(v => v.lang.startsWith('es') && v.name.includes('Natural')) ||
                            voices.find(v => v.lang === 'es-CL' && v.name.includes('Sabina')) ||
                            voices.find(v => v.lang.startsWith('es') && (v.name.includes('Sabina') || v.name.includes('Daria') || v.name.includes('Helena') || v.name.includes('Zira') || v.name.includes('Microsoft Sabina') || v.name.includes('Microsoft Helena') || v.name.includes('Microsoft Daria') || v.name.includes('Microsoft Laura'))) ||
                            voices.find(v => v.lang === 'es-CL') ||
                            voices.find(v => v.lang.startsWith('es') && v.gender === 'female') ||
                            voices.find(v => v.lang.startsWith('es')) ||
                            voices.find(v => v.default);
        }
        
        if (selectedVoice) {
            this.activeUtterance.voice = selectedVoice;
            this.activeUtterance.lang = selectedVoice.lang;
        } else {
            this.activeUtterance.lang = 'es-CL';
        }

        // Tono extra dulce e infantil
        this.activeUtterance.pitch = 1.45; 
        this.activeUtterance.rate = rate - 0.1 > 0.1 ? rate - 0.1 : 0.1; // Extra pausado para fónica
        this.activeUtterance.volume = volume;

        this.activeUtterance.onboundary = (event) => {
            if (event.name === 'word') {
                const charIndex = event.charIndex;
                if (typeof ReadingManager !== 'undefined' && ReadingManager.active) {
                    ReadingManager.highlightWordByCharIndex(charIndex);
                }
            }
        };

        this.activeUtterance.onend = () => {
            if (currentSpeakId !== undefined && currentSpeakId !== this.speakId) return;
            stopVisual();
            if (onEndCallback) onEndCallback();
        };

        this.activeUtterance.onerror = () => {
            if (currentSpeakId !== undefined && currentSpeakId !== this.speakId) return;
            stopVisual();
            if (onEndCallback) onEndCallback();
        };

        this.synth.speak(this.activeUtterance);
    },

    stop() {
        this.speakId++; // Invalida cualquier callback pendiente de inmediato al detener
        if (this.activeUtterance) {
            this.activeUtterance.onend = null;
            this.activeUtterance.onerror = null;
            this.activeUtterance = null;
        }
        if (this.synth) {
            this.synth.cancel();
        }
        if (this.activeAudio) {
            this.activeAudio.onended = null;
            this.activeAudio.onerror = null;
            this.activeAudio.pause();
            this.activeAudio = null;
        }
        const robotHeads = document.querySelectorAll('.robot-head, .talking-head');
        robotHeads.forEach(head => head.classList.remove('talking'));
        
        const silenceBtn = document.getElementById('btn-silence-global');
        if (silenceBtn) silenceBtn.style.display = 'none';
    }
};

// 🎙️ RECONOCIMIENTO DE VOZ E INTERACTIVIDAD DE DUDAS
const SpeechRecognitionEngine = {
    recognition: null,
    active: false,
    listenId: 0,
    
    init() {
        const Speech = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!Speech) return;
        this.recognition = new Speech();
        this.recognition.lang = 'es-CL';
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
    },
    
    listen(onResult, onEnd) {
        if (!this.recognition) {
            this.init();
        }
        if (!this.recognition) return;
        
        this.listenId++;
        const currentListenId = this.listenId;
        
        let hasResult = false;
        this.active = true;
        this.recognition.onresult = (event) => {
            if (currentListenId !== this.listenId) return;
            const text = event.results[0][0].transcript;
            hasResult = true;
            onResult(text);
        };
        this.recognition.onend = () => {
            if (currentListenId !== this.listenId) return;
            this.active = false;
            if (onEnd && !hasResult) onEnd();
        };
        this.recognition.onerror = () => {
            if (currentListenId !== this.listenId) return;
            this.active = false;
            if (onEnd && !hasResult) onEnd();
        };
        
        try {
            this.recognition.start();
        } catch(e) {}
    },
    
    stop() {
        this.listenId++; // Invalida cualquier callback pendiente de inmediato
        if (this.recognition && this.active) {
            try {
                this.recognition.stop();
            } catch(e) {}
        }
        this.active = false;
    }
};

// 🎙️ NUEVO MOTOR DE GRABACIÓN DE AUDIO (MEDIARECORDER HTML5 PARA GEMINI MULTIMODAL)
const AudioRecordingEngine = {
    mediaRecorder: null,
    audioChunks: [],
    isRecording: false,
    stream: null,

    async start(onStart, onError) {
        if (this.isRecording) return;
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            // Elegir el tipo de archivo soportado
            let options = {};
            if (MediaRecorder.isTypeSupported('audio/webm')) {
                options = { mimeType: 'audio/webm' };
            } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
                options = { mimeType: 'audio/mp4' };
            } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
                options = { mimeType: 'audio/ogg' };
            }
            
            this.mediaRecorder = new MediaRecorder(this.stream, options);
            this.audioChunks = [];

            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                }
            };

            this.mediaRecorder.start();
            this.isRecording = true;
            if (onStart) onStart();
        } catch (err) {
            console.error("AudioRecordingEngine Error:", err);
            this.isRecording = false;
            if (onError) onError(err);
        }
    },

    stop(onSuccess) {
        if (!this.isRecording || !this.mediaRecorder) return;
        
        this.mediaRecorder.onstop = () => {
            const mimeType = this.mediaRecorder.mimeType || 'audio/webm';
            const audioBlob = new Blob(this.audioChunks, { type: mimeType });
            
            const reader = new FileReader();
            reader.readAsDataURL(audioBlob);
            reader.onloadend = () => {
                const base64DataUrl = reader.result;
                const base64Data = base64DataUrl.split(',')[1];
                if (onSuccess) onSuccess(base64Data, mimeType);
            };

            // Liberar micrófono
            if (this.stream) {
                this.stream.getTracks().forEach(track => track.stop());
                this.stream = null;
            }
        };

        this.mediaRecorder.stop();
        this.isRecording = false;
    },

    cancel() {
        if (!this.isRecording || !this.mediaRecorder) return;
        this.mediaRecorder.onstop = null;
        this.mediaRecorder.stop();
        this.isRecording = false;
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
    }
};

// 📖 TALLER DE LECTURA ACTIVA CON ELIUBOT
const ReadingManager = {
    active: false,
    storyIndex: 0,
    words: [],
    spokenWordsIndex: 0,
    
    stories: [
        {
            title: "Tito el Robot y su Bloque Dorado",
            text: "Tito es un robot de bloques muy feliz. Él vive en un cohete celeste. Un día, ¡oh no! Tito perdió su tuerca dorada. La buscó en el espacio y la encontró bajo un bloque de Roblox. ¡Qué gran felicidad!",
            questions: [
                {
                    prompt: "¿Dónde vive el robot Tito?",
                    options: [
                        { text: "En una casa de madera", correct: false },
                        { text: "En un cohete celeste ¡Súper correcto!", correct: true },
                        { text: "Bajo un árbol de manzanas", correct: false }
                    ],
                    synonymsExplain: "¡Increíble Eliu! Tito vive en un cohete celeste de bloques, viajando por el espacio sideral."
                }
            ]
        },
        {
            title: "La Aventura de los Copihues",
            text: "En los bosques del sur de Chile nace una flor roja. Esta flor tiene forma de campana y se llama Copihue. El copihue es un símbolo patrio hermoso. ¡Mira cómo cuelga de las ramas verdes bajo la lluvia!",
            questions: [
                {
                    prompt: "¿De qué color es la flor del Copihue?",
                    options: [
                        { text: "Amarilla brillante", correct: false },
                        { text: "Roja como el fuego ¡Eso es!", correct: true },
                        { text: "Azul como el mar", correct: false }
                    ],
                    synonymsExplain: "¡Genial, Eliu! El copihue es una hermosa flor roja endémica de los bosques templados de Chile."
                }
            ]
        }
    ],

    init() {
        const testBtn = document.getElementById('btn-start-reading-practice');
        if (testBtn) {
            testBtn.onclick = () => this.startReading();
        }
        
        const nextBtn = document.getElementById('btn-next-story-step');
        if (nextBtn) {
            nextBtn.onclick = () => this.startReadingComprehension();
        }
    },

    startReadingView() {
        this.active = true;
        this.slowReadingActive = false; // Detener cualquier lectura lenta previa
        this.storyIndex = Math.floor(Math.random() * this.stories.length);
        const story = this.stories[this.storyIndex];
        
        document.getElementById('reading-progress-label').innerText = `Cuento ${this.storyIndex + 1}`;
        
        // Formatear texto en spans
        const storyBox = document.getElementById('reading-story-box');
        if (storyBox) {
            const wordsList = story.text.split(" ");
            this.words = wordsList.map((w, idx) => {
                const cleanWord = w.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()¡!¿?]/g,"");
                return {
                    id: `rword_${idx}`,
                    originalText: w,
                    cleanText: cleanWord,
                    correct: false
                };
            });
            
            storyBox.innerHTML = this.words.map(w => {
                return `<span class="reading-word" id="${w.id}">${w.originalText}</span>`;
            }).join(" ");

            // Asignar click sobre palabras individuales para escucharlas despacio
            this.words.forEach(w => {
                const el = document.getElementById(w.id);
                if (el) {
                    el.addEventListener('click', (e) => {
                        e.stopPropagation();
                        SoundManager.play('click');
                        
                        // Quitar highlight anterior
                        document.querySelectorAll('.reading-word').forEach(x => x.classList.remove('word-highlight'));
                        el.classList.add('word-highlight');
                        
                        // Detener slow loop activo para no encimar
                        this.slowReadingActive = false;

                        VoiceEngine.speak(w.cleanText, () => {
                            setTimeout(() => el.classList.remove('word-highlight'), 1000);
                        });
                    });
                }
            });
        }

        // Resetear botones
        document.getElementById('btn-start-reading-practice').style.display = 'block';
        document.getElementById('btn-next-story-step').style.display = 'none';
        document.getElementById('reading-mic-indicator').style.display = 'none';
        
        const speechBubble = document.getElementById('reading-speech-bubble');
        speechBubble.innerText = `¡Hola Eliu! Primero yo leeré para ti. Fíjate en las palabras que se alumbran. ¡Luego te toca a ti con tu micrófono! 🤖`;
        
        App.showView('reading-view');
        
        setTimeout(() => {
            VoiceEngine.speak(speechBubble.innerText);
        }, 400);
    },

    startReading() {
        SoundManager.play('click');
        this.slowReadingActive = false; // Cortar lecturas anteriores
        
        const story = this.stories[this.storyIndex];
        document.getElementById('btn-start-reading-practice').style.display = 'none';
        
        // Quitar clases anteriores
        this.words.forEach(w => {
            const el = document.getElementById(w.id);
            if (el) el.className = 'reading-word';
        });

        // Detectar ritmo seleccionado
        const paceEl = document.querySelector('input[name="reading-pace"]:checked');
        const pace = paceEl ? paceEl.value : 'normal';

        if (pace === 'slow') {
            this.readSlowly();
        } else {
            // Eliubot lee el cuento corrido
            VoiceEngine.speak(story.text, () => {
                // Fin de la lectura guiada de Eliubot
                setTimeout(() => {
                    this.startChildReadingPhase();
                }, 1000);
            });
        }
    },

    slowReadingActive: false,
    async readSlowly() {
        this.slowReadingActive = true;
        const delay = 800; // pausa en milisegundos entre palabras

        for (let i = 0; i < this.words.length; i++) {
            if (!this.slowReadingActive || !this.active) break;
            
            const w = this.words[i];
            const el = document.getElementById(w.id);

            // Quitar highlights anteriores
            this.words.forEach(x => {
                const wel = document.getElementById(x.id);
                if (wel) wel.classList.remove('word-highlight');
            });

            if (el) {
                el.classList.add('word-highlight');
                el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }

            // Hablar palabra individual de forma asíncrona
            await new Promise(resolve => {
                VoiceEngine.speak(w.cleanText, resolve);
            });

            // Esperar el delay
            await new Promise(resolve => setTimeout(resolve, delay));
        }

        // Quitar highlight final
        this.words.forEach(x => {
            const wel = document.getElementById(x.id);
            if (wel) wel.classList.remove('word-highlight');
        });

        this.slowReadingActive = false;

        // Pasar a fase activa del niño
        if (this.active) {
            setTimeout(() => {
                this.startChildReadingPhase();
            }, 1000);
        }
    },

    highlightWordByCharIndex(charIndex) {
        const story = this.stories[this.storyIndex];
        
        let currentLen = 0;
        const wordsList = story.text.split(" ");
        let wordIdx = -1;
        
        for (let i = 0; i < wordsList.length; i++) {
            const w = wordsList[i];
            if (charIndex >= currentLen && charIndex <= currentLen + w.length + 1) {
                wordIdx = i;
                break;
            }
            currentLen += w.length + 1; // +1 por el espacio
        }
        
        if (wordIdx !== -1) {
            this.words.forEach(w => {
                const el = document.getElementById(w.id);
                if (el) el.classList.remove('word-highlight');
            });
            
            const el = document.getElementById(`rword_${wordIdx}`);
            if (el) {
                el.classList.add('word-highlight');
                el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }
    },

    startChildReadingPhase() {
        this.words.forEach(w => {
            const el = document.getElementById(w.id);
            if (el) el.classList.remove('word-highlight');
        });

        const bubble = document.getElementById('reading-speech-bubble');
        bubble.innerText = `¡Es tu turno, Eliu! Presiona el micrófono y lee el cuento despacio en voz alta. Las palabras leídas se pintarán de verde. 🎙️`;
        
        VoiceEngine.speak(bubble.innerText, () => {
            document.getElementById('reading-mic-indicator').style.display = 'flex';
            this.spokenWordsIndex = 0;
            this.startVoiceRecognition();
        });
    },

    startVoiceRecognition() {
        if (SpeechRecognitionEngine.active) {
            SpeechRecognitionEngine.stop();
        }
        
        document.getElementById('reading-mic-status-text').innerText = "¡Eliubot te está escuchando con atención! Lee fuerte...";
        document.getElementById('reading-mic-glow').classList.add('listening');

        SpeechRecognitionEngine.listen(
            (transcript) => {
                this.evaluateReadingTranscript(transcript);
            },
            () => {
                if (this.active && this.spokenWordsIndex < this.words.length) {
                    setTimeout(() => {
                        if (this.active) this.startVoiceRecognition();
                    }, 500);
                }
            }
        );
    },

    evaluateReadingTranscript(transcript) {
        const spoken = transcript.toLowerCase().split(" ");
        let madeProgress = false;

        spoken.forEach(sWord => {
            for (let i = this.spokenWordsIndex; i < Math.min(this.spokenWordsIndex + 4, this.words.length); i++) {
                const target = this.words[i];
                if (!target.correct && (target.cleanText === sWord || sWord.includes(target.cleanText) || target.cleanText.includes(sWord))) {
                    target.correct = true;
                    const el = document.getElementById(target.id);
                    if (el) {
                        el.className = 'reading-word word-correct';
                    }
                    this.spokenWordsIndex = i + 1;
                    madeProgress = true;
                    SoundManager.play('click');
                    break;
                }
            }
        });

        if (!madeProgress && this.spokenWordsIndex < this.words.length) {
            const currentTarget = this.words[this.spokenWordsIndex];
            const el = document.getElementById(currentTarget.id);
            if (el && !el.classList.contains('word-correct')) {
                el.className = 'reading-word word-error';
                
                SpeechRecognitionEngine.stop();
                
                const spellText = currentTarget.cleanText.toUpperCase().split("").join("-");
                const tutorHelp = `¡Casi, Eliu! Esta palabra se lee: ${spellText}, ${currentTarget.originalText}. ¡Inténtalo conmigo!`;
                
                document.getElementById('reading-mic-status-text').innerText = `Eliubot te enseña: "${currentTarget.originalText}"`;
                document.getElementById('reading-mic-glow').classList.remove('listening');
                
                VoiceEngine.speak(tutorHelp, () => {
                    setTimeout(() => {
                        if (this.active) {
                            el.className = 'reading-word';
                            this.startVoiceRecognition();
                        }
                    }, 800);
                });
            }
        }

        const allCorrect = this.words.every(w => w.correct);
        if (allCorrect || this.spokenWordsIndex >= this.words.length) {
            this.active = false;
            SpeechRecognitionEngine.stop();
            document.getElementById('reading-mic-indicator').style.display = 'none';
            
            document.getElementById('btn-next-story-step').style.display = 'block';
            SoundManager.play('success');
            
            const congrat = Gamification.getRandomCongratulations();
            document.getElementById('reading-speech-bubble').innerText = congrat;
            VoiceEngine.speak(congrat);
        }
    },

    startReadingComprehension() {
        SoundManager.play('click');
        const story = this.stories[this.storyIndex];
        const question = story.questions[0];
        
        App.currentLesson = {
            id: `lectura_${this.storyIndex}`,
            title: "Comprensión del Cuento 📖",
            questions: [
                {
                    type: "multiple",
                    prompt: question.prompt,
                    options: question.options,
                    synonymsExplain: question.synonymsExplain
                }
            ]
        };
        App.currentQuestionIndex = 0;
        App.showView('activity-view');
        
        const activityView = document.getElementById('activity-view');
        activityView.style.setProperty('--activity-color', 'var(--color-diario)');
        activityView.style.setProperty('--activity-light', 'var(--color-diario-light)');

        document.getElementById('activity-title').innerText = "Comprensión Lectoras";
        document.getElementById('activity-progress-label').innerText = `Pregunta de Voz`;
        
        App.renderQuizQuestion();
        
        const originalComplete = App.completeLessonSuccess;
        App.completeLessonSuccess = () => {
            App.completeLessonSuccess = originalComplete;
            
            Gamification.completeDailyTask('diario');
            Gamification.awardStars(25);
            
            App.triggerConfetiExplosion();
            
            setTimeout(() => {
                App.showView('kids-dashboard-view');
            }, 1000);
        };
    }
};

// 🏆 SISTEMA DE GAMIFICACIÓN, RACHAS Y LOGROS ROBLOX
const Gamification = {
    stars: 0,
    racha: 0,
    dailyTasks: {
        lenguaje: false,
        matematica: false,
        ciencias: false,
        historia: false,
        diario: false
    },
    stickers: [
        { id: 'st_marshall_fire', emoji: '🐕‍🚒', label: 'Marshall Bombero', cost: 0, unlocked: true },
        { id: 'st_marshall_doc', emoji: '🚑', label: 'Marshall Doctor', cost: 15, unlocked: false },
        { id: 'st_chase_police', emoji: '🐕‍🦺', label: 'Chase Policía', cost: 30, unlocked: false },
        { id: 'st_skye_heli', emoji: '🚁', label: 'Skye Helicóptero', cost: 55, unlocked: false },
        { id: 'st_fire_truck', emoji: '🚒', label: 'Camión Bombero', cost: 80, unlocked: false },
        { id: 'st_medical_kit', emoji: '💼', label: 'Maletín Médico', cost: 100, unlocked: false },
        { id: 'st_golden_bone', emoji: '🦴', label: 'Hueso Dorado', cost: 120, unlocked: false }
    ],

    getRandomCongratulations() {
        const messages = [
            "¡Eres el mejor de todos, Eliu! ¡Sigue superándote! ⭐",
            "¡Eso fue espectacular! ¡Cada día aprendes más bloques de conocimiento! 🧱",
            "¡Qué gran mente tienes, Eliu! ¡Eres un súper campeón! 🏆",
            "¡Increíble, me dejas asombrado! ¡Tu cerebro de constructor de Roblox es gigante! 🎮",
            "¡Estupendo! ¡Estás listo para grandes aventuras, sigue así! 🚀",
            "¡Súper bien hecho, Eliu! ¡Eliubot está muy orgulloso de ti! 🤖",
            "¡Eso es, diste en el clavo! ¡Eres un genio total! 🤩",
            "¡Soberbio, Eliu! ¡Sigue construyendo tu camino al éxito! 🌈",
            "¡Wow, qué rapidez y precisión! ¡Eres un as de los números y letras! ⚡",
            "¡Súper Duper! ¡Has resuelto este bloque de conocimiento a la perfección! 🦄"
        ];
        return messages[Math.floor(Math.random() * messages.length)];
    },

    init() {
        // Cargar datos
        this.stars = parseInt(localStorage.getItem('eliu_aprende_estrellas')) || 0;
        this.racha = parseInt(localStorage.getItem('eliu_aprende_racha')) || 0;
        
        const unlocked = localStorage.getItem('eliu_aprende_stickers_desbloqueados');
        if (unlocked) {
            const list = JSON.parse(unlocked);
            this.stickers.forEach(st => {
                if (list.includes(st.id)) st.unlocked = true;
            });
        }

        // Chequear racha diaria al iniciar
        this.checkStreak();
        
        // Renders
        this.updateStatsUI();
        this.renderKidsDashboard();
        this.renderStickerPanel();
    },

    awardStars(qty) {
        this.stars += qty;
        localStorage.setItem('eliu_aprende_estrellas', this.stars);
        this.updateStatsUI();

        // Chequear desbloqueo de stickers
        this.stickers.forEach(st => {
            if (!st.unlocked && this.stars >= st.cost) {
                st.unlocked = true;
                this.saveUnlockedStickers();
                alert(`¡Increíble Eliu! Has ganado ${this.stars} estrellas y desbloqueaste un nuevo sticker: ${st.emoji} ${st.label}! 🦄`);
            }
        });
        
        this.renderStickerPanel();
    },

    saveUnlockedStickers() {
        const list = this.stickers.filter(s => s.unlocked).map(s => s.id);
        localStorage.setItem('eliu_aprende_stickers_desbloqueados', JSON.stringify(list));
    },

    updateStatsUI() {
        const starsLabel = document.getElementById('navbar-stars-val');
        const rachaLabel = document.getElementById('navbar-racha-val');
        if (starsLabel) starsLabel.innerText = this.stars;
        if (rachaLabel) rachaLabel.innerText = `${this.racha} d`;
    },

    checkStreak() {
        const lastActivityDate = localStorage.getItem('eliu_aprende_fecha_actividad');
        const todayStr = new Date().toISOString().split('T')[0];

        if (!lastActivityDate) {
            this.racha = 0;
        } else {
            const diffTime = Math.abs(new Date(todayStr) - new Date(lastActivityDate));
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays === 1) {
                // Siguiente día, no hacemos nada hasta que haga una tarea
            } else if (diffDays > 1) {
                // Racha rota
                this.racha = 0;
                localStorage.setItem('eliu_aprende_racha', 0);
            }
        }
        this.updateStatsUI();
    },

    completeDailyTask(taskType) {
        const todayStr = new Date().toISOString().split('T')[0];
        const lastActivityDate = localStorage.getItem('eliu_aprende_fecha_actividad');

        if (lastActivityDate !== todayStr) {
            // Primera actividad del día! Aumentar racha
            this.racha++;
            localStorage.setItem('eliu_aprende_racha', this.racha);
            localStorage.setItem('eliu_aprende_fecha_actividad', todayStr);
            this.updateStatsUI();
        }

        if (this.dailyTasks.hasOwnProperty(taskType)) {
            this.dailyTasks[taskType] = true;
        }
        this.renderKidsDashboard();
    },

    // RENDERIZAR TABLERO DEL NIÑO (MAPA E ISLAS Y RUTAS)
    renderKidsDashboard() {
        const container = document.getElementById('kids-dashboard-view');
        if (!container || container.style.display === 'none') return;

        // Calcular recomendaciones del libro basadas en páginas guardadas por padres
        const bookPages = ParentDashboard.getBookPages();
        
        // Obtener día de la semana (0: Domingo, 1: Lunes, etc.)
        const todayNum = new Date().getDay();

        // Obtener materias y misiones recomendadas hoy desde el Plan Semanal de Padres
        const plan = typeof ParentDashboard !== 'undefined' ? ParentDashboard.getWeeklyPlan() : [];
        const dayMap = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
        const todayName = dayMap[todayNum];
        const todayPlan = plan.find(day => day.day === todayName);
        const todaySubjects = todayPlan && todayPlan.tasks ? todayPlan.tasks.map(t => t.subject) : [];

        // Actualizar saludo dinámico e instructivo de Tito
        const titoBubble = document.getElementById('tito-speech-bubble');
        if (titoBubble) {
            if (todayPlan && todayPlan.tasks && todayPlan.tasks.length >= 2) {
                const task1 = todayPlan.tasks[0];
                const task2 = todayPlan.tasks[1];
                
                let pageText1 = "";
                if (task1.pageKey === "supermatematicos") pageText1 = ` (Pág. ${bookPages.supermatematicos})`;
                if (task1.pageKey === "jugandoSonidos") pageText1 = ` (Pág. ${bookPages.jugandoSonidos})`;
                if (task1.pageKey === "caligrafia") pageText1 = ` (Pág. ${bookPages.caligrafia})`;

                let pageText2 = "";
                if (task2.pageKey === "supermatematicos") pageText2 = ` (Pág. ${bookPages.supermatematicos})`;
                if (task2.pageKey === "jugandoSonidos") pageText2 = ` (Pág. ${bookPages.jugandoSonidos})`;
                if (task2.pageKey === "caligrafia") pageText2 = ` (Pág. ${bookPages.caligrafia})`;

                titoBubble.innerHTML = `¡Hola Eliu! Soy tu amigo Eliubot. Hoy es <strong>${todayName}</strong> y tenemos dos misiones súper especiales:<br>
                1️⃣ <strong>${task1.subjectName}</strong>: ${task1.book}${pageText1} - ${task1.goal}<br>
                2️⃣ <strong>${task2.subjectName}</strong>: ${task2.book}${pageText2} - ${task2.goal}<br>
                ¡A completar bloques de conocimiento! 🧱🚀`;
            } else {
                titoBubble.innerText = `¡Hola Eliu! Soy Eliubot. Hoy fin de semana es un excelente día para descansar o jugar en tu Mundo de Stickers de Roblox! 🦄`;
            }
        }

        // Limpiar clases antiguas y aplicar estado de completadas / activas
        const steps = ['lenguaje', 'matematica', 'ciencias', 'historia', 'diario'];
        steps.forEach(s => {
            const el = document.getElementById(`daily-step-${s}`);
            if (el) {
                el.classList.remove('done', 'active-mission');
                if (this.dailyTasks[s]) {
                    el.classList.add('done');
                } else if (todaySubjects.includes(s)) {
                    el.classList.add('active-mission'); // ¡Gatilla el neon de hoy!
                }
            }
        });

        // Actualizar los textos de recomendación de las tarjetas de islas
        document.getElementById('lbl-lenguaje-pág').innerText = `Jugando con los Sonidos: Pág. ${bookPages.jugandoSonidos} • Caligrafía: Pág. ${bookPages.caligrafia}`;
        document.getElementById('lbl-matematica-pág').innerText = `Supermatemáticos 1: Pág. ${bookPages.supermatematicos}`;
    },

    // RENDER ÁLBUM DE STICKERS EN NIÑO
    renderStickerPanel() {
        const grid = document.getElementById('stickers-selector-grid');
        if (!grid) return;

        grid.innerHTML = this.stickers.map(st => {
            if (st.unlocked) {
                return `
                    <div class="draggable-sticker" draggable="true" ondragstart="App.dragSticker(event)" data-id="${st.id}" data-emoji="${st.emoji}">
                        <span class="st-emoji">${st.emoji}</span>
                        <span class="st-lbl">${st.label}</span>
                    </div>
                `;
            } else {
                return `
                    <div class="draggable-sticker locked">
                        <span class="st-emoji">${st.emoji}</span>
                        <span class="st-lbl">Desbloquea con ${st.cost}⭐</span>
                        <span class="st-lock-icon">🔒</span>
                    </div>
                `;
            }
        }).join('');
    }
};

// 🗣️ PARSER DE RESPUESTAS CON TRANSCRIPCIÓN MULTIMODAL DE GEMINI
function parseGeminiAudioResponse(answer) {
    let childTranscript = "Audio de Eliu 🎙️";
    let botResponse = answer;
    
    // Match [Transcripción: ...] o [transcription: ...]
    const match = answer.match(/^\[Transcripción:\s*([^\]]+)\]/i) || 
                  answer.match(/^\[transcription:\s*([^\]]+)\]/i);
    if (match) {
        childTranscript = match[1].trim();
        botResponse = answer.replace(/^\[Transcripción:\s*[^\]]+\]/i, '')
                            .replace(/^\[transcription:\s*[^\]]+\]/i, '')
                            .trim();
    } else {
        botResponse = answer.replace(/\*/g, '').trim();
    }
    
    return { childTranscript, botResponse };
}

// 🎙️ PORTAL DE MICRÓFONO CONECTADO DIRECTO A GEMINI (DASHBOARD PRINCIPAL)
const DashboardMicSystem = {
    isRecording: false,
    chatHistory: [],

    init() {
        const dbMic = document.getElementById('btn-dashboard-mic');
        if (!dbMic) return;

        dbMic.onclick = () => {
            SoundManager.play('click');
            VoiceEngine.stop();

            if (this.isRecording) {
                this.stopRecording();
            } else {
                this.startRecording();
            }
        };
    },

    async startRecording() {
        const dbMic = document.getElementById('btn-dashboard-mic');
        const glow = document.getElementById('dashboard-mic-glow');
        const bubble = document.getElementById('tito-speech-bubble');
        const mascot = document.getElementById('kids-mascot-avatar');

        if (mascot) mascot.classList.add('talking');
        if (dbMic) dbMic.classList.add('recording');
        if (glow) glow.classList.add('listening');

        const listenText = "¡Eliubot te está escuchando! Habla fuerte y presiona mi micrófono de nuevo para enviarme tu pregunta... 🎙️";
        if (bubble) {
            bubble.innerText = listenText;
            bubble.style.display = 'block';
        }

        this.isRecording = true;
        this.currentTranscript = "";

        SpeechRecognitionEngine.listen(
            (text) => {
                this.currentTranscript = text;
            },
            () => {
                if (this.isRecording) {
                    this.stopRecording();
                }
            }
        );
    },

    stopRecording() {
        const dbMic = document.getElementById('btn-dashboard-mic');
        const glow = document.getElementById('dashboard-mic-glow');
        const bubble = document.getElementById('tito-speech-bubble');
        const mascot = document.getElementById('kids-mascot-avatar');

        if (dbMic) dbMic.classList.remove('recording');
        if (glow) glow.classList.remove('listening');
        if (mascot) mascot.classList.remove('talking');

        if (bubble) bubble.innerText = "Pensando... 🤖";

        SpeechRecognitionEngine.stop();
        this.isRecording = false;

        this.processAudio(this.currentTranscript || "Pregunta de voz");
    },

    async processAudio(childTranscript) {
        const bubble = document.getElementById('tito-speech-bubble');
        const mascot = document.getElementById('kids-mascot-avatar');

        try {
            const { data, error } = await supabaseClient.functions.invoke(
                'chat-eliubot', 
                {
                    body: {
                        mensaje: childTranscript,
                        historial: this.chatHistory ? this.chatHistory.slice(-6) : [],
                        contexto_oa: App.currentLesson?.oa_codigo || null
                    }
                }
            );
            
            if (error) throw error;
            
            if (data?.text) {
                if (bubble) {
                    bubble.innerText = data.text;
                    bubble.style.display = 'block';
                }
                if (mascot) mascot.classList.add('talking');
                VoiceEngine.speak(data.text, () => {
                    if (mascot) mascot.classList.remove('talking');
                });
                
                this.chatHistory = this.chatHistory || [];
                this.chatHistory.push({ role: "user", parts: [{ text: childTranscript }] });
                this.chatHistory.push({ role: "model", parts: [{ text: data.text }] });
                
                // Guardar log en el historial de los padres
                if (typeof ConversationsLogger !== 'undefined') {
                    ConversationsLogger.log("Conversación AI", childTranscript, data.text);
                }
            } else {
                VoiceEngine.speak("Eliubot está pensando, intenta otra vez en un momento.");
            }
        } catch (e) {
            console.error("Error llamando a Eliubot:", e);
            VoiceEngine.speak("No pude conectarme. Revisa el wifi.");
        }
    }
};

// 🎙️ SIMULACIÓN DE VIDEOLLAMADA AI Y REFLEXIÓN PEDAGÓGICA REDIRIGIDA A HOME (SIN FULLSCREEN OVERLAY)
const VideoCallSystem = {
    currentActivityName: '',

    triggerCall(activityName) {
        this.currentActivityName = activityName;
        
        // Detener voz activa
        VoiceEngine.stop();
        
        // Volver a la isla de inicio
        App.showView('kids-dashboard-view');
        
        // Configurar burbuja de Eliubot
        const bubble = document.getElementById('tito-speech-bubble');
        const reinforcementText = `¡Súper Eliu! Qué gran trabajo en tu misión de ${activityName}. 🧱🏆 Presiona mi micrófono mágico aquí abajo y cuéntame con tus palabras, ¿qué te gustó más de lo que aprendiste hoy?`;
        
        if (bubble) {
            bubble.innerText = reinforcementText;
            bubble.style.display = 'block';
        }

        // Animar el botón de micrófono en la pantalla principal para llamar su atención
        const glow = document.getElementById('dashboard-mic-glow');
        if (glow) {
            glow.classList.add('listening');
            setTimeout(() => {
                glow.classList.remove('listening');
            }, 6000);
        }

        // Narrar
        const mascot = document.getElementById('kids-mascot-avatar');
        if (mascot) mascot.classList.add('talking');
        
        VoiceEngine.speak(reinforcementText, () => {
            if (mascot) mascot.classList.remove('talking');
        });
    },

    triggerSandboxCall() {
        App.showView('kids-dashboard-view');
        const bubble = document.getElementById('tito-speech-bubble');
        const greeting = `¡Hola Eliu! Presiona mi micrófono de colores y pregúntame lo que quieras. ¡Marshall, Chase y yo estamos listos para conversar de valores, sumas o Roblox! 🤖🎙️`;
        
        if (bubble) {
            bubble.innerText = greeting;
            bubble.style.display = 'block';
        }

        VoiceEngine.speak(greeting);
    },

    endCall() {
        VoiceEngine.stop();
        App.showView('kids-dashboard-view');
    }
};

// 🎮 ORQUESTRADOR PRINCIPAL Y SPA ROUTER
const App = {
    currentLesson: null,
    currentQuestionIndex: 0,
    selectedOptionElement: null,

    init() {
        // Cargar Fase 1
        Fase1API.init();

        // Cargar e iniciar componentes
        Gamification.init();
        DiaryManager.init();
        ParentDashboard.init();

        // Enrutamiento Inicial: Dashboard infantil
        this.showView('kids-dashboard-view');

        // Configurar Eventos Generales de navegación
        document.getElementById('btn-to-diary').addEventListener('click', () => {
            DiaryManager.deactivateCaligrafiaMode();
            this.showView('diary-view');
        });
        document.getElementById('btn-to-stickers').addEventListener('click', () => this.showView('stickers-view'));
        
        // Inicializar Cofre de Recuerdos
        CofreManager.init();
        const toCofreBtn = document.getElementById('btn-to-cofre');
        if (toCofreBtn) {
            toCofreBtn.addEventListener('click', () => {
                this.showView('cofre-view');
                CofreManager.loadGems();
            });
        }
        
        // Botones Volver
        document.querySelectorAll('.btn-back-home').forEach(btn => {
            btn.addEventListener('click', () => this.showView('kids-dashboard-view'));
        });

        // Click en la Mascota para que hable en voz alta
        document.getElementById('kids-mascot-avatar').addEventListener('click', () => {
            const speechText = document.getElementById('tito-speech-bubble').innerText;
            VoiceEngine.speak(speechText);
            
            // Mostrar globo por unos segundos
            const bubble = document.getElementById('tito-speech-bubble');
            bubble.style.display = 'block';
            setTimeout(() => {
                bubble.style.display = 'none';
            }, 6000);
        });

        // Configurar Botón de Micrófono Mágico de Eliubot en el Dashboard
        DashboardMicSystem.init();

        // Configurar Botón de Micrófono de Videollamada (Interrupción Activa)
        const callMic = document.getElementById('btn-call-mic');
        if (callMic) {
            callMic.addEventListener('click', () => {
                SoundManager.play('click');
                
                // Detener el habla de Eliubot de inmediato
                VoiceEngine.stop();
                
                // Cancelar temporizadores del flujo guiado
                if (VideoCallSystem.guidedListenTimer) {
                    clearTimeout(VideoCallSystem.guidedListenTimer);
                    VideoCallSystem.guidedListenTimer = null;
                }
                
                if (VideoCallSystem.isSandboxCall) {
                    // Restablecer el contador de silencios
                    VideoCallSystem.silenceTimeoutCount = 0;
                    // Detener cualquier escucha previa
                    SpeechRecognitionEngine.stop();
                    // Activar el micrófono de inmediato
                    VideoCallSystem.listenSandboxLoop();
                } else {
                    // Flujo guiado: forzar fase de escucha
                    callMic.classList.add('listening');
                    document.getElementById('speech-overlay-text').innerText = "¡Eliubot te está escuchando con atención! Háblale fuerte a tu tablet... 🎙️";
                    
                    VideoCallSystem.guidedListenTimer = setTimeout(() => {
                        VideoCallSystem.respondAfterExplanation();
                    }, 6000);
                }
            });
        }

        // Configurar Isla de Lectura Activa
        ReadingManager.init();

        // Dudas por voz micrófono (Interrupción Activa)
        const doubtMic = document.getElementById('btn-doubt-mic');
        if (doubtMic) {
            doubtMic.onclick = () => {
                SoundManager.play('click');
                // Detener el habla de Eliubot de inmediato
                VoiceEngine.stop();
                // Detener cualquier escucha previa
                SpeechRecognitionEngine.stop();
                // Iniciar la escucha de de inmediato
                this.listenToVoiceDoubt();
            };
        }

        // Entrada a Zona de Padres
        document.getElementById('btn-go-parents').addEventListener('click', () => {
            ParentDashboard.triggerMathLock(() => {
                this.showView('parent-dashboard-view');
                ParentDashboard.renderParentStats();
                ParentDashboard.renderSubjectProgress();
                ParentDashboard.renderParentGallery();
            });
        });

        document.getElementById('btn-back-to-kids').addEventListener('click', () => {
            this.showView('kids-dashboard-view');
        });

        // Configurar selección de islas flotantes
        document.querySelectorAll('.island-card').forEach(island => {
            island.addEventListener('click', () => {
                const sub = island.getAttribute('data-subject');
                if (sub === 'lectura') {
                    ReadingManager.startReadingView();
                } else {
                    this.startSubjectLessons(sub);
                }
            });
        });

        // Inicializar interactividad de pegar stickers en el álbum
        this.setupStickerAlbumDragDrop();
    },

    showView(viewId) {
        VoiceEngine.stop();
        document.querySelectorAll('.view-section').forEach(view => {
            view.classList.remove('active');
        });
        
        const target = document.getElementById(viewId);
        if (target) {
            target.classList.add('active');
        }

        // Actualizar dashboard infantil si regresamos
        if (viewId === 'kids-dashboard-view') {
            Gamification.renderKidsDashboard();
        }
    },

    // 🚀 LÓGICA DE INICIO DE MATERIA Y LECCIONES
    async startSubjectLessons(subjectKey) {
        const subject = curriculumData[subjectKey];
        if (!subject) return;

        // Buscar qué lección le corresponde hacer. Si ya completó la 1, hacer la 2
        const completed = ParentDashboard.getCompletedLessons();
        let lesson = subject.lessons[0];
        
        if (subject.lessons.length > 1 && completed.includes(subject.lessons[0].id)) {
            lesson = subject.lessons[1];
        }

        // Fase 2: Evaluación Dinámica desde Supabase
        if (typeof supabaseClient !== 'undefined' && App.currentOACodigo) {
            try {
                const { data, error } = await supabaseClient.rpc('preguntas_para_oa', {
                    p_oa: App.currentOACodigo,
                    p_user: USER_ID,
                    p_limit: 5
                });

                if (error) throw error;

                if (data) {
                    let dynamicNarrative = "¡Hola Eliu! ¡Es hora de un nuevo desafío! ¡Responde con mucha atención para ganar estrellas! ⭐";
                    let dynamicQuestions = [];
                    
                    if (data.narrativa && Array.isArray(data.preguntas)) {
                        dynamicNarrative = data.narrativa;
                        dynamicQuestions = data.preguntas;
                    } else if (Array.isArray(data)) {
                        dynamicQuestions = data;
                    }

                    if (dynamicQuestions.length < 5) {
                        console.warn(`[Fase 2] Banco de preguntas insuficiente para OA ${App.currentOACodigo}. Solo se encontraron ${dynamicQuestions.length} preguntas.`);
                    }

                    if (dynamicQuestions.length > 0) {
                        lesson = {
                            id: `dinamica_${App.currentOACodigo}`,
                            oa_codigo: App.currentOACodigo,
                            title: `Misión ${App.currentOACodigo}`,
                            description: "Evaluación Dinámica",
                            narrative: dynamicNarrative,
                            questions: dynamicQuestions.map(q => ({
                                id: q.id,
                                type: "multiple",
                                prompt: q.prompt || q.pregunta || "¿Pregunta?",
                                contexto: q.contexto_narrativo,
                                options: q.options || q.opciones || [
                                    { text: "Opción A", correct: true },
                                    { text: "Opción B", correct: false }
                                ],
                                synonymsExplain: q.synonymsExplain || q.explicacion || "¡Excelente trabajo!"
                            }))
                        };
                    }
                }
            } catch (e) {
                console.error("Fase 2 Error cargando preguntas dinámicas:", e);
                // Si falla, usa lección estática
            }
            
            // Limpiar el OA actual
            App.currentOACodigo = null;
        }

        this.currentLesson = lesson;
        this.currentQuestionIndex = 0;
        App.correctAnswersCount = 0;
        App.responsesHistory = [];
        this.showView('activity-view');

        // Configurar cabecera de actividad
        const activityView = document.getElementById('activity-view');
        activityView.style.setProperty('--activity-color', subject.color);
        activityView.style.setProperty('--activity-light', subject.lightColor);

        document.getElementById('activity-title').innerText = subject.title;
        document.getElementById('activity-progress-label').innerText = `Paso 1 de 2 • Lección`;

        this.renderLessonIntro();
    },

    // 1. Mostrar introducción narrada de la lección
    renderLessonIntro() {
        const lesson = this.currentLesson;
        const container = document.getElementById('activity-content-box');
        
        container.innerHTML = `
            <div class="lesson-content-block">
                <button class="btn-lesson-speech" id="btn-play-lesson-speech">🔊</button>
                <div class="lesson-speech-bubble" id="lesson-narration-text">
                    ${lesson.narrative}
                </div>
            </div>
            <button class="btn-activity-submit" style="width: 100%;" id="btn-next-to-questions">
                ¡Entendido, Eliubot! Jugar desafío 🎮
            </button>
        `;

        document.getElementById('btn-play-lesson-speech').addEventListener('click', () => {
            VoiceEngine.speak(lesson.narrative);
        });

        document.getElementById('btn-next-to-questions').addEventListener('click', () => {
            SoundManager.play('click');
            
            // Si la lección es de caligrafía, abrimos el diario en modo caligrafía!
            if (lesson.isCaligrafia) {
                this.showView('diary-view');
                DiaryManager.activateCaligrafiaMode(lesson.letterToTrace);
                
                // Sobreescribir el botón guardar del diario para que active el quiz post-trazado
                const saveBtn = document.getElementById('btn-save-diary');
                const originalSave = saveBtn.onclick;
                
                saveBtn.onclick = () => {
                    const success = DiaryManager.saveDiaryEntry();
                    if (success) {
                        // Devolver botón a su estado normal
                        saveBtn.onclick = originalSave;
                        DiaryManager.deactivateCaligrafiaMode();
                        
                        // Continuar con la pregunta de caligrafía
                        this.showView('activity-view');
                        this.renderQuizQuestion();
                    }
                };
            } else {
                this.renderQuizQuestion();
            }
        });

        // Autoplay narración corta al entrar
        setTimeout(() => {
            VoiceEngine.speak(lesson.narrative);
        }, 300);
    },

    // 2. Renderizar pregunta del Quiz
    renderQuizQuestion() {
        const lesson = this.currentLesson;
        const question = lesson.questions[this.currentQuestionIndex];
        const container = document.getElementById('activity-content-box');
        
        document.getElementById('activity-progress-label').innerText = `Desafío ${this.currentQuestionIndex + 1} de ${lesson.questions.length}`;

        container.innerHTML = `
            ${question.contexto ? `<div style="font-size: 16px; color: var(--text-muted); margin-bottom: 8px;"><em>${question.contexto}</em></div>` : ''}
            <div style="font-size: 20px; font-weight: 700; color: var(--text-main); margin-bottom: 16px; display: flex; align-items: center; gap: 10px;">
                <button class="btn-lesson-speech" style="width: 36px; height: 36px; font-size: 14px;" id="btn-play-question-speech">🔊</button>
                <span>${question.prompt}</span>
            </div>
            <div class="quiz-options-list" id="quiz-options-list">
                ${question.options.map((opt, idx) => `
                    <button class="btn-quiz-option" data-idx="${idx}" onclick="App.selectQuizOption(event, ${opt.correct})">
                        ${opt.text}
                    </button>
                `).join('')}
            </div>
            <button class="btn-activity-submit" style="width: 100%; display: none;" id="btn-submit-answer">
                Comprobar bloque 🧱
            </button>
        `;

        document.getElementById('btn-play-question-speech').addEventListener('click', () => {
            VoiceEngine.speak(question.prompt);
        });

        const submitBtn = document.getElementById('btn-submit-answer');
        submitBtn.addEventListener('click', async () => {
            const isCorrect = submitBtn.getAttribute('data-correct') === 'true';
            const optIdx = parseInt(submitBtn.getAttribute('data-selected-idx'));
            const optionBtn = document.querySelector(`.btn-quiz-option[data-idx="${optIdx}"]`);

            // HOOK 1: Al responder CADA pregunta (anti-repeat)
            if (typeof supabaseClient !== 'undefined' && question.id) {
                try {
                    await supabaseClient.rpc('marcar_pregunta_vista', {
                        p_user: USER_ID,
                        p_pregunta: question.id,
                        p_correcta: isCorrect
                    });
                } catch (e) {
                    console.error("Error marcar_pregunta_vista:", e);
                }
            }

            if (App.responsesHistory) {
                App.responsesHistory.push({ id: question.id, correct: isCorrect });
            }

            if (isCorrect) {
                if (typeof App.correctAnswersCount === 'number') App.correctAnswersCount++;
                // Sonido de deleite robótico y agrado
                SoundManager.play('delight');
                optionBtn.classList.add('correct');
                submitBtn.style.display = 'none';

                // Obtener felicitación aleatoria y unirla con la explicación
                const congrat = Gamification.getRandomCongratulations();
                const speechText = `${congrat} ${question.synonymsExplain}`;

                // Narrar explicación en voz alta
                VoiceEngine.speak(speechText, () => {
                    // Pasar a la siguiente o finalizar lección
                    setTimeout(() => {
                        this.currentQuestionIndex++;
                        if (this.currentQuestionIndex < lesson.questions.length) {
                            this.renderQuizQuestion();
                        } else {
                            this.completeLessonSuccess();
                        }
                    }, 1500);
                });
            } else {
                SoundManager.play('wrong');
                optionBtn.classList.add('wrong');
                
                // Disparar el nuevo flujo metacognitivo ante error
                setTimeout(() => {
                    this.triggerMetacognitiveError(question, optionBtn.innerText);
                }, 800);
            }
        });

        // Autoplay pregunta
        setTimeout(() => {
            VoiceEngine.speak(question.prompt);
        }, 200);
    },

    selectQuizOption(e, isCorrect) {
        SoundManager.play('click');
        const btn = e.currentTarget;
        const list = document.getElementById('quiz-options-list');
        
        list.querySelectorAll('.btn-quiz-option').forEach(b => {
            b.classList.remove('selected', 'wrong');
        });

        btn.classList.add('selected');
        
        const submitBtn = document.getElementById('btn-submit-answer');
        submitBtn.style.display = 'block';
        submitBtn.setAttribute('data-correct', isCorrect);
        submitBtn.setAttribute('data-selected-idx', btn.getAttribute('data-idx'));
    },

    // 3. Finalizar lección con éxito y disparar videollamada metacognitiva
    async completeLessonSuccess() {
        const lesson = this.currentLesson;
        
        // HOOK 2: Al TERMINAR la sesión (registrar evaluación)
        if (typeof supabaseClient !== 'undefined' && App.currentSesionId && lesson.oa_codigo) {
            try {
                await supabaseClient.rpc('registrar_evaluacion', {
                    p_sesion: App.currentSesionId,
                    p_oa: lesson.oa_codigo,
                    p_correctas: App.correctAnswersCount || 0,
                    p_total: lesson.questions ? lesson.questions.length : 0,
                    p_detalle: { respuestas: App.responsesHistory || [] }
                });
            } catch (e) {
                console.error("Error al registrar evaluacion:", e);
            }
        }

        
        // Fase 1: Marcar en base de datos de Supabase si aplica
        if (typeof supabaseClient !== 'undefined' && App.currentPlanId) {
            supabaseClient
                .from('plan_estudio')
                .update({ estado: 'completado', fecha_completada: new Date().toISOString() })
                .eq('id', App.currentPlanId)
                .then(({error}) => {
                    if (error) console.error("Error actualizando plan:", error);
                    else {
                        Fase1API.renderMisiones(); // Refrescar lista de misiones
                        Fase1API.renderStats(); // Refrescar stats
                    }
                });
        }
        
        // Guardar lección como completada
        const completed = ParentDashboard.getCompletedLessons();
        if (!completed.includes(lesson.id)) {
            completed.push(lesson.id);
            localStorage.setItem('eliu_aprende_lecciones_completas', JSON.stringify(completed));
        }

        // Registrar progreso diario
        let subjectKey = 'matematica';
        if (lesson.id.startsWith('lenguaje')) subjectKey = 'lenguaje';
        if (lesson.id.startsWith('ciencias')) subjectKey = 'ciencias';
        if (lesson.id.startsWith('historia')) subjectKey = 'historia';

        Gamification.completeDailyTask(subjectKey);
        Gamification.awardStars(20);

        // Celebración animada de confeti
        this.triggerConfetiExplosion();

        // Regresar al dashboard despus de celebrar
        setTimeout(() => {
            App.showView('kids-dashboard-view');
        }, 3000);
    },

    // 🎉 ANIMACIÓN SINTÉTICA DE CONFETI EN PANTALLA
    triggerConfetiExplosion() {
        const canvas = document.createElement('canvas');
        canvas.style.position = 'fixed';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100vw';
        canvas.style.height = '100vh';
        canvas.style.pointerEvents = 'none';
        canvas.style.zIndex = '9999';
        document.body.appendChild(canvas);

        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const particles = [];
        const colors = ['#3a86ff', '#ffbe0b', '#06d6a0', '#9b5de5', '#ff006e'];

        for (let i = 0; i < 80; i++) {
            particles.push({
                x: canvas.width / 2,
                y: canvas.height + 20,
                vx: (Math.random() - 0.5) * 15,
                vy: -Math.random() * 20 - 10,
                size: Math.random() * 10 + 6,
                color: colors[Math.floor(Math.random() * colors.length)],
                rotation: Math.random() * 360,
                rSpeed: Math.random() * 6 - 3
            });
        }

        function anim() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            let active = false;

            particles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.5; // gravedad
                p.vx *= 0.98; // fricción de aire
                p.rotation += p.rSpeed;

                if (p.y < canvas.height + 20) {
                    active = true;
                    ctx.save();
                    ctx.translate(p.x, p.y);
                    ctx.rotate(p.rotation * Math.PI / 180);
                    ctx.fillStyle = p.color;
                    ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size);
                    ctx.restore();
                }
            });

            if (active) {
                requestAnimationFrame(anim);
            } else {
                canvas.remove();
            }
        }

        anim();
    },

    // 🎨 DRAG & DROP MULTITÁCTIL DEL ÁLBUM DE STICKERS
    draggedEmoji: '',
    draggedId: '',

    dragSticker(e) {
        this.draggedEmoji = e.target.getAttribute('data-emoji');
        this.draggedId = e.target.getAttribute('data-id');
    },

    setupStickerAlbumDragDrop() {
        const scenery = document.getElementById('sticker-scenery');
        if (!scenery) return;

        // Cargar stickers colocados
        this.loadPlacedStickers();

        // Eventos Drag & Drop PC
        scenery.addEventListener('dragover', (e) => e.preventDefault());
        scenery.addEventListener('drop', (e) => {
            e.preventDefault();
            const rect = scenery.getBoundingClientRect();
            const x = e.clientX - rect.left - 24;
            const y = e.clientY - rect.top - 24;
            
            this.placeStickerOnScenery(this.draggedEmoji, x, y);
        });

        // SOPORTE TABLET: Drag & Drop táctil por coordenadas
        const grid = document.getElementById('stickers-selector-grid');
        let touchEmoji = '';
        let touchId = '';

        grid.addEventListener('touchstart', (e) => {
            const stickerEl = e.target.closest('.draggable-sticker');
            if (stickerEl && !stickerEl.classList.contains('locked')) {
                touchEmoji = stickerEl.getAttribute('data-emoji');
                touchId = stickerEl.getAttribute('data-id');
            }
        }, { passive: true });

        scenery.addEventListener('touchend', (e) => {
            if (touchEmoji) {
                const touch = e.changedTouches[0];
                const rect = scenery.getBoundingClientRect();
                const x = touch.clientX - rect.left - 24;
                const y = touch.clientY - rect.top - 24;

                // Solo colocar si se soltó dentro de los límites del escenario
                if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
                    this.placeStickerOnScenery(touchEmoji, x, y);
                }
                touchEmoji = '';
                touchId = '';
            }
        }, { passive: true });
    },

    placeStickerOnScenery(emoji, x, y) {
        const scenery = document.getElementById('sticker-scenery');
        const sticker = document.createElement('div');
        sticker.className = 'placed-sticker';
        sticker.innerText = emoji;
        sticker.style.left = `${x}px`;
        sticker.style.top = `${y}px`;

        // Generar id único
        const stickerId = 'placed_' + Date.now();
        sticker.setAttribute('data-placed-id', stickerId);

        // Hacerlo arrastrable dentro del escenario
        this.makePlacedStickerDraggable(sticker);

        scenery.appendChild(sticker);
        SoundManager.play('click');

        // Guardar en local storage
        this.savePlacedStickers();
    },

    makePlacedStickerDraggable(el) {
        const scenery = document.getElementById('sticker-scenery');
        let activeDrag = false;
        let startX = 0, startY = 0;

        // Arrastrar en PC
        el.addEventListener('mousedown', (e) => {
            activeDrag = true;
            startX = e.clientX - el.offsetLeft;
            startY = e.clientY - el.offsetTop;
            el.style.zIndex = 500;
        });

        document.addEventListener('mousemove', (e) => {
            if (!activeDrag) return;
            const rect = scenery.getBoundingClientRect();
            let x = e.clientX - rect.left - (e.clientX - el.offsetLeft - el.offsetLeft); // pos simplificada
            let y = e.clientY - rect.top - (e.clientY - el.offsetTop - el.offsetTop);

            x = e.clientX - startX;
            y = e.clientY - startY;

            // Restringir dentro del escenario
            x = Math.max(0, Math.min(rect.width - 50, x));
            y = Math.max(0, Math.min(rect.height - 50, y));

            el.style.left = `${x}px`;
            el.style.top = `${y}px`;
        });

        document.addEventListener('mouseup', () => {
            if (activeDrag) {
                activeDrag = false;
                el.style.zIndex = 100;
                this.savePlacedStickers();
            }
        });

        // Soporte Táctil en Tablet
        el.addEventListener('touchstart', (e) => {
            activeDrag = true;
            const touch = e.touches[0];
            startX = touch.clientX - el.offsetLeft;
            startY = touch.clientY - el.offsetTop;
            el.style.zIndex = 500;
        }, { passive: true });

        el.addEventListener('touchmove', (e) => {
            if (!activeDrag) return;
            const touch = e.touches[0];
            const rect = scenery.getBoundingClientRect();
            
            let x = touch.clientX - startX;
            let y = touch.clientY - startY;

            x = Math.max(0, Math.min(rect.width - 50, x));
            y = Math.max(0, Math.min(rect.height - 50, y));

            el.style.left = `${x}px`;
            el.style.top = `${y}px`;
        }, { passive: true });

        el.addEventListener('touchend', () => {
            if (activeDrag) {
                activeDrag = false;
                el.style.zIndex = 100;
                this.savePlacedStickers();
            }
        });

        // Doble click / Doble toque para eliminar sticker
        el.addEventListener('dblclick', () => {
            el.remove();
            SoundManager.play('wrong');
            this.savePlacedStickers();
        });
    },

    savePlacedStickers() {
        const scenery = document.getElementById('sticker-scenery');
        const stickers = [];
        scenery.querySelectorAll('.placed-sticker').forEach(el => {
            stickers.push({
                emoji: el.innerText,
                left: el.style.left,
                top: el.style.top,
                id: el.getAttribute('data-placed-id')
            });
        });
        localStorage.setItem('eliu_aprende_stickers_colocados', JSON.stringify(stickers));
    },

    loadPlacedStickers() {
        const data = localStorage.getItem('eliu_aprende_stickers_colocados');
        if (!data) return;

        const scenery = document.getElementById('sticker-scenery');
        // Limpiar antiguos colocados
        scenery.querySelectorAll('.placed-sticker').forEach(el => el.remove());

        const list = JSON.parse(data);
        list.forEach(item => {
            const sticker = document.createElement('div');
            sticker.className = 'placed-sticker';
            sticker.innerText = item.emoji;
            sticker.style.left = item.left;
            sticker.style.top = item.top;
            sticker.setAttribute('data-placed-id', item.id);
            
            this.makePlacedStickerDraggable(sticker);
            scenery.appendChild(sticker);
        });
    },

    // 🎙️ RESOLVER DUDAS AL VUELO DE ELIUBOT (CON CONEXIÓN DIRECTA A GEMINI)
    triggerVoiceDoubt() {
        SoundManager.play('click');
        VoiceEngine.stop();
        
        const overlay = document.getElementById('doubt-voice-overlay');
        const statusText = document.getElementById('doubt-status-text');
        overlay.classList.add('active');
        
        statusText.innerText = "¡Hola Eliu! Presiona mi micrófono, haz tu pregunta en voz alta y vuelve a presionar el micrófono para enviármela. ¡Chase, Marshall y yo te escuchamos! 🤖🎙️";
        
        const mascot = document.getElementById('doubt-mascot-avatar');
        if (mascot) mascot.classList.add('talking');
        VoiceEngine.speak(statusText.innerText, () => {
            if (mascot) mascot.classList.remove('talking');
        });
    },

    listenToVoiceDoubt() {
        const mic = document.getElementById('btn-doubt-mic');
        const statusText = document.getElementById('doubt-status-text');
        
        if (AudioRecordingEngine.isRecording) {
            if (mic) mic.classList.remove('listening');
            statusText.innerText = "Pensando... 🤖";
            
            AudioRecordingEngine.stop((base64Audio, mimeType) => {
                this.respondToVoiceDoubt(base64Audio, mimeType);
            });
        } else {
            if (mic) mic.classList.add('listening');
            statusText.innerText = "¡Te estoy escuchando, Eliu! Haz tu pregunta con fuerza y vuelve a presionar el micrófono para enviar... 🎙️";
            
            AudioRecordingEngine.start(null, (err) => {
                if (mic) mic.classList.remove('listening');
                statusText.innerText = "No pudimos abrir tu micrófono. Otorga los permisos.";
            });
        }
    },

    respondToVoiceDoubt(base64Audio, mimeType) {
        const statusText = document.getElementById('doubt-status-text');
        const mascot = document.getElementById('doubt-mascot-avatar');
        
        let geminiKey = localStorage.getItem('eliu_aprende_gemini_key');
        if (!geminiKey) {
            geminiKey = 'AIzaSyDiztJS8-qRAuDZO2Re83LF63Z5x-aIQTc';
            localStorage.setItem('eliu_aprende_gemini_key', geminiKey);
        }
        if (geminiKey) {
            statusText.innerText = "Pensando... 🤖";
            
            // Prompt de sistema didáctico y moral
            const systemPrompt = `Eres Eliubot, el robot inteligente y tierno tutor de Eliu, un niño de 6 años de 1° Básico en Chile.
Eliu te está haciendo una pregunta de dudas escolares o de algún concepto de su estudio.
Responde de manera muy dulce, comprensiva, paciente y didáctica.
IMPORTANTE:
1. Responde de forma muy concisa, usando máximo 2 a 3 oraciones cortas y sencillas, para que Eliu pueda seguirte.
2. NUNCA uses asteriscos (*) ni texto en negrita. Usa emojis didácticos.
3. Habla con mucho cariño y anímalo a superarse siempre. Dile que es muy inteligente y especial.
4. Explícale el concepto escolar de forma tildada y simple (sílabas, sumas, los 5 sentidos, caligrafía o geografía de Chile), usando analogías divertidas como bloques o Paw Patrol.
5. ENSEÑANZA DE VALORES Y VIRTUDES (CRÍTICO): Siempre que sea oportuno, enséñale a decir siempre la verdad, a ser bondadoso con todos, a no mentir ni engañar bajo ninguna circunstancia, y a ser una persona buena, empática y de noble corazón, citando a Chase y Marshall de Paw Patrol.
6. OBLIGATORIO: Transcribe exactamente la duda del niño en el audio y ponlo al principio de tu respuesta entre corchetes, por ejemplo: "[Transcripción: qué son las sumas]". Luego de cerrar el corchete, escribe la respuesta cariñosa de Eliubot.`;

            const models = ['gemini-2.5-flash', 'gemini-1.5-flash'];
            const fetchResponse = async () => {
                for (const model of models) {
                    try {
                        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;
                        const response = await fetch(url, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                contents: [{
                                    role: "user",
                                    parts: [
                                        { inlineData: { mimeType: mimeType || "audio/webm", data: base64Audio } },
                                        { text: "Escucha este audio del niño Eliu (6 años) con su duda de estudio y respóndele con cariño, didáctica y valores." }
                                    ]
                                }],
                                systemInstruction: {
                                    parts: [{ text: systemPrompt }]
                                },
                                generationConfig: {
                                    maxOutputTokens: 140,
                                    temperature: 0.7
                                }
                            })
                        });
                        if (response.ok) {
                            const data = await response.json();
                            const answer = data.candidates?.[0]?.content?.parts?.[0]?.text;
                            if (answer) return answer;
                        }
                    } catch (e) {
                        console.error(`Error con el modelo ${model} en dudas mic:`, e);
                    }
                }
                throw new Error("API de Gemini no disponible en dudas");
            };

            fetchResponse().then(answer => {
                const { childTranscript, botResponse } = parseGeminiAudioResponse(answer);
                statusText.innerText = botResponse;
                
                // Registrar log
                ConversationsLogger.log("Duda por voz AI", childTranscript, botResponse);

                if (mascot) mascot.classList.add('talking');
                VoiceEngine.speak(botResponse, () => {
                    if (mascot) mascot.classList.remove('talking');
                });
            }).catch(err => {
                console.warn("Falla de Gemini en dudas, usando fallback local:", err);
                statusText.innerText = "¡Qué gran pregunta, Eliu! Recuerda ser siempre honesto, bondadoso y estudiar mucho con tu lindo corazón. ¡Tú eres capaz de todo! 🌟";
                VoiceEngine.speak(statusText.innerText);
            });
        } else {
            statusText.innerText = "¡Qué gran pregunta, Eliu! Recuerda ser siempre honesto, bondadoso y estudiar mucho con tu lindo corazón. 🌟";
            VoiceEngine.speak(statusText.innerText);
        }
    },

    respondToVoiceDoubtFallback(query, originalText) {
        const statusText = document.getElementById('doubt-status-text');
        let answer = "¡Qué gran pregunta, Eliu! Me encanta tu curiosidad. Recuerda que puedes preguntarme sobre las sílabas de lenguaje, las sumas de matemáticas, tus 5 sentidos, caligrafía, o sobre nuestro hermoso país Chile. ¡Tú eres un campeón, dime qué más quieres saber!";
        
        if (query.includes("sílaba") || query.includes("silaba") || query.includes("palabra")) {
            answer = "¡Excelente pregunta, Eliu! Una sílaba es cada uno de los trocitos o golpes de voz en los que dividimos una palabra al hablar. Por ejemplo, en tu libro Jugando con los Sonidos, aplaudimos para contarlas: E-liu-bot tiene tres sílabas. ¡Es muy fácil y divertido!";
        }
        else if (query.includes("sumar") || query.includes("suma") || query.includes("número") || query.includes("numero") || query.includes("sumas") || query.includes("numeros")) {
            answer = "¡Sumar es súper divertido, Eliu! Sumar significa juntar, reunir o agregar cosas de colores. Como cuando juntas 5 bloques de Roblox azules con 3 bloques rojos y haces una torre gigante de 8 bloques en tu libro Supermatemáticos. ¡Es pura construcción!";
        }
        else if (query.includes("sentido") || query.includes("cuerpo") || query.includes("ver") || query.includes("oler") || query.includes("escuchar") || query.includes("sentidos")) {
            answer = "¡Los sentidos son tus súper sensores corporales! Tienes 5 súper poderes: tus ojos para ver Roblox, tus oídos para escuchar a Eliubot, tu nariz para oler flores, tu lengua para saborear helado, y tus manos para tocar y dibujar. ¡Sirven para descubrir tu planeta!";
        }
        else if (query.includes("caligrafía") || query.includes("caligrafia") || query.includes("escribir") || query.includes("letra") || query.includes("caligrafias")) {
            answer = "¡Caligrafía es el arte de dibujar las letras de forma hermosa en tu cuaderno! Imagina que la cuadrícula de tu libro Caligrafía es un cielo, pasto y tierra, para que las letras crezcan ordenadas y felices. ¡Usa tu lápiz táctil en el diario mágico para practicar!";
        }
        else if (query.includes("chile") || query.includes("país") || query.includes("pais") || query.includes("bandera")) {
            answer = "¡Chile es nuestro hermoso y largo país, rodeado de un mar azul y montañas gigantes cubiertas de nieve! Tiene una bandera tricolor preciosa con una estrella blanca y una flor roja llamada copihue. ¡Es un gran lugar para vivir y explorar!";
        }
        else if (query.includes("roblox") || query.includes("juego") || query.includes("bloque") || query.includes("bloques")) {
            answer = "¡Roblox es asombroso! Es un universo virtual hecho de bloques de colores donde podemos construir mundos increíbles. ¡Aprender es igual que construir en Roblox: cada lección es un bloque más de sabiduría que agregas a tu cerebro! ¡Eres un súper constructor!";
        }

        statusText.innerText = answer;
        
        // Registrar log
        ConversationsLogger.log("Duda por voz Local", originalText || query, answer);

        VoiceEngine.speak(answer, () => {
            setTimeout(() => {
                const overlay = document.getElementById('doubt-voice-overlay');
                if (overlay && overlay.classList.contains('active')) {
                    this.listenToVoiceDoubt();
                }
            }, 1500);
        });
    },

    closeVoiceDoubt() {
        if (AudioRecordingEngine.isRecording) {
            AudioRecordingEngine.cancel();
        }
        VoiceEngine.stop();
        document.getElementById('doubt-voice-overlay').classList.remove('active');
        SoundManager.play('click');
    },

    triggerMetacognitiveError(question, selectedOptionText) {
        VoiceEngine.stop();
        SpeechRecognitionEngine.stop();

        const container = document.getElementById('activity-content-box');
        
        // Obtener una pista didáctica basada en la pregunta
        let hint = "Busca con cuidado la respuesta correcta, ¡tú puedes!";
        const prompt = question.prompt.toLowerCase();
        
        if (prompt.includes("sílaba") || prompt.includes("silaba") || prompt.includes("aplaude") || prompt.includes("pelota") || prompt.includes("robot")) {
            if (prompt.includes("pelota")) {
                hint = "💡 PE-LO-TA, aplaude cada parte. ¡Cuenta los aplausos!";
            } else if (prompt.includes("robot")) {
                hint = "💡 RO-BOT, aplaude con Eliubot: RO... BOT. ¡Dos trocitos!";
            } else {
                hint = "💡 Intenta aplaudir cada parte de la palabra lentamente para contar sus partes.";
            }
        }
        else if (prompt.includes("sumar") || prompt.includes("suma") || prompt.includes("bloques") || prompt.includes("junto") || prompt.includes("juntar")) {
            hint = "💡 Juntar significa reunir todos los bloques de Roblox en una sola torre. ¡Cuéntalos todos juntos!";
        }
        else if (prompt.includes("sentido") || prompt.includes("saborear") || prompt.includes("gusto")) {
            hint = "💡 Saboreamos con nuestra lengua en la boca. ¡Eso nos da el sentido del gusto!";
        }
        else if (prompt.includes("chile") || prompt.includes("bandera") || prompt.includes("colores")) {
            hint = "💡 La bandera tiene una estrella blanca en un cielo azul, y flores de color rojo copihue.";
        }

        // Renderizar la tarjeta metacognitiva en la pantalla
        container.innerHTML = `
            <div class="metacognitive-error-card" style="text-align: center;">
                <div class="metacognitive-emoji">🤔</div>
                <div class="metacognitive-title">Casi lo tienes</div>
                <div class="metacognitive-hint">${hint}</div>
                
                <div class="metacognitive-mic-status" id="meta-mic-status" style="font-weight: 700; color: var(--color-ciencias); margin-bottom: 12px;">
                    Presiona el micrófono y explícame por qué elegiste esa respuesta... 🎙️
                </div>
                
                <!-- Micrófono Glowing Metacognitivo -->
                <div class="mic-glow-wrapper" id="meta-mic-container" style="position: relative; width: 60px; height: 60px; margin: 16px auto; cursor: pointer;">
                    <div class="mic-glow" id="meta-mic-glow" style="width: 80px; height: 80px; border-radius: 40px; background: rgba(0, 240, 255, 0.2); position: absolute; top: -10px; left: -10px; z-index: 1; transition: all 0.3s;"></div>
                    <button class="btn-call-mic" id="btn-meta-mic" style="position: relative; z-index: 2; cursor: pointer; border-radius: 50%; font-size: 28px; padding: 0; background: linear-gradient(135deg, #00f0ff 0%, #0077b6 100%); border: none; width: 60px; height: 60px; display: flex; align-items: center; justify-content: center; color: white; box-shadow: 0 4px 10px rgba(0, 240, 255, 0.4); transition: transform 0.2s;">
                        🎙️
                    </button>
                </div>

                <button class="btn-activity-submit" style="width: 100%; background: linear-gradient(135deg, var(--color-ciencias) 0%, #2c3e50 100%); margin-top: 12px;" id="btn-meta-retry">
                    Volver a intentar 🎯
                </button>
            </div>
        `;

        // Preguntar por voz
        const queryText = `¡Casi lo tienes, Eliu! A ver, cuéntame, ¿cuál de las respuestas creías que era y por qué la elegiste?`;
        VoiceEngine.speak(queryText);

        const metaMic = document.getElementById('btn-meta-mic');
        const metaGlow = document.getElementById('meta-mic-glow');
        const statusEl = document.getElementById('meta-mic-status');

        if (metaMic) {
            metaMic.onclick = () => {
                SoundManager.play('click');
                VoiceEngine.stop();

                if (AudioRecordingEngine.isRecording) {
                    if (metaMic) metaMic.classList.remove('listening');
                    if (metaGlow) metaGlow.classList.remove('listening');
                    if (statusEl) statusEl.innerText = "Pensando... 🤖";

                    AudioRecordingEngine.stop((base64Audio, mimeType) => {
                        let geminiKey = localStorage.getItem('eliu_aprende_gemini_key') || 'AIzaSyDiztJS8-qRAuDZO2Re83LF63Z5x-aIQTc';
                        
                        const systemPrompt = `Eres Eliubot, el tierno robot tutor de Eliu (6 años). Eliu acaba de cometer un error en una pregunta escolar de 1° Básico en Chile y está explicando su respuesta.
Su explicación se ha grabado en audio.
Transcribe su audio exactamente.
Si Eliu responde con sinceridad o explica lo que pensó, elógialo muchísimo por su honestidad y esfuerzo (decir la verdad, no mentir y esforzarse son valores hermosos, Chase y Marshall están súper orgullosos de su noble corazón).
Luego, dale una pista didáctica muy tierna, dulce y de apoyo basada en esta pista oficial: "${hint.replace("💡 ", "")}".
Anímalo a reintentarlo y dile que equivocarse es parte del aprendizaje y que jugando con bloques construimos sabiduría.
OBLIGATORIO: Pon su transcripción al principio entre corchetes, por ejemplo: "[Transcripción: elegí el tres porque conté mal]". Luego escribe tu respuesta amorosa.`;

                        const models = ['gemini-2.5-flash', 'gemini-1.5-flash'];
                        const fetchResponse = async () => {
                            for (const model of models) {
                                try {
                                    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;
                                    const response = await fetch(url, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                            contents: [{
                                                role: "user",
                                                parts: [
                                                    { inlineData: { mimeType: mimeType || "audio/webm", data: base64Audio } },
                                                    { text: "Escucha la explicación del error de Eliu y respóndele con amor y guía didáctica." }
                                                ]
                                            }],
                                            systemInstruction: { parts: [{ text: systemPrompt }] },
                                            generationConfig: { maxOutputTokens: 140, temperature: 0.6 }
                                        })
                                    });
                                    if (response.ok) {
                                        const data = await response.json();
                                        const answer = data.candidates?.[0]?.content?.parts?.[0]?.text;
                                        if (answer) return answer;
                                    }
                                } catch (e) {
                                    console.error(e);
                                }
                            }
                            return `[Transcripción: Explicación de Eliu] ¡Entiendo lo que pensaste, Eliu! Pero te daré una pista secreta: ${hint.replace("💡 ", "")} ¡Inténtalo de nuevo, tú puedes! 🌟`;
                        };

                        fetchResponse().then(answer => {
                            const { childTranscript, botResponse } = parseGeminiAudioResponse(answer);
                            if (statusEl) statusEl.innerText = botResponse;

                            ConversationsLogger.log("Explicación de Error", childTranscript, botResponse);

                            VoiceEngine.speak(botResponse);
                        });
                    });
                } else {
                    if (metaMic) metaMic.classList.add('listening');
                    if (metaGlow) metaGlow.classList.add('listening');
                    if (statusEl) statusEl.innerText = "🎙️ ¡Grabando explicación! Habla fuerte ahora...";

                    AudioRecordingEngine.start(null, (err) => {
                        if (metaMic) metaMic.classList.remove('listening');
                        if (metaGlow) metaGlow.classList.remove('listening');
                        if (statusEl) statusEl.innerText = "Error de micrófono.";
                    });
                }
            };
        }

        // Configurar botón Volver a intentar
        document.getElementById('btn-meta-retry').onclick = () => {
            SoundManager.play('click');
            if (AudioRecordingEngine.isRecording) {
                AudioRecordingEngine.cancel();
            }
            VoiceEngine.stop();
            // Restaurar pregunta
            this.renderQuizQuestion();
        };
    }
};

// 💬 REGISTRO AUTOMÁTICO DE CONVERSACIONES CON ELIUBOT
const ConversationsLogger = {
    log(type, childText, botText) {
        try {
            const logs = JSON.parse(localStorage.getItem('eliu_aprende_chat_logs')) || [];
            const newLog = {
                id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
                fecha: new Date().toLocaleDateString('es-CL'),
                hora: new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
                tipo: type,
                nino: childText,
                bot: botText
            };
            logs.unshift(newLog);
            localStorage.setItem('eliu_aprende_chat_logs', JSON.stringify(logs.slice(0, 100))); // Guardar últimas 100
        } catch (e) {
            console.error("Error al registrar conversación:", e);
        }
    },
    getLogs() {
        try {
            return JSON.parse(localStorage.getItem('eliu_aprende_chat_logs')) || [];
        } catch (e) {
            return [];
        }
    },
    clearLogs() {
        localStorage.removeItem('eliu_aprende_chat_logs');
    }
};

// 🦷🚿 GESTOR DE HÁBITOS DIARIOS DE AUTOCUIDADO (CHECK-IN)
const HabitsManager = {
    currentIndex: 0,
    results: {},
    habits: [
        { key: 'dientes', emoji: '🦷', text: '¿Te lavaste los dientes hoy, Eliu? 🦷', speakPrompt: '¿Te lavaste los dientes hoy, Eliu?', consequence: '¿Sabías que si no te lavas los dientes, los bichitos del azúcar hacen una gran fiesta en tu boca por la noche y te pueden causar caries? 🦷🦠' },
        { key: 'banar', emoji: '🚿', text: '¿Te bañaste hoy, Eliu? 🚿', speakPrompt: '¿Te bañaste hoy, Eliu?', consequence: '¿Sabías que un buen baño calentito nos quita las bacterias y nos llena de súper energía para seguir construyendo en Roblox? 🚿🧼' },
        { key: 'manos', emoji: '🧼', text: '¿Lavaste tus manos antes de comer? 🧼', speakPrompt: '¿Lavaste tus manos antes de comer?', consequence: '¿Sabías que las manitos sucias llevan bichitos invisibles a tu pancita? ¡Lavarlas con agua y jabón te mantiene fuerte! 🧼🦠' },
        { key: 'cama', emoji: '🛏️', text: '¿Hiciste tu cama hoy? 🛏️', speakPrompt: '¿Hiciste tu cama hoy?', consequence: '¿Sabías que hacer tu cama es la primera súper misión del día? ¡Tener tu pieza ordenada hace que tu mente esté clara y lista para jugar! 🛏️✨' },
        { key: 'juguetes', emoji: '🧸', text: '¿Ordenaste tus juguetes, Eliu? 🧸', speakPrompt: '¿Ordenaste tus juguetes, Eliu?', consequence: '¿Sabías que ordenar tus juguetes hace que tus cachorros de Paw Patrol tengan una estación limpia para sus rescates? 🧸🚒' },
        { key: 'agua', emoji: '💧', text: '¿Tomaste agua hoy? 💧', speakPrompt: '¿Tomaste agua hoy?', consequence: '¿Sabías que tu cuerpo es como un motor de cohete que necesita agua limpia para hidratarse y volar muy alto? 💧🚀' }
    ],

    init() {
        document.getElementById('btn-habit-yes').onclick = () => this.answer(true);
        document.getElementById('btn-habit-no').onclick = () => this.answer(false);
        document.getElementById('btn-habit-finish').onclick = () => {
            SoundManager.play('click');
            App.showView('kids-dashboard-view');
        };

        const skipBtn = document.getElementById('btn-habit-skip-mic');
        if (skipBtn) {
            skipBtn.onclick = () => {
                SoundManager.play('click');
                SpeechRecognitionEngine.stop();
                VoiceEngine.stop();
                this.nextQuestion();
            };
        }

        const habitsMic = document.getElementById('btn-habit-mic');
        if (habitsMic) {
            habitsMic.onclick = () => {
                SoundManager.play('click');
                VoiceEngine.stop();
                SpeechRecognitionEngine.stop();
                this.listenToHabitExplanation();
            };
        }
    },

    startCheckin() {
        this.init();
        
        const todayStr = new Date().toISOString().split('T')[0];
        const lastHabitsDate = localStorage.getItem('eliu_aprende_habitos_fecha');
        
        if (lastHabitsDate === todayStr) {
            App.showView('kids-dashboard-view');
            return;
        }

        this.currentIndex = 0;
        this.results = {};
        
        document.getElementById('habits-congrat-box').style.display = 'none';
        document.getElementById('habits-question-box').style.display = 'block';
        document.getElementById('habits-mic-container').style.display = 'none';

        App.showView('habits-view');
        this.showQuestion(0);
    },

    showQuestion(idx) {
        const habit = this.habits[idx];
        const percent = Math.round((idx / this.habits.length) * 100);
        
        document.getElementById('habits-progress-label').innerText = `Misión ${idx + 1} de ${this.habits.length}`;
        document.getElementById('habits-progress-percent').innerText = `${percent}%`;
        document.getElementById('habits-progress-fill').style.width = `${percent}%`;

        document.getElementById('habits-question-emoji').innerText = habit.emoji;
        document.getElementById('habits-question-text').innerText = habit.text;

        const greeting = `¡Misión de hábitos, Eliu! ${habit.speakPrompt}`;
        document.getElementById('habits-speech-bubble').innerText = greeting;

        // Animar avatar
        const mascot = document.getElementById('habits-mascot-avatar');
        if (mascot) mascot.classList.add('talking');

        VoiceEngine.speak(greeting, () => {
            if (mascot) mascot.classList.remove('talking');
        });
    },

    answer(yesNo) {
        const habit = this.habits[this.currentIndex];
        this.results[habit.key] = yesNo;

        // Ocultar botones de respuesta temporalmente
        document.getElementById('btn-habit-yes').style.disabled = true;
        document.getElementById('btn-habit-no').style.disabled = true;

        if (yesNo === true) {
            SoundManager.play('success');
            const response = `¡Excelente, Eliu! ¡Qué gran súper hábito! Tienes una estrella dorada más en tu salud hoy. ⭐`;
            document.getElementById('habits-speech-bubble').innerText = response;
            
            VoiceEngine.speak(response, () => {
                document.getElementById('btn-habit-yes').style.disabled = false;
                document.getElementById('btn-habit-no').style.disabled = false;
                this.nextQuestion();
            });
        } else {
            SoundManager.play('wrong');
            const response = `${habit.consequence} Eliu, cuéntame, ¿qué pasó hoy? ¿Estabas muy cansado, jugando o algo más? 🎙️`;
            document.getElementById('habits-speech-bubble').innerText = response;
            
            VoiceEngine.speak(response, () => {
                document.getElementById('btn-habit-yes').style.disabled = false;
                document.getElementById('btn-habit-no').style.disabled = false;
                
                // Mostrar micrófono para escuchar su explicación
                document.getElementById('habits-mic-container').style.display = 'flex';
                this.listenToHabitExplanation();
            });
        }
    },

    listenToHabitExplanation() {
        const mic = document.getElementById('btn-habit-mic');
        const glow = document.getElementById('habits-mic-glow');
        const status = document.getElementById('habits-mic-status-text');

        if (AudioRecordingEngine.isRecording) {
            if (mic) mic.classList.remove('listening');
            if (glow) glow.classList.remove('listening');
            if (status) status.innerText = "Pensando... 🤖";

            AudioRecordingEngine.stop((base64Audio, mimeType) => {
                // Realizar una transcripción rápida con Gemini
                let geminiKey = localStorage.getItem('eliu_aprende_gemini_key') || 'AIzaSyDiztJS8-qRAuDZO2Re83LF63Z5x-aIQTc';

                const systemPrompt = "Transcribe exactamente el siguiente audio de un niño de 6 años explicando por qué no completó un hábito diario (como lavarse los dientes o bañarse). Solo devuelve la transcripción directa, sin comentarios adicionales ni introducciones.";
                
                const models = ['gemini-2.5-flash', 'gemini-1.5-flash'];
                const fetchTranscription = async () => {
                    for (const model of models) {
                        try {
                            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;
                            const response = await fetch(url, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    contents: [{
                                        role: "user",
                                        parts: [
                                            { inlineData: { mimeType: mimeType || "audio/webm", data: base64Audio } },
                                            { text: "Transcribe este audio de forma simple." }
                                        ]
                                    }],
                                    systemInstruction: { parts: [{ text: systemPrompt }] },
                                    generationConfig: { maxOutputTokens: 80, temperature: 0.2 }
                                })
                            });
                            if (response.ok) {
                                const data = await response.json();
                                const txt = data.candidates?.[0]?.content?.parts?.[0]?.text;
                                if (txt) return txt.trim();
                            }
                        } catch (e) {
                            console.error(e);
                        }
                    }
                    return "No se pudo transcribir el audio.";
                };

                fetchTranscription().then(transcript => {
                    const reply = `¡Entiendo perfectamente, Eliu! A veces pasa. Pero qué te parece si vamos juntos a hacerlo ahora? ¡Yo te acompaño!`;
                    if (status) status.innerText = `Explicaste: "${transcript}"`;
                    
                    document.getElementById('habits-speech-bubble').innerText = reply;
                    
                    // Log conversation
                    ConversationsLogger.log("Hábitos (No)", this.habits[this.currentIndex].speakPrompt + " -> Aún no", `Eliu explica: "${transcript}". Eliubot responde: "${reply}"`);

                    VoiceEngine.speak(reply, () => {
                        setTimeout(() => this.nextQuestion(), 1000);
                    });
                });
            });
        } else {
            if (mic) mic.classList.add('listening');
            if (glow) glow.classList.add('listening');
            if (status) status.innerText = "🎙️ ¡Te escucho, Eliu! Habla fuerte y vuelve a presionar para enviar...";
            
            AudioRecordingEngine.start(null, (err) => {
                if (mic) mic.classList.remove('listening');
                if (glow) glow.classList.remove('listening');
                if (status) status.innerText = "No pudimos iniciar el micrófono.";
            });
        }
    },

    nextQuestion() {
        document.getElementById('habits-mic-container').style.display = 'none';
        
        this.currentIndex++;
        if (this.currentIndex < this.habits.length) {
            this.showQuestion(this.currentIndex);
        } else {
            // Ir a la fase de Promesa del Día de Valores!
            this.startPromisePhase();
        }
    },

    startPromisePhase() {
        document.getElementById('habits-question-box').style.display = 'none';
        document.getElementById('habits-promise-box').style.display = 'block';

        const status = document.getElementById('promise-mic-status-text');
        if (status) status.innerText = "🎙️ Presiona el micrófono y di tu promesa en voz alta...";

        const promptText = `¡Qué gran mañana de súper hábitos, Eliu! Para tener un día maravilloso, hagamos nuestra promesa de valores de hoy. Presiona mi micrófono azul de abajo y repite conmigo fuerte: "Prometo decir siempre la verdad, ser súper bondadoso con todos, y dar lo mejor de mí para aprender hoy." ¡Te escucho con amor!`;
        document.getElementById('habits-speech-bubble').innerText = promptText;

        const mascot = document.getElementById('habits-mascot-avatar');
        if (mascot) mascot.classList.add('talking');

        VoiceEngine.speak(promptText, () => {
            if (mascot) mascot.classList.remove('talking');
            
            // Iniciar el listener de la Promesa Diaria
            const pMic = document.getElementById('btn-promise-mic');
            const pGlow = document.getElementById('promise-mic-glow');
            const skipBtn = document.getElementById('btn-promise-skip');

            if (pMic) {
                pMic.onclick = () => {
                    SoundManager.play('click');
                    VoiceEngine.stop();

                    if (AudioRecordingEngine.isRecording) {
                        if (pMic) pMic.classList.remove('listening');
                        if (pGlow) pGlow.classList.remove('listening');
                        if (status) status.innerText = "Pensando... 🤖";

                        AudioRecordingEngine.stop((base64Audio, mimeType) => {
                            // Enviar a Gemini para transcribir y validar moralmente
                            let geminiKey = localStorage.getItem('eliu_aprende_gemini_key') || 'AIzaSyDiztJS8-qRAuDZO2Re83LF63Z5x-aIQTc';
                            
                            const systemPrompt = `Eres Eliubot, el tierno robot tutor. Eliu acaba de grabar su Promesa Diaria de Valores (prometo decir la verdad, ser bondadoso y estudiar). 
Transcribe su audio exactamente.
Si Eliu hizo la promesa (o habló con cariño), elógialo con extrema dulzura y dile que tiene un corazón gigante y que Marshall y Chase están orgullosos de él.
OBLIGATORIO: Pon su transcripción al principio entre corchetes, por ejemplo: "[Transcripción: prometo decir la verdad y ser bueno]". Luego escribe tu felicitación amorosa.`;

                            const models = ['gemini-2.5-flash', 'gemini-1.5-flash'];
                            const fetchPledge = async () => {
                                for (const model of models) {
                                    try {
                                        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;
                                        const response = await fetch(url, {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({
                                                contents: [{
                                                    role: "user",
                                                    parts: [
                                                        { inlineData: { mimeType: mimeType || "audio/webm", data: base64Audio } },
                                                        { text: "Procesa y felicita la promesa de valores de Eliu." }
                                                    ]
                                                }],
                                                systemInstruction: { parts: [{ text: systemPrompt }] },
                                                generationConfig: { maxOutputTokens: 120, temperature: 0.5 }
                                            })
                                        });
                                        if (response.ok) {
                                            const data = await response.json();
                                            const answer = data.candidates?.[0]?.content?.parts?.[0]?.text;
                                            if (answer) return answer;
                                        }
                                    } catch (e) {
                                        console.error(e);
                                    }
                                }
                                return "[Transcripción: Promesa hecha] ¡Increíble promesa, Eliu! Tu corazón es gigante. 💖";
                            };

                            fetchPledge().then(answer => {
                                const { childTranscript, botResponse } = parseGeminiAudioResponse(answer);
                                if (status) status.innerText = botResponse;

                                // Guardar en bitácora de padres
                                ConversationsLogger.log("Promesa Diaria", childTranscript, botResponse);

                                document.getElementById('habits-speech-bubble').innerText = botResponse;

                                if (mascot) mascot.classList.add('talking');
                                VoiceEngine.speak(botResponse, () => {
                                    if (mascot) mascot.classList.remove('talking');
                                    this.finishHabitsCongrat();
                                });
                            });
                        });
                    } else {
                        if (pMic) pMic.classList.add('listening');
                        if (pGlow) pGlow.classList.add('listening');
                        if (status) status.innerText = "🎙️ ¡Grabando promesa! Habla fuerte ahora...";
                        
                        AudioRecordingEngine.start(null, (err) => {
                            if (pMic) pMic.classList.remove('listening');
                            if (pGlow) pGlow.classList.remove('listening');
                            if (status) status.innerText = "Error de micrófono.";
                        });
                    }
                };
            }

            if (skipBtn) {
                skipBtn.onclick = () => {
                    SoundManager.play('click');
                    AudioRecordingEngine.cancel();
                    this.finishHabitsCongrat();
                };
            }
        });
    },

    finishHabitsCongrat() {
        document.getElementById('habits-promise-box').style.display = 'none';
        document.getElementById('habits-congrat-box').style.display = 'block';

        const todayStr = new Date().toISOString().split('T')[0];
        localStorage.setItem('eliu_aprende_habitos_fecha', todayStr);
        
        let history = [];
        const savedHistory = localStorage.getItem('eliu_aprende_habitos_historial');
        if (savedHistory) {
            try { history = JSON.parse(savedHistory); } catch(e) {}
        }
        history = history.filter(h => h.fecha !== todayStr);
        history.unshift({
            fecha: todayStr,
            checks: this.results
        });
        localStorage.setItem('eliu_aprende_habitos_historial', JSON.stringify(history.slice(0, 30)));

        Gamification.awardStars(30);

        const finishGreeting = `¡Espectacular, Eliu! Has completado tus hábitos y tu promesa del día. Has ganado +30⭐ súper doradas. ¡Ahora estás listo para aprender en tus hermosas islas! 🚀🏆`;
        document.getElementById('habits-speech-bubble').innerText = finishGreeting;

        SoundManager.play('success');
        VoiceEngine.speak(finishGreeting);
    }
};

// ==========================================================================
// 🎁 COFRE DE RECUERDOS MÁGICOS (CHALLENGES & RECORDER)
// ==========================================================================
const CofreManager = {
    mediaRecorder: null,
    audioChunks: [],
    recordingTimer: null,
    recordingDuration: 0,
    currentChallengeType: null,
    currentChallengeLabel: "",
    isRecording: false,

    init() {
        // Enlazar botones del grabador
        const recordBtn = document.getElementById('btn-cofre-record');
        if (recordBtn) {
            recordBtn.onclick = () => {
                if (this.isRecording) {
                    this.stopRecording();
                } else {
                    this.startRecording();
                }
            };
        }

        const cancelBtn = document.getElementById('btn-cofre-cancel');
        if (cancelBtn) {
            cancelBtn.onclick = () => {
                SoundManager.play('click');
                this.cancelRecording();
            };
        }
    },

    selectChallenge(type, promptText) {
        SoundManager.play('click');
        VoiceEngine.stop();
        this.currentChallengeType = type;
        this.currentChallengeLabel = promptText;

        // Reset recorder UI
        const panel = document.getElementById('cofre-recorder-panel');
        if (panel) panel.style.display = 'block';
        
        const titleEl = document.getElementById('cofre-challenge-title');
        if (titleEl) titleEl.innerText = `Desafío: ${promptText}`;
        
        const animEl = document.getElementById('cofre-recording-animation');
        if (animEl) animEl.style.display = 'none';
        
        const timerEl = document.getElementById('cofre-recorder-timer');
        if (timerEl) {
            timerEl.style.display = 'none';
            timerEl.innerText = "00:00";
        }

        const recordBtn = document.getElementById('btn-cofre-record');
        if (recordBtn) {
            recordBtn.innerText = "🔴 Iniciar Grabación";
            recordBtn.className = "btn-back-kids";
            recordBtn.style.background = "linear-gradient(135deg, #ff4d4d 0%, #d90429 100%)";
        }

        // Leer el desafío en voz alta
        const greeting = `¡Súper desafío! ${promptText}. Presiona el botón rojo cuando estés listo para empezar a hablar. ¡Yo guardaré tu recuerdo!`;
        document.getElementById('cofre-speech-bubble').innerText = greeting;

        const mascot = document.getElementById('cofre-mascot-avatar');
        if (mascot) mascot.classList.add('talking');
        VoiceEngine.speak(greeting, () => {
            if (mascot) mascot.classList.remove('talking');
        });
    },

    async startRecording() {
        if (this.isRecording) return;
        
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.mediaRecorder = new MediaRecorder(stream);
            this.audioChunks = [];

            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                }
            };

            this.mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
                
                // Convert to base64
                const reader = new FileReader();
                reader.readAsDataURL(audioBlob);
                reader.onloadend = () => {
                    const base64Audio = reader.result;
                    this.saveRecordedAudio(base64Audio);
                };

                // Detener todas las pistas de audio para liberar el micrófono
                stream.getTracks().forEach(track => track.stop());
            };

            // Iniciar la grabación
            this.mediaRecorder.start();
            this.isRecording = true;
            SoundManager.play('success');

            // Actualizar interfaz
            const recordBtn = document.getElementById('btn-cofre-record');
            if (recordBtn) {
                recordBtn.innerText = "⏹️ Detener y Guardar";
                recordBtn.style.background = "linear-gradient(135deg, #f39c12 0%, #d35400 100%)";
            }
            
            const animEl = document.getElementById('cofre-recording-animation');
            if (animEl) animEl.style.display = 'flex';
            
            const timerEl = document.getElementById('cofre-recorder-timer');
            if (timerEl) {
                timerEl.style.display = 'block';
                timerEl.innerText = "00:00";
            }
            
            this.recordingDuration = 0;
            this.recordingTimer = setInterval(() => {
                this.recordingDuration++;
                const mins = Math.floor(this.recordingDuration / 60).toString().padStart(2, '0');
                const secs = (this.recordingDuration % 60).toString().padStart(2, '0');
                if (timerEl) timerEl.innerText = `${mins}:${secs}`;
                
                // Limitar la grabación a 1 minuto
                if (this.recordingDuration >= 60) {
                    this.stopRecording();
                }
            }, 1000);

            const recordGreeting = "¡Grabando! Te escucho con mucha atención...";
            document.getElementById('cofre-speech-bubble').innerText = recordGreeting;

        } catch (err) {
            console.error("No se pudo iniciar la grabación de audio:", err);
            alert("No pudimos abrir tu micrófono. Por favor, asegúrate de dar permisos de micrófono en tu navegador y tableta.");
        }
    },

    stopRecording() {
        if (!this.isRecording) return;
        
        clearInterval(this.recordingTimer);
        this.mediaRecorder.stop();
        this.isRecording = false;

        // Reset UI elements
        const animEl = document.getElementById('cofre-recording-animation');
        if (animEl) animEl.style.display = 'none';
        
        const panel = document.getElementById('cofre-recorder-panel');
        if (panel) panel.style.display = 'none';
    },

    cancelRecording() {
        if (this.isRecording) {
            clearInterval(this.recordingTimer);
            this.mediaRecorder.onstop = null; // No guardar
            this.mediaRecorder.stop();
            this.isRecording = false;
        }
        const panel = document.getElementById('cofre-recorder-panel');
        if (panel) panel.style.display = 'none';
        document.getElementById('cofre-speech-bubble').innerText = "¡Elegimos otro desafío para guardar en mi cofre! 💎";
    },

    saveRecordedAudio(base64Data) {
        try {
            let audios = [];
            const savedAudios = localStorage.getItem('eliu_aprende_recorded_audios');
            if (savedAudios) {
                audios = JSON.parse(savedAudios);
            }

            const now = new Date();
            const dateStr = now.toLocaleDateString('es-CL');
            const timeStr = now.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });

            const newAudio = {
                id: 'audio_' + Date.now(),
                date: dateStr,
                time: timeStr,
                type: this.currentChallengeType,
                label: this.currentChallengeLabel,
                dataUrl: base64Data
            };

            audios.unshift(newAudio);
            localStorage.setItem('eliu_aprende_recorded_audios', JSON.stringify(audios.slice(0, 30))); // Guardar últimos 30 audios

            // Recompensa por grabar un recuerdo
            Gamification.awardStars(20);

            const successGreeting = `¡Espectacular, Eliu! He guardado tu hermosa voz en una gema mágica en mi cofre. ¡Has ganado +20⭐ de premio! 💎✨`;
            document.getElementById('cofre-speech-bubble').innerText = successGreeting;

            SoundManager.play('success');
            
            const mascot = document.getElementById('cofre-mascot-avatar');
            if (mascot) mascot.classList.add('talking');
            VoiceEngine.speak(successGreeting, () => {
                if (mascot) mascot.classList.remove('talking');
            });

            this.loadGems();
            
            // Recargar panel de padres si está abierto
            if (typeof ParentDashboard !== 'undefined' && ParentDashboard.renderCofreAudios) {
                ParentDashboard.renderCofreAudios();
            }

        } catch (e) {
            console.error("Error al guardar audio en localStorage:", e);
            alert("¡Oh no! El cofre se llenó de energía mágica y no pudimos guardarlo. Intenta borrar algunas gemas viejas en la pantalla de abajo o en el área de padres.");
        }
    },

    loadGems() {
        const grid = document.getElementById('cofre-gems-grid');
        if (!grid) return;

        let audios = [];
        const savedAudios = localStorage.getItem('eliu_aprende_recorded_audios');
        if (savedAudios) {
            try { audios = JSON.parse(savedAudios); } catch(e) {}
        }

        if (audios.length === 0) {
            grid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; color: var(--text-muted); padding: 24px; font-weight: 700; font-family: var(--font-kids);">
                    💎 ¡Tu cofre está listo para recibir gemas mágicas! Elige un desafío arriba y graba tu voz...
                </div>
            `;
            return;
        }

        const typeColors = {
            chiste: { bg: 'linear-gradient(135deg, #00f0ff 0%, #0077b6 100%)', emoji: '💬', name: 'Chiste' },
            historia: { bg: 'linear-gradient(135deg, #ff9f1c 0%, #ff6b6b 100%)', emoji: '🐱', name: 'Historia' },
            cancion: { bg: 'linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)', emoji: '🎵', name: 'Canción' },
            imitacion: { bg: 'linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%)', emoji: '🦖', name: 'Imitación' },
            felicidad: { bg: 'linear-gradient(135deg, #e91e63 0%, #c2185b 100%)', emoji: '☀️', name: 'Feliz' }
        };

        grid.innerHTML = audios.map((audio) => {
            const config = typeColors[audio.type] || { bg: 'var(--color-diario)', emoji: '💎', name: 'Recuerdo' };
            return `
                <div class="weekly-day-card btn-interactive" 
                     onclick="CofreManager.playGemAudio('${audio.id}')" 
                     ondblclick="CofreManager.deleteGemConfirm('${audio.id}')"
                     style="background: ${config.bg}; color: white; border: none; padding: 12px; height: 110px; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; cursor: pointer; position: relative;">
                    <span style="font-size: 32px; margin-bottom: 2px;">💎</span>
                    <span style="font-size: 11px; font-weight: 700; opacity: 0.9;">${config.name} (${audio.date})</span>
                    <span style="font-size: 10px; opacity: 0.8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%;">${audio.time} - ${config.emoji}</span>
                    <div style="font-size: 9px; position: absolute; bottom: 4px; left: 0; right: 0; opacity: 0.6; font-weight: 600;">Haz clic para oír 🔊</div>
                </div>
            `;
        }).join('');
    },

    currentPlayingAudio: null,
    playGemAudio(id) {
        SoundManager.play('click');
        let audios = [];
        const savedAudios = localStorage.getItem('eliu_aprende_recorded_audios');
        if (savedAudios) {
            try { audios = JSON.parse(savedAudios); } catch(e) {}
        }

        const audio = audios.find(a => a.id === id);
        if (!audio) return;

        // Detener audio anterior si hay uno sonando
        if (this.currentPlayingAudio) {
            this.currentPlayingAudio.pause();
            this.currentPlayingAudio = null;
        }

        try {
            this.currentPlayingAudio = new Audio(audio.dataUrl);
            this.currentPlayingAudio.play();
            
            // Efecto de boca moviéndose
            const mascot = document.getElementById('cofre-mascot-avatar');
            if (mascot) mascot.classList.add('talking');
            this.currentPlayingAudio.onended = () => {
                if (mascot) mascot.classList.remove('talking');
                this.currentPlayingAudio = null;
            };
        } catch(e) {
            console.error("Error al reproducir audio:", e);
        }
    },

    deleteGemConfirm(id) {
        SoundManager.play('click');
        if (confirm("¿Quieres borrar esta gema de recuerdo del cofre? 💎")) {
            let audios = [];
            const savedAudios = localStorage.getItem('eliu_aprende_recorded_audios');
            if (savedAudios) {
                try { audios = JSON.parse(savedAudios); } catch(e) {}
            }

            audios = audios.filter(a => a.id !== id);
            localStorage.setItem('eliu_aprende_recorded_audios', JSON.stringify(audios));
            
            SoundManager.play('wrong');
            this.loadGems();
            
            // Recargar panel de padres si está abierto
            if (typeof ParentDashboard !== 'undefined' && ParentDashboard.renderCofreAudios) {
                ParentDashboard.renderCofreAudios();
            }
        }
    }
};

// Cargar aplicación al terminar de cargar el DOM
window.addEventListener('DOMContentLoaded', () => {
    // Chequear si se completaron hábitos hoy
    const todayStr = new Date().toISOString().split('T')[0];
    const lastHabitsDate = localStorage.getItem('eliu_aprende_habitos_fecha');
    
    App.init();

    if (lastHabitsDate !== todayStr) {
        HabitsManager.startCheckin();
    } else {
        App.showView('kids-dashboard-view');
    }
});
