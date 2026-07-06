/* ==========================================================================
   LÓGICA PRINCIPAL, RUTA, GAMIFICACIÓN Y VOZ DE ELIUBOT
   Módulo: js/app.js
   Manejo de sonido sintético, voz interactiva y simulación de videollamada.
   ========================================================================== */

const Fase1API = {
    async init() {
        if (typeof supabaseClient === 'undefined') return;
        // Generar repasos automáticos de OAs en riesgo de olvido (no bloquea si falla)
        try {
            if (typeof USER_ID !== 'undefined') {
                await supabaseClient.rpc('generar_repasos_pendientes', { p_user: USER_ID });
            }
        } catch (e) { console.warn('No se generaron repasos automáticos:', e); }
        await this.renderMisiones();
        await this.renderStats();
        await this.renderMiProgreso();
        try { CalendarSystem.render(); CalendarSystem.cargarActividad(); } catch (e) { console.warn('Calendario:', e); }
        try { if (typeof ParentDashboard !== 'undefined') ParentDashboard.cargarPaginas(); } catch (e) { console.warn('Páginas:', e); }
        try { if (typeof EliubotVoz !== 'undefined' && !EliubotVoz.soportado()) { const bv = document.getElementById('btn-voz-eliubot'); if (bv) bv.style.display = 'none'; } } catch (e) {}
    },

    // 🌟 Panel motivador para Eliú: cuánto lleva aprendido + gráfico de cómo va
    async renderMiProgreso() {
        const cont = document.getElementById('mi-progreso-container');
        if (!cont || typeof supabaseClient === 'undefined') return;
        try {
            const { data, error } = await supabaseClient
                .from('vista_panel_padres')
                .select('estado')
                .eq('user_id', USER_ID);
            if (error || !data) { cont.innerHTML = ''; return; }

            const total = data.length || 27;
            const consolidados = data.filter(r => r.estado === 'consolidado').length;
            const enProgreso = data.filter(r => r.estado === 'en_progreso' || r.estado === 'debil').length;
            const estrellas = '⭐'.repeat(Math.min(consolidados, 10)) || '☆';

            let animo;
            if (consolidados === 0 && enProgreso === 0) animo = '¡Empieza tu primera misión y gana tu primera estrella! 🚀';
            else if (consolidados < 5) animo = '¡Buen comienzo! Cada tema que aprendes te hace más fuerte 💪';
            else if (consolidados < 14) animo = '¡Vas increíble! Ya dominas varios temas 🌟';
            else if (consolidados < 27) animo = '¡Eres una súper estrella! Casi todos los temas dominados 🏆';
            else animo = '¡INCREÍBLE! ¡Dominaste TODOS los temas! 🎉👑';

            const restantes = Math.max(0, total - consolidados);
            const pctCamino = Math.round((consolidados / total) * 100);

            // Medallas: una cada 5 temas dominados
            const medallas = Math.floor(consolidados / 5);
            const faltanMedalla = 5 - (consolidados % 5);

            // Porras de Eliubot que cambian en cada visita (dinámico)
            const cheers = [
                '¡Tú puedes con todo, Eliú! 💪',
                '¡Cada misión te hace más campeón! 🏆',
                '¡Me encanta aprender contigo! 🤖💙',
                '¡Eres rapidísimo aprendiendo! ⚡',
                '¡Vamos por el tesoro juntos! 🗺️',
                '¡Qué orgulloso estoy de ti! 🌟',
                '¡Sigue así, pequeño crack! 🚀'
            ];
            const cheer = cheers[Math.floor(Math.random() * cheers.length)];
            const posEliubot = Math.max(2, Math.min(92, pctCamino));

            cont.innerHTML = `
                <p style="font-size:15px; color:#475569; margin-bottom:12px; font-weight:600;">${animo}</p>

                <!-- Camino al trofeo -->
                <div style="font-size:12px; color:#7c3aed; font-weight:800; margin-bottom:4px;">🗺️ Tu camino al trofeo</div>
                <div style="position:relative; background:#ede9fe; border-radius:999px; height:34px; margin-bottom:6px; overflow:hidden;">
                    <div style="position:absolute; left:0; top:0; bottom:0; width:${pctCamino}%; background:linear-gradient(90deg,#a78bfa,#7c3aed); border-radius:999px; transition:width .8s ease;"></div>
                    <div style="position:absolute; left:calc(${posEliubot}% - 12px); top:50%; transform:translateY(-50%); font-size:24px;">🤖</div>
                    <div style="position:absolute; right:6px; top:50%; transform:translateY(-50%); font-size:22px;">🏆</div>
                </div>
                <div style="text-align:center; font-size:13px; color:#7c3aed; font-weight:800; margin-bottom:14px;">¡Llevas ${pctCamino}% del camino!</div>

                <!-- Chips motivadores -->
                <div style="display:flex; gap:10px; flex-wrap:wrap; margin-bottom:12px;">
                    <div style="flex:1; min-width:130px; background:#f5f3ff; border-radius:14px; padding:12px; text-align:center;">
                        <div style="font-size:28px; font-weight:800; color:#7c3aed;">${consolidados} 🌟</div>
                        <div style="font-size:12px; color:#7c3aed; font-weight:700;">temas dominados</div>
                    </div>
                    <div style="flex:1; min-width:130px; background:#ecfdf5; border-radius:14px; padding:12px; text-align:center;">
                        <div style="font-size:${restantes > 0 ? '28' : '22'}px; font-weight:800; color:#059669;">${restantes > 0 ? ('faltan ' + restantes) : '¡CAMPEÓN! 👑'}</div>
                        <div style="font-size:12px; color:#059669; font-weight:700;">${restantes > 0 ? 'para ser campeón 🏆' : 'dominaste todo'}</div>
                    </div>
                </div>

                <div style="font-size:26px; text-align:center; margin-bottom:10px; letter-spacing:1px;">${estrellas}</div>

                <!-- Próxima medalla -->
                <div style="background:#fffbeb; border:2px solid #fde68a; border-radius:14px; padding:10px; text-align:center; margin-bottom:10px;">
                    <div style="font-size:14px; color:#b45309; font-weight:800;">${restantes > 0 ? `🏅 ¡Domina ${faltanMedalla} tema${faltanMedalla > 1 ? 's' : ''} más y ganas otra medalla!` : '🏅 ¡Ganaste todas las medallas!'}</div>
                    ${medallas > 0 ? `<div style="font-size:22px; margin-top:4px;">${'🏅'.repeat(Math.min(medallas, 7))}</div>` : ''}
                </div>

                <!-- Porra dinámica de Eliubot -->
                <div style="display:flex; align-items:center; gap:10px; background:#eef2ff; border-radius:14px; padding:11px;">
                    <span style="font-size:26px;">🤖</span>
                    <span style="font-size:14px; color:#4338ca; font-weight:700;">${cheer}</span>
                </div>`;
        } catch (e) {
            console.warn('renderMiProgreso:', e);
            cont.innerHTML = '';
        }
    },

    async renderMisiones() {
        const { data: cola, error } = await supabaseClient
            .from('cola_hoy')
            .select('*')
            .eq('user_id', USER_ID);
            
        if (error || !cola) return;
        
        const container = document.getElementById('misiones-lista');
        if (!container) return;
        
        const hoyStr = new Date().toISOString().split('T')[0];
        const MAX_ATRASADOS = 3;   // no abrumar al niño con un muro de pendientes

        const tarjeta = (item) => `
            <div class="card" style="padding: 16px; display: flex; flex-direction: column; gap: 8px;">
                <div style="font-weight: 700; font-size: 18px;">📘 ${item.titulo || item.oa_titulo || item.oa_codigo}</div>
                <div style="font-size: 12px; color: var(--text-muted);">${item.oa_codigo} · ${item.oa_titulo || ''}</div>
                <div style="font-size: 14px; color: var(--text-muted);">Páginas ${item.paginas_libro || 'N/A'} · ${item.duracion_estimada || 20} min</div>
                ${(Fase1API._pendienteMaterial && Fase1API._pendienteMaterial[item.oa_codigo]) ? '<div style="font-size:13px; color:#b45309; background:#fffbeb; border:1px solid #fde68a; border-radius:8px; padding:6px 10px;">✅ ¡Actividad hecha! Toca 📺 Material de apoyo para terminar la misión.</div>' : ''}
                <div style="display: flex; gap: 8px; margin-top: 8px;">
                    <button class="btn-activity-submit" onclick="Fase1API.empezarMision('${item.id}', '${item.oa_codigo}')" style="flex: 1; padding: 10px; font-size: 14px; border: none; border-radius: 8px; background: #2ecc71; color: white; font-weight: bold; cursor: pointer;">▶ Empezar misión</button>
                    <button class="btn-canvas" onclick="Fase1API.verMaterial('${item.oa_codigo}')" style="flex: 1; padding: 10px; font-size: 14px; border: none; border-radius: 8px; background: #3498db; color: white; font-weight: bold; cursor: pointer;">📺 Material de apoyo</button>
                </div>
            </div>`;

        let html = '';

        if (!cola.length) {
            html = `<div style="background:#dcfce7; color:#166534; padding:16px; border-radius:12px; font-size:15px;">🎉 ¡Estás al día! No tienes actividades pendientes.</div>`;
            container.innerHTML = html;
            return;
        }

        // BLOQUEO POR DÍA: la materia no hecha bloquea el día siguiente.
        // cola viene ordenada por fecha ASC -> el primer día pendiente es el más antiguo.
        const diaPendiente = cola[0].fecha_programada;
        const delDia = cola.filter(i => i.fecha_programada === diaPendiente);
        const hayDiasSiguientes = cola.some(i => i.fecha_programada !== diaPendiente);

        if (diaPendiente >= hoyStr) {
            html += `<h3 style="color: #0077b6; font-size: 16px; margin-top: 4px;">🟦 PARA HOY</h3>`;
        } else {
            const diff = Math.round((new Date(hoyStr) - new Date(diaPendiente)) / 86400000);
            html += `<h3 style="color: #d90429; font-size: 16px; margin-top: 4px;">📌 Primero termina este día (${diaPendiente}, hace ${diff} día${diff===1?'':'s'})</h3>
                <p style="font-size:13px; color:#9a3412; background:#fff7ed; border:1px solid #fed7aa; border-radius:10px; padding:10px; margin:6px 0;">
                Hay que completar la materia de este día antes de seguir con lo nuevo. Así Eliú no se salta nada importante 💪</p>`;
        }

        delDia.forEach(item => { html += tarjeta(item); });

        if (hayDiasSiguientes) {
            html += `<div style="background:#f1f5f9; border:1px dashed #94a3b8; color:#475569; border-radius:10px; padding:12px; font-size:14px; margin-top:10px; text-align:center;">
                🔒 Cuando completes <b>todo este día</b>, se desbloquea el siguiente.</div>`;
        }

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

    _pendienteMaterial: {},   // oa -> planId: misiones cuya actividad ya se hizo, pero falta ver el Material de apoyo

    materialVisto(oa) {
        try { return (JSON.parse(localStorage.getItem('eliu_material_visto') || '[]')).indexOf(oa) !== -1; } catch (e) { return false; }
    },
    marcarMaterialVisto(oa) {
        try {
            const arr = JSON.parse(localStorage.getItem('eliu_material_visto') || '[]');
            if (arr.indexOf(oa) === -1) { arr.push(oa); localStorage.setItem('eliu_material_visto', JSON.stringify(arr)); }
        } catch (e) {}
    },
    async completarMisionPendiente(oa) {
        const planId = this._pendienteMaterial[oa];
        if (!planId || typeof supabaseClient === 'undefined') return;
        try {
            await supabaseClient.from('plan_estudio')
                .update({ estado: 'completado', fecha_completada: new Date().toISOString() })
                .eq('id', planId);
        } catch (e) { console.error('completar pendiente:', e); }
        delete this._pendienteMaterial[oa];
        try { this.renderMisiones(); this.renderStats(); this.renderMiProgreso(); } catch (e) {}
    },

    async verMaterial(oaCodigo) {
        // Al abrir el material: marcarlo como visto y, si la actividad ya estaba hecha, terminar la misión ahora
        this.marcarMaterialVisto(oaCodigo);
        this.completarMisionPendiente(oaCodigo);

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
// 📅 CALENDARIO MENSUAL: avanza con los días, muestra hoy, feriados y el examen
const CalendarSystem = {
    offsetMes: 0,
    feriados: {
        '2026-01-01': 'Año Nuevo', '2026-04-03': 'Viernes Santo', '2026-04-04': 'Sábado Santo',
        '2026-05-01': 'Día del Trabajo', '2026-05-21': 'Glorias Navales',
        '2026-06-20': 'Pueblos Indígenas', '2026-06-29': 'San Pedro y San Pablo',
        '2026-07-16': 'Virgen del Carmen', '2026-08-15': 'Asunción',
        '2026-09-18': 'Fiestas Patrias', '2026-09-19': 'Glorias del Ejército',
        '2026-10-12': 'Encuentro 2 Mundos', '2026-10-31': 'Iglesias Evangélicas',
        '2026-11-01': 'Todos los Santos', '2026-12-08': 'Inmaculada Concepción', '2026-12-25': 'Navidad'
    },
    examen: '2026-10-15',
    diasActivos: {},
    rachaActual: 0,

    ymd(d) {
        return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
    },

    // Trae los días en que Eliú realmente estudió (sesiones + módulos completados + tests)
    async cargarActividad() {
        if (typeof supabaseClient === 'undefined') return;
        try {
            const { data, error } = await supabaseClient.rpc('dias_actividad', { p_desde: '2026-05-01', p_hasta: this.ymd(new Date()) });
            if (error) throw error;
            const mapa = {};
            (data || []).forEach(r => { mapa[r.dia] = Number(r.actividades) || 0; });
            this.diasActivos = mapa;
            this.computarRacha();
            this.render();
        } catch (e) { console.warn('dias_actividad:', e); }
    },

    // Racha = días seguidos con actividad terminando hoy (o ayer si hoy aún no estudia)
    computarRacha() {
        const hoy = new Date();
        let cursor = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
        if (!this.diasActivos[this.ymd(cursor)]) cursor.setDate(cursor.getDate() - 1);
        let streak = 0;
        while (this.diasActivos[this.ymd(cursor)]) { streak++; cursor.setDate(cursor.getDate() - 1); }
        this.rachaActual = streak;
    },

    render() {
        const cont = document.getElementById('calendario-mes');
        if (!cont) return;
        // Auto-carga la actividad la primera vez que se dibuja (robusto ante el orden de init)
        if (!this._cargado && typeof supabaseClient !== 'undefined') { this._cargado = true; this.cargarActividad(); }
        const hoy = new Date();
        const hoyStr = this.ymd(hoy);
        const meses = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];

        // Datos útiles del mes en curso
        let activosMes = 0, modulosMes = 0, ultimo = null;
        Object.keys(this.diasActivos).forEach(k => {
            const dt = new Date(k + 'T00:00:00');
            if (dt.getFullYear() === hoy.getFullYear() && dt.getMonth() === hoy.getMonth()) {
                activosMes++; modulosMes += this.diasActivos[k];
            }
            if (!ultimo || k > ultimo) ultimo = k;
        });
        const haceDias = ultimo ? Math.round((new Date(hoyStr) - new Date(ultimo)) / 86400000) : null;
        const diffExam = Math.ceil((new Date(this.examen) - hoy) / 86400000);
        const estudioHoy = this.diasActivos[hoyStr] > 0;

        // Mini-mapa: últimas 4 semanas, alineado de lunes a domingo
        let wd = hoy.getDay(); wd = (wd === 0) ? 6 : wd - 1;
        const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - wd - 21);
        let celdas = '';
        for (let k = 0; k < 28; k++) {
            const dt = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + k);
            const fstr = this.ymd(dt);
            const cnt = this.diasActivos[fstr] || 0;
            const esHoy = fstr === hoyStr;
            const futuro = fstr > hoyStr;
            let bg = '#e9edf2';
            if (futuro) bg = '#f8fafc';
            else if (cnt >= 6) bg = '#16a34a';
            else if (cnt >= 3) bg = '#4ade80';
            else if (cnt >= 1) bg = '#bbf7d0';
            const color = (cnt >= 3 && !futuro) ? '#ffffff' : '#94a3b8';
            const borde = esHoy ? '2px solid #2563eb' : '1px solid rgba(0,0,0,0.05)';
            const tip = futuro ? '' : (cnt > 0 ? ('Estudió: ' + cnt + ' actividades') : 'No estudió');
            celdas += `<div title="${tip}" style="aspect-ratio:1; display:flex; align-items:center; justify-content:center; border-radius:6px; font-size:10px; font-weight:700; background:${bg}; color:${color}; border:${borde};">${dt.getDate()}</div>`;
        }

        const estadoChip = estudioHoy
            ? `<span style="background:#dcfce7; color:#166534; font-weight:800; font-size:12px; padding:5px 11px; border-radius:999px;">✅ Hoy estudió</span>`
            : (haceDias !== null
                ? `<span style="background:#fef3c7; color:#b45309; font-weight:800; font-size:12px; padding:5px 11px; border-radius:999px;">⚠️ ${haceDias} ${haceDias === 1 ? 'día' : 'días'} sin estudiar</span>`
                : '');

        cont.innerHTML = `
            <strong style="font-size:15px; color:#1e293b; display:block; margin-bottom:10px;">📊 Actividad de Eliú</strong>
            <div style="display:flex; gap:7px; flex-wrap:wrap; margin-bottom:12px;">
                <span style="background:#dbeafe; color:#1e40af; font-weight:800; font-size:12px; padding:5px 11px; border-radius:999px;">✅ ${activosMes} días en ${meses[hoy.getMonth()]}</span>
                <span style="background:#ffedd5; color:#c2410c; font-weight:800; font-size:12px; padding:5px 11px; border-radius:999px;">🔥 Racha ${this.rachaActual}</span>
                <span style="background:#f3e8ff; color:#7c3aed; font-weight:800; font-size:12px; padding:5px 11px; border-radius:999px;">⏳ Examen en ${diffExam} días</span>
                ${estadoChip}
            </div>
            <div style="font-size:11px; color:#94a3b8; font-weight:700; margin-bottom:5px;">Últimas 4 semanas (verde = estudió)</div>
            <div style="display:grid; grid-template-columns:repeat(7,1fr); gap:4px; text-align:center; font-size:9px; color:#cbd5e1; font-weight:700; margin-bottom:3px;">
                <div>L</div><div>M</div><div>M</div><div>J</div><div>V</div><div>S</div><div>D</div>
            </div>
            <div style="display:grid; grid-template-columns:repeat(7,1fr); gap:4px;">${celdas}</div>
            <div style="display:flex; gap:10px; justify-content:center; margin-top:9px; font-size:10px; color:#94a3b8; flex-wrap:wrap;">
                <span><span style="display:inline-block; width:9px; height:9px; background:#e9edf2; border-radius:2px; vertical-align:middle;"></span> no estudió</span>
                <span><span style="display:inline-block; width:9px; height:9px; background:#16a34a; border-radius:2px; vertical-align:middle;"></span> estudió</span>
                <span><span style="display:inline-block; width:9px; height:9px; border:2px solid #2563eb; border-radius:2px; vertical-align:middle;"></span> hoy</span>
            </div>`;
    }
};

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
        await this._cargar('generar_simulacro', { p_limit: 20, p_user: USER_ID }, 'simulacro', 90 * 60, '📝 SIMULACRO MINEDUC');
    },

    // Test por asignatura (8 preguntas, sin cuenta regresiva) para identificar qué repasar
    async iniciarTest(asignatura) {
        const labels = { lenguaje: '📖 Test de Lenguaje', matematica: '🔢 Test de Matemática', ciencias: '🧪 Test de Ciencias', historia: '🗺️ Test de Historia' };
        await this._cargar('preguntas_para_asignatura', { p_asignatura: asignatura, p_user: USER_ID, p_limit: 8 }, 'test', 0, labels[asignatura] || '📝 Test');
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
        this.errores = [];
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

    leerPregunta(q, opciones) {
        if (typeof VoiceEngine === 'undefined') return;
        let texto = q.pregunta + '. ';
        (opciones || []).forEach((op, i) => {
            const letra = ['A', 'B', 'C', 'D'][i] || '';
            texto += 'Opción ' + letra + ': ' + (op.text || '') + '. ';
        });
        VoiceEngine.stop();
        VoiceEngine.speak(texto);
    },

    cerrar() {
        this.detenerTimer();
        if (typeof VoiceEngine !== 'undefined') VoiceEngine.stop();
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
                <div style="display:flex; align-items:flex-start; gap:10px; margin-bottom:16px;">
                    <button id="sim-speak" title="Escuchar la pregunta" style="flex-shrink:0; width:44px; height:44px; border-radius:50%; border:none; background:#3b82f6; color:white; font-size:20px; cursor:pointer;">🔊</button>
                    <div style="font-size:20px; font-weight:700; color:#1e293b;">${q.pregunta}</div>
                </div>
                <div id="sim-opts">${opcionesHtml}</div>
                <div id="sim-feedback" style="margin-top:12px; font-size:15px; min-height:24px;"></div>
                <button id="sim-cancel" style="margin-top:14px; background:none; border:none; color:#94a3b8; font-size:13px; cursor:pointer;">Salir</button>
            </div>`;
        document.body.appendChild(ov);

        // Lectura en voz alta (Eliú tiene 6 años, puede no leer fluido)
        const speakBtn = document.getElementById('sim-speak');
        if (speakBtn) speakBtn.onclick = () => this.leerPregunta(q, opciones);
        // Auto-leer al mostrar la pregunta
        setTimeout(() => this.leerPregunta(q, opciones), 350);

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
            // Guardar el error para mostrarlo al final
            const ops = Array.isArray(q.opciones) ? q.opciones : (q.options || []);
            const correcta = ops.find(o => o.correct === true);
            if (!this.errores) this.errores = [];
            this.errores.push({
                pregunta: q.pregunta,
                eligio: btn.innerText.trim(),
                correcta: correcta ? correcta.text : '—'
            });
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

        // Revisión: en qué preguntas se equivocó (con la respuesta correcta)
        let erroresHtml = '';
        if (this.errores && this.errores.length > 0) {
            erroresHtml = '<div style="margin-top:16px; text-align:left;"><div style="font-weight:700; color:#b45309; margin-bottom:8px;">📋 Revisemos lo que falló:</div>';
            this.errores.forEach(e => {
                erroresHtml += `
                    <div style="background:#fffbeb; border:1px solid #fde68a; border-radius:8px; padding:10px; margin-bottom:8px;">
                        <div style="font-size:13px; font-weight:600; color:#1e293b; margin-bottom:4px;">${e.pregunta}</div>
                        <div style="font-size:12px; color:#dc2626;">Marcó: ${e.eligio}</div>
                        <div style="font-size:12px; color:#16a34a;">✅ Correcta: ${e.correcta}</div>
                    </div>`;
            });
            erroresHtml += '</div>';
        }

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
                ${erroresHtml}
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
        const rate = savedSpeed ? parseFloat(savedSpeed) : 1.0;   // Normal (1.00x) por defecto
        
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
            // Priorizar la voz de Google español de EE.UU. (es-US) que eligió Casandra, luego cualquier Google español
            selectedVoice = voices.find(v => v.lang === 'es-US' && v.name.includes('Google')) ||
                            voices.find(v => v.lang.startsWith('es') && v.name.includes('Google')) ||
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
            emoji: "🤖🚀",
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
            emoji: "🌺🌿",
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
        },
        {
            title: "Las alas de Ana",
            emoji: "🐦☁️",
            text: "Ana ve un ave en el cielo. El ave tiene dos alas. Con sus alas, el ave vuela muy alto. ¡A Ana le gusta ver volar a las aves!",
            questions: [
                {
                    prompt: "¿Qué tiene el ave para volar?",
                    options: [
                        { text: "Patas largas", correct: false },
                        { text: "Dos alas ¡Correcto!", correct: true },
                        { text: "Aletas", correct: false }
                    ],
                    synonymsExplain: "¡Muy bien, Eliu! Las aves vuelan porque tienen alas. (Leo Primero: ¡Podemos volar!)"
                }
            ]
        },
        {
            title: "Un día en el mar",
            emoji: "🌊🐟",
            text: "Eliú va al mar con su mamá. En el mar hay olas y peces. Un pez chico nada feliz. Eliú toca el agua y se ríe. ¡El mar es lindo!",
            questions: [
                {
                    prompt: "¿Qué animal nada en el mar?",
                    options: [
                        { text: "Un gato", correct: false },
                        { text: "Un pez ¡Eso es!", correct: true },
                        { text: "Una vaca", correct: false }
                    ],
                    synonymsExplain: "¡Súper, Eliu! El pez vive y nada en el mar. (Leo Primero: ¡Vamos al mar!)"
                }
            ]
        },
        {
            title: "La fiesta de colores",
            emoji: "🎨🌈",
            text: "Hoy es la fiesta de colores. Sofía pinta una flor roja. Beto pinta un sol amarillo. Todos pintan y se divierten. ¡Qué fiesta tan bonita!",
            questions: [
                {
                    prompt: "¿De qué color pinta Sofía la flor?",
                    options: [
                        { text: "Azul", correct: false },
                        { text: "Roja ¡Correcto!", correct: true },
                        { text: "Verde", correct: false }
                    ],
                    synonymsExplain: "¡Genial, Eliu! Sofía pinta la flor de color rojo. (Leo Primero: Fiesta de colores)"
                }
            ]
        },
        {
            title: "Saltan, saltan",
            emoji: "🐸🐰",
            text: "El sapo salta en el charco. El conejo salta en el pasto. La rana salta muy alto. ¡Todos saltan y saltan sin parar!",
            questions: [
                {
                    prompt: "¿Cuál de estos animales salta?",
                    options: [
                        { text: "El conejo ¡Sí!", correct: true },
                        { text: "El pez", correct: false },
                        { text: "El caracol", correct: false }
                    ],
                    synonymsExplain: "¡Muy bien, Eliu! El conejo, el sapo y la rana saltan. (Leo Primero: ¿Quiénes saltan?)"
                }
            ]
        },
        {
            title: "Mi hogar",
            emoji: "🏠❤️",
            text: "Cada familia tiene su hogar. Hay casas de madera y casas de ladrillo. En mi hogar vivo con mi familia. Mi hogar es un lugar para querernos y cuidarnos.",
            questions: [
                {
                    prompt: "¿Para qué nos sirve nuestro hogar?",
                    options: [
                        { text: "Para volar", correct: false },
                        { text: "Para vivir y cuidarnos ¡Correcto!", correct: true },
                        { text: "Para nadar", correct: false }
                    ],
                    synonymsExplain: "¡Hermoso, Eliu! En el hogar vivimos y nos cuidamos con la familia. (Leo Primero: ¡Te muestro mi hogar!)"
                }
            ]
        },
        {
            title: "El cóndor de los Andes",
            emoji: "🦅🏔️",
            text: "El cóndor es un ave muy grande de Chile. Vive en la cordillera de los Andes. El cóndor abre sus enormes alas y vuela alto. ¡Es el ave más grande que vuela!",
            questions: [
                {
                    prompt: "¿Dónde vive el cóndor?",
                    options: [
                        { text: "En el mar", correct: false },
                        { text: "En la cordillera de los Andes ¡Eso!", correct: true },
                        { text: "En la ciudad", correct: false }
                    ],
                    synonymsExplain: "¡Excelente, Eliu! El cóndor vive en la cordillera de los Andes, en Chile. (Leo Primero: Animales sorprendentes)"
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
            
            const ilustracion = story.emoji ? `<div style="font-size:64px; text-align:center; margin-bottom:14px;">${story.emoji}</div>` : '';
            storyBox.innerHTML = ilustracion + `<div style="font-size:22px; font-weight:700; text-align:center; color:#1e293b; margin-bottom:10px;">${story.title}</div>` +
                this.words.map(w => {
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
        const sb = document.getElementById('btn-start-reading-practice');
        sb.style.display = 'block'; sb.innerText = '🔊 Escuchar el cuento';
        document.getElementById('btn-next-story-step').style.display = 'none';
        document.getElementById('reading-mic-indicator').style.display = 'none';
        const viejoLeoYo = document.getElementById('btn-leo-yo');
        if (viejoLeoYo) viejoLeoYo.remove();

        const speechBubble = document.getElementById('reading-speech-bubble');
        speechBubble.innerText = `¡Hola Eliu! Toca "Escuchar el cuento" y fíjate en las palabras que se van pintando. ¡Luego puedes leerlo tú! 🤖`;
        
        App.showView('reading-view');
        
        setTimeout(() => {
            VoiceEngine.speak(speechBubble.innerText);
        }, 400);
    },

    slowReadingActive: false,
    _karaokeTimer: null,

    startReading() {
        try { SoundManager.play('click'); } catch (e) {}
        this.detenerKaraoke();
        const startBtn = document.getElementById('btn-start-reading-practice');
        if (startBtn) startBtn.style.display = 'none';
        // Limpiar resaltados previos
        this.words.forEach(w => { const el = document.getElementById(w.id); if (el) el.className = 'reading-word'; });
        this.leerCuentoKaraoke();
    },

    detenerKaraoke() {
        this.slowReadingActive = false;
        if (this._karaokeTimer) { clearTimeout(this._karaokeTimer); this._karaokeTimer = null; }
        try { if (typeof VoiceEngine !== 'undefined') VoiceEngine.stop(); } catch (e) {}
    },

    // KARAOKE: resalta palabra por palabra con tiempo fijo. Avanza aunque el audio
    // esté bloqueado (no depende del callback de TTS, que en tablets puede no dispararse).
    leerCuentoKaraoke() {
        this.detenerKaraoke();
        this.slowReadingActive = true;
        const bubble = document.getElementById('reading-speech-bubble');
        if (bubble) bubble.innerText = 'Sigue las palabras que se van pintando 👀✨';
        let i = 0;
        const self = this;
        const paso = () => {
            const rv = document.getElementById('reading-view');
            const visible = rv && rv.classList.contains('active');
            if (!self.slowReadingActive || !visible) { self.detenerKaraoke(); return; }
            // limpiar anterior
            self.words.forEach(x => { const wel = document.getElementById(x.id); if (wel) wel.classList.remove('word-highlight'); });
            if (i >= self.words.length) { self.slowReadingActive = false; self.finDeLecturaGuiada(); return; }
            const w = self.words[i];
            const el = document.getElementById(w.id);
            if (el) { el.classList.add('word-highlight'); el.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
            // audio best-effort, sin bloquear el avance
            try { if (typeof VoiceEngine !== 'undefined') { VoiceEngine.stop(); VoiceEngine.speak(w.cleanText); } } catch (e) {}
            i++;
            const ms = Math.min(1100, 480 + w.cleanText.length * 65);  // palabras largas duran un poco más
            self._karaokeTimer = setTimeout(paso, ms);
        };
        paso();
    },

    finDeLecturaGuiada() {
        this.words.forEach(x => { const wel = document.getElementById(x.id); if (wel) wel.classList.remove('word-highlight'); });
        const bubble = document.getElementById('reading-speech-bubble');
        if (bubble) bubble.innerText = '¡Muy bien! Ahora puedes leer tú en voz alta para que se marquen las palabras, o pasar a las preguntas 🎉';
        const nextBtn = document.getElementById('btn-next-story-step');
        if (nextBtn) { nextBtn.style.display = 'block'; nextBtn.innerText = '✅ Continuar a las preguntas'; }
        const startBtn = document.getElementById('btn-start-reading-practice');
        if (startBtn) { startBtn.style.display = 'block'; startBtn.innerText = '🔁 Escuchar otra vez'; }
        this.mostrarBotonLeoYo();
        try { if (typeof VoiceEngine !== 'undefined') VoiceEngine.speak('Ahora puedes leer tú en voz alta, o pasar a las preguntas.'); } catch (e) {}
    },

    // Botón para que Eliú lea él y se marquen sus palabras (reconocimiento de voz)
    mostrarBotonLeoYo() {
        const cont = document.getElementById('btn-next-story-step');
        if (!cont || !cont.parentNode) return;
        if (document.getElementById('btn-leo-yo')) return;  // no duplicar
        const soporta = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
        const btn = document.createElement('button');
        btn.id = 'btn-leo-yo';
        btn.innerText = '🎙️ Leo yo (que se marquen mis palabras)';
        btn.style = 'display:block; width:100%; margin:10px 0; padding:14px; font-size:16px; font-weight:bold; border:none; border-radius:12px; background:#8b5cf6; color:white; cursor:pointer;';
        btn.onclick = () => {
            if (!soporta) {
                alert('Este dispositivo no permite escuchar la lectura por micrófono. Igual puedes leer en voz alta y luego tocar "Continuar a las preguntas" 😊');
                return;
            }
            this.detenerKaraoke();
            this.startChildReadingPhase();
        };
        cont.parentNode.insertBefore(btn, cont);
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

        // Actualizar los textos de recomendación de las tarjetas de islas (con guardas anti-null)
        const lblLeng = document.getElementById('lbl-lenguaje-pág') || document.getElementById('lbl-lenguaje-pag');
        if (lblLeng) lblLeng.innerText = `Jugando con los Sonidos: Pág. ${bookPages.jugandoSonidos} • Caligrafía: Pág. ${bookPages.caligrafia}`;
        const lblMate = document.getElementById('lbl-matematica-pág') || document.getElementById('lbl-matematica-pag');
        if (lblMate) lblMate.innerText = `Supermatemáticos 1: Pág. ${bookPages.supermatematicos}`;

        // 📖 Reto didáctico de hoy, según las páginas actuales de los libros (desde app_config)
        const reto = document.getElementById('reto-hoy');
        if (reto) {
            reto.innerHTML = `
                <h3 style="font-size:16px; font-weight:800; margin:0 0 10px; color:#1e293b;">📖 Hoy en tus libros</h3>
                <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); gap:10px;">
                    <div style="background:#eef2ff; border-radius:14px; padding:12px;">
                        <div style="font-weight:800; color:#4338ca;">✍️ Caligrafía · pág ${bookPages.caligrafia}</div>
                        <div style="font-size:12px; color:#475569; margin-top:4px;">Reto: escribe tu nombre con tu mejor letra. ✏️</div>
                    </div>
                    <div style="background:#ecfeff; border-radius:14px; padding:12px;">
                        <div style="font-weight:800; color:#0e7490;">🔢 Supermatemáticos · pág ${bookPages.supermatematicos}</div>
                        <div style="font-size:12px; color:#475569; margin-top:4px;">Reto: resuelve y cuenta en voz alta. 🔊</div>
                    </div>
                    <div style="background:#fff1f2; border-radius:14px; padding:12px;">
                        <div style="font-weight:800; color:#be123c;">🔤 Sonidos · pág ${bookPages.jugandoSonidos}</div>
                        <div style="font-size:12px; color:#475569; margin-top:4px;">Reto: di cada sílaba dando palmas. 👏</div>
                    </div>
                </div>`;
        }
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
// 💬 CHAT DE TEXTO CON ELIUBOT (Gemini). Reemplaza al micrófono: el reconocimiento de voz
// no es confiable en tablets, así que ahora se escribe y Eliubot responde (y lo lee en voz alta).
const EliubotChat = {
    preguntar() {
        const inp = document.getElementById('eliubot-input');
        if (!inp) return;
        const texto = (inp.value || '').trim();
        if (!texto) { inp.focus(); return; }
        inp.value = '';
        const bubble = document.getElementById('tito-speech-bubble');
        if (bubble) { bubble.innerText = 'Pensando... 🤖'; bubble.style.display = 'block'; }
        const mascot = document.getElementById('kids-mascot-avatar');
        if (mascot) mascot.classList.add('talking');
        if (typeof DashboardMicSystem !== 'undefined' && DashboardMicSystem.processAudio) {
            DashboardMicSystem.processAudio(texto);   // misma llamada a Gemini (Edge Function chat-eliubot)
        }
    }
};

// 🎤 HABLAR CON ELIUBOT POR VOZ — un solo toque. Pensado para un niño de 6 que aún no escribe.
// Escucha, convierte la voz en texto (Web Speech API, funciona en Chrome Android) y envía solo a Gemini.
const EliubotVoz = {
    rec: null,
    escuchando: false,
    finalText: '',
    _watchdog: null,

    soportado() { return !!(window.SpeechRecognition || window.webkitSpeechRecognition); },

    toggle() {
        if (this.escuchando) { this.stop(); return; }
        const Speech = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!Speech) { this._bubble('Para hablar, abre la app en Chrome 😊 Mientras tanto, puedes escribir.'); return; }
        const r = new Speech();
        r.lang = 'es-CL';
        r.continuous = false;
        r.interimResults = true;
        r.maxAlternatives = 1;
        this.rec = r;
        this.finalText = '';
        r.onresult = (e) => {
            let txt = '';
            for (let i = 0; i < e.results.length; i++) txt += e.results[i][0].transcript;
            this.finalText = txt;
            this._bubble('Te escucho: “' + txt + '”');
        };
        r.onerror = (ev) => {
            this._fin();
            this._bubble(ev && ev.error === 'not-allowed'
                ? 'Necesito tu permiso para el micrófono 🎤 Acéptalo y vuelve a tocar.'
                : 'No te escuché bien, toca y dime otra vez 🎤');
        };
        r.onend = () => {
            this._fin();
            const t = (this.finalText || '').trim();
            if (t) this._enviar(t);
        };
        try {
            r.start(); this.escuchando = true; this._ui(true); this._bubble('¡Te escucho! Habla ahora 🎤');
            var self = this;
            this._watchdog = setTimeout(function () {
                if (self.escuchando) {
                    self.stop(); self._fin();
                    if (!(self.finalText || '').trim()) self._bubble('No te escuché bien 🎤 Toca otra vez y habla fuerte, o escríbeme abajo ✍️');
                }
            }, 8000);
        }
        catch (e) { this._fin(); this._bubble('No pude usar el micrófono. Escríbeme abajo ✍️'); }
    },

    stop() { try { if (this.rec) this.rec.stop(); } catch (e) {} },

    _enviar(texto) {
        this._bubble('Pensando... 🤖');
        const mascot = document.getElementById('kids-mascot-avatar');
        if (mascot) mascot.classList.add('talking');
        if (typeof DashboardMicSystem !== 'undefined' && DashboardMicSystem.processAudio) {
            DashboardMicSystem.processAudio(texto);   // misma llamada a Gemini + lectura en voz alta
        }
    },

    _fin() { this.escuchando = false; this._ui(false); if (this._watchdog) { clearTimeout(this._watchdog); this._watchdog = null; } },

    _ui(on) {
        const b = document.getElementById('btn-voz-eliubot');
        if (b) { b.innerText = on ? '⏹️ Detener' : '🎤 Hablar con Eliubot'; b.style.background = on ? 'linear-gradient(135deg,#ef4444 0%,#b91c1c 100%)' : 'linear-gradient(135deg,#f59e0b 0%,#d97706 100%)'; }
    },

    _bubble(msg) {
        const b = document.getElementById('tito-speech-bubble');
        if (b) { b.innerText = msg; b.style.display = 'block'; }
    }
};

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
        const fallar = (msg) => {
            if (bubble) { bubble.innerText = msg; bubble.style.display = 'block'; }
            if (mascot) mascot.classList.remove('talking');
            try { VoiceEngine.speak(msg); } catch (e) {}
        };

        try {
            const invokeP = supabaseClient.functions.invoke('chat-eliubot', {
                body: {
                    mensaje: childTranscript,
                    historial: this.chatHistory ? this.chatHistory.slice(-6) : [],
                    contexto_oa: (App.currentLesson && App.currentLesson.oa_codigo) || null
                }
            });
            // Timeout: si no responde en 18s, no dejamos el globo pegado en "Pensando..."
            const timeoutP = new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 18000));
            const res = await Promise.race([invokeP, timeoutP]);
            const data = res && res.data;
            const error = res && res.error;

            if (error) throw error;

            if (data && data.text) {
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

                if (typeof ConversationsLogger !== 'undefined') {
                    ConversationsLogger.log("Conversación AI", childTranscript, data.text);
                }
            } else {
                fallar("Eliubot está pensando... intenta otra vez en un momentito 🤖");
            }
        } catch (e) {
            console.error("Error llamando a Eliubot:", e);
            fallar("No pude conectarme. Revisa el wifi y vuelve a intentar 📶");
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
        const reinforcementText = `¡Súper Eliu! Qué gran trabajo en tu misión de ${activityName}. 🧱🏆 Escríbeme en el cuadro de arriba y cuéntame, ¿qué te gustó más de lo que aprendiste hoy?`;
        
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
        const greeting = `¡Hola Eliu! Escríbeme tu pregunta en el cuadro y te respondo. ¡Marshall, Chase y yo estamos listos para conversar de valores, sumas o Roblox! 🤖💬`;
        
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

// 🌎 ISLA DE IDIOMAS — módulo autónomo (no depende de Supabase). Inglés y Chino mandarín.
// Pensado para un niño de 6: tocar para escuchar + canciones en YouTube. Sin micrófono ni datos externos.
const LanguageLab = {
    DATA: {
        ingles: {
            titulo: '🇬🇧 Isla del Inglés', badge: 'English', color: '#2563eb', light: '#dbeafe', ttsLang: 'en-US',
            intro: '¡Toca una palabra para escucharla! 🔊  Y mira las canciones 🎵',
            canciones: [
                { t: '👋 Saludos (Hello)', q: 'Super Simple Songs Hello' },
                { t: '🔤 El Abecedario (ABC)', q: 'Super Simple Songs ABC alphabet' },
                { t: '🔢 Números (Numbers)', q: 'Super Simple Songs numbers count to ten' },
                { t: '🎨 Colores (Colors)', q: 'Super Simple Songs colors song' },
                { t: '🐶 Animales (Animals)', q: 'Super Simple Songs animal sounds song' },
                { t: '👨‍👩‍👧 Familia (Family)', q: 'Super Simple Songs finger family song' },
                { t: '🧍 Mi cuerpo (Body)', q: 'Super Simple Songs head shoulders knees and toes' },
                { t: '🍎 Comida (Food)', q: 'Super Simple Songs do you like food song' },
                { t: '☀️ El clima (Weather)', q: 'Super Simple Songs how is the weather song' }
            ],
            grupos: [
                { nombre: '👋 Saludos', items: [
                    ['Hello','Hola','👋'],['Goodbye','Adiós','✋'],['Thank you','Gracias','🙏'],
                    ['Please','Por favor','🥺'],['Yes','Sí','✅'],['No','No','❌'] ] },
                { nombre: '🔢 Números', items: [
                    ['One','Uno','1️⃣'],['Two','Dos','2️⃣'],['Three','Tres','3️⃣'],
                    ['Four','Cuatro','4️⃣'],['Five','Cinco','5️⃣'],['Ten','Diez','🔟'] ] },
                { nombre: '🎨 Colores', items: [
                    ['Red','Rojo','🔴'],['Blue','Azul','🔵'],['Green','Verde','🟢'],['Yellow','Amarillo','🟡'] ] },
                { nombre: '🐶 Animales', items: [
                    ['Dog','Perro','🐶'],['Cat','Gato','🐱'],['Bird','Pájaro','🐦'],['Fish','Pez','🐟'],['Cow','Vaca','🐮'],['Horse','Caballo','🐴'] ] },
                { nombre: '👨‍👩‍👧 Familia', items: [
                    ['Mom','Mamá','👩'],['Dad','Papá','👨'],['Brother','Hermano','👦'],['Sister','Hermana','👧'],['Grandpa','Abuelo','👴'],['Grandma','Abuela','👵'] ] },
                { nombre: '🧍 Mi cuerpo', items: [
                    ['Head','Cabeza','🙂'],['Hand','Mano','✋'],['Foot','Pie','🦶'],['Eye','Ojo','👁️'],['Ear','Oreja','👂'],['Nose','Nariz','👃'] ] },
                { nombre: '🏫 El colegio', items: [
                    ['Book','Libro','📖'],['Pencil','Lápiz','✏️'],['Bag','Mochila','🎒'],['Chair','Silla','🪑'],['Teacher','Profesor(a)','👩‍🏫'],['Ruler','Regla','📏'] ] },
                { nombre: '🍎 Comida', items: [
                    ['Apple','Manzana','🍎'],['Milk','Leche','🥛'],['Bread','Pan','🍞'],['Water','Agua','💧'],['Banana','Plátano','🍌'],['Egg','Huevo','🥚'] ] },
                { nombre: '🏠 Mi casa', items: [
                    ['House','Casa','🏠'],['Door','Puerta','🚪'],['Window','Ventana','🪟'],['Bed','Cama','🛏️'],['Kitchen','Cocina','🍳'],['Table','Mesa','🍽️'] ] },
                { nombre: '☀️ El clima', items: [
                    ['Sunny','Soleado','☀️'],['Rainy','Lluvioso','🌧️'],['Windy','Ventoso','🌬️'],['Cloudy','Nublado','☁️'],['Hot','Calor','🥵'],['Cold','Frío','🥶'] ] },
                { nombre: '🧸 Juguetes', items: [
                    ['Ball','Pelota','⚽'],['Doll','Muñeca','🪆'],['Car','Auto','🚗'],['Teddy bear','Osito','🧸'],['Kite','Volantín','🪁'],['Blocks','Bloques','🧱'] ] }
            ]
        },
        chino: {
            titulo: '🐉 Isla del Chino', badge: '中文', color: '#dc2626', light: '#fee2e2', ttsLang: 'zh-CN',
            intro: '¡Toca un carácter para oírlo en mandarín! 🔊  (chino · pinyin)',
            canciones: [
                { t: '👋 你好 Hola (Hello)', q: 'Chinese song for kids nihao hello 你好' },
                { t: '🔢 Números 1-10', q: 'Chinese numbers song for kids one to ten' },
                { t: '🎨 Colores', q: 'Chinese colors song for kids' },
                { t: '🐶 Animales', q: 'Chinese animals song for kids' },
                { t: '🎵 Canciones 儿歌', q: 'Chinese nursery rhymes for kids 儿歌' }
            ],
            grupos: [
                { nombre: '👋 Saludos', items: [
                    ['你好','Hola · nǐ hǎo','👋'],['谢谢','Gracias · xièxie','🙏'],
                    ['再见','Adiós · zàijiàn','✋'],['是','Sí · shì','✅'],['不','No · bù','❌'] ] },
                { nombre: '🔢 Números', items: [
                    ['一','1 · yī','1️⃣'],['二','2 · èr','2️⃣'],['三','3 · sān','3️⃣'],
                    ['四','4 · sì','4️⃣'],['五','5 · wǔ','5️⃣'],['十','10 · shí','🔟'] ] },
                { nombre: '🎨 Colores', items: [
                    ['红','Rojo · hóng','🔴'],['蓝','Azul · lán','🔵'],['绿','Verde · lǜ','🟢'],['黄','Amarillo · huáng','🟡'] ] },
                { nombre: '🐶 Animales', items: [
                    ['狗','Perro · gǒu','🐶'],['猫','Gato · māo','🐱'],['鸟','Pájaro · niǎo','🐦'],['鱼','Pez · yú','🐟'] ] }
            ]
        }
    },

    open(lang) {
        const d = this.DATA[lang];
        if (!d) return;
        if (typeof VoiceEngine !== 'undefined') VoiceEngine.stop();

        const card = document.getElementById('language-card');
        const header = document.getElementById('language-header');
        const title = document.getElementById('language-title');
        const badge = document.getElementById('language-badge');
        if (card) card.style.borderColor = d.color;
        if (header) header.style.borderColor = d.color;
        if (title) { title.textContent = d.titulo; title.style.color = d.color; }
        if (badge) { badge.textContent = d.badge; badge.style.background = d.light; badge.style.color = d.color; }

        const cont = document.getElementById('language-content');
        if (cont) cont.innerHTML = this.render(lang, d);

        App.showView('language-view');
    },

    render(lang, d) {
        const canciones = d.canciones.map(c => `
            <button onclick="LanguageLab.abrirCancion('${encodeURIComponent(c.q)}')"
                style="display:flex; align-items:center; gap:10px; width:100%; text-align:left; padding:14px 16px; margin-bottom:8px; border:none; border-radius:14px; background:${d.light}; color:${d.color}; font-size:17px; font-weight:700; cursor:pointer;">
                <span style="font-size:22px;">▶️</span> ${c.t}
            </button>`).join('');

        const grupos = d.grupos.map(g => `
            <h3 style="margin:18px 0 10px; font-size:18px; color:${d.color};">${g.nombre}</h3>
            <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(120px,1fr)); gap:10px;">
                ${g.items.map(it => `
                    <button onclick="LanguageLab.say('${it[0]}','${d.ttsLang}','${it[1]}',this)"
                        style="display:flex; flex-direction:column; align-items:center; gap:4px; padding:14px 8px; border:2px solid ${d.light}; border-radius:16px; background:white; cursor:pointer; transition:transform .12s ease;">
                        <span style="font-size:30px;">${it[2]}</span>
                        <span style="font-size:${lang === 'chino' ? '28' : '18'}px; font-weight:800; color:#1e293b;">${it[0]}</span>
                        <span style="font-size:12px; color:#64748b;">${it[1]}</span>
                        <span style="font-size:13px;">🔊</span>
                    </button>`).join('')}
            </div>`).join('');

        return `
            <p style="font-size:15px; color:#475569; margin-bottom:14px;">${d.intro}</p>
            <h3 style="margin:6px 0 10px; font-size:18px; color:${d.color};">🎵 Canciones</h3>
            ${canciones}
            ${grupos}
            <p style="font-size:12px; color:#94a3b8; margin-top:18px; text-align:center;">Hecho con cariño para que Agus aprenda jugando 💛</p>`;
    },

    abrirCancion(q) {
        window.open('https://www.youtube.com/results?search_query=' + q, '_blank');
    },

    say(text, lang, alt, el) {
        try {
            if (!('speechSynthesis' in window)) return;
            if (el) { el.style.transform = 'scale(1.08)'; setTimeout(() => { el.style.transform = 'scale(1)'; }, 250); }
            window.speechSynthesis.cancel();
            const voices = window.speechSynthesis.getVoices() || [];
            const base = lang.split('-')[0].toLowerCase();
            let match = voices.find(v => v.lang && v.lang.toLowerCase().indexOf(base) === 0);
            // El chino en Android puede reportarse como cmn-*, zh_CN, o por nombre ("Chinese"/"Mandarin"/中文)
            if (!match && base === 'zh') {
                match = voices.find(v => {
                    const l = (v.lang || '').toLowerCase().replace('_', '-');
                    const n = (v.name || '').toLowerCase();
                    return l.indexOf('zh') === 0 || l.indexOf('cmn') === 0 || l.indexOf('yue') === 0
                        || n.indexOf('chin') !== -1 || n.indexOf('mandarin') !== -1 || /中文|普通话|国语/.test(v.name || '');
                });
            }
            let u;
            if (match) {
                // El dispositivo tiene voz del idioma (ej: chino instalado): pronuncia el carácter nativo
                u = new SpeechSynthesisUtterance(text);
                u.lang = lang; u.voice = match; u.rate = base === 'zh' ? 0.8 : 0.85;
            } else {
                // No hay voz del idioma: suena el pinyin de inmediato (aproximado, pero audible)
                let fb = alt || text;
                if (fb.indexOf('·') !== -1) fb = fb.split('·').pop().trim();
                u = new SpeechSynthesisUtterance(fb);
                u.rate = 0.7;
            }
            window.speechSynthesis.speak(u);
        } catch (e) { console.warn('TTS no disponible', e); }
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
                } else if (sub === 'ingles' || sub === 'chino') {
                    LanguageLab.open(sub);
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

        // Evaluación dinámica desde Supabase: por OA (si vino de una misión)
        // o por asignatura (si vino de tocar una isla). Siempre con rotación (menos vistas primero).
        if (typeof supabaseClient !== 'undefined') {
            try {
                let data, error;
                if (App.currentOACodigo) {
                    ({ data, error } = await supabaseClient.rpc('preguntas_para_oa', {
                        p_oa: App.currentOACodigo, p_user: USER_ID, p_limit: 5 }));
                } else {
                    ({ data, error } = await supabaseClient.rpc('preguntas_para_asignatura', {
                        p_asignatura: subjectKey, p_user: USER_ID, p_limit: 5 }));
                }
                if (error) throw error;

                const dynamicQuestions = Array.isArray(data) ? data : [];
                if (dynamicQuestions.length > 0) {
                    lesson = {
                        id: `dinamica_${App.currentOACodigo || subjectKey}`,
                        oa_codigo: App.currentOACodigo || (dynamicQuestions[0] && dynamicQuestions[0].oa_codigo) || null,
                        title: subject.title,
                        description: "Evaluación Dinámica",
                        narrative: "¡Hola Eliu! ¡Es hora de un nuevo desafío! Responde con atención para ganar estrellas ⭐",
                        questions: dynamicQuestions.map(q => ({
                            id: q.id,
                            oa_codigo: q.oa_codigo,
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
            } catch (e) {
                console.error("Error cargando preguntas dinámicas:", e);
                // Si falla, usa lección estática como respaldo
            }
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

        // Determinar la asignatura de esta lección
        let subjectKey = 'matematica';
        if (lesson.id && lesson.id.startsWith('lenguaje')) subjectKey = 'lenguaje';
        if (lesson.id && lesson.id.startsWith('ciencias')) subjectKey = 'ciencias';
        if (lesson.id && lesson.id.startsWith('historia')) subjectKey = 'historia';
        // Si la lección dinámica trae oa_codigo, derivar asignatura de ahí (más fiable)
        const oaLec = lesson.oa_codigo || (lesson.questions && lesson.questions[0] && lesson.questions[0].oa_codigo);
        if (oaLec) {
            if (oaLec.startsWith('M')) subjectKey = 'matematica';
            else if (oaLec.startsWith('L')) subjectKey = 'lenguaje';
            else if (oaLec.startsWith('C')) subjectKey = 'ciencias';
            else if (oaLec.startsWith('H')) subjectKey = 'historia';
        }

        // REGISTRAR RESULTADOS POR OA (funciona desde isla, misión o test).
        // Agrupa las respuestas por el OA de cada pregunta.
        if (typeof supabaseClient !== 'undefined' && Array.isArray(lesson.questions)) {
            const porOA = {};
            lesson.questions.forEach((q, idx) => {
                const oa = q.oa_codigo || lesson.oa_codigo;
                if (!oa) return;
                if (!porOA[oa]) porOA[oa] = { c: 0, t: 0 };
                porOA[oa].t++;
                const r = (App.responsesHistory || [])[idx];
                if (r && r.correct) porOA[oa].c++;
            });
            for (const oa of Object.keys(porOA)) {
                try {
                    await supabaseClient.rpc('registrar_resultado_oa', {
                        p_user: USER_ID, p_oa: oa,
                        p_correctas: porOA[oa].c, p_total: porOA[oa].t
                    });
                } catch (e) { console.error('Error registrar_resultado_oa', oa, e); }
            }
        }

        // MARCAR LA MISIÓN DEL DÍA COMO HECHA (salvo que falte ver el Material de apoyo)
        if (typeof supabaseClient !== 'undefined') {
            const oaMision = App.currentOACodigo || oaLec;
            let diferida = false;
            // Si vino de una tarjeta de misión y aún no se vio el material, dejar la misión en pantalla
            if (App.currentPlanId && oaMision && !Fase1API.materialVisto(oaMision)) {
                try {
                    const { data: mats } = await supabaseClient.from('recursos_complementarios')
                        .select('id').eq('oa_codigo', oaMision).eq('activo', true).limit(1);
                    if (mats && mats.length) {
                        diferida = true;
                        Fase1API._pendienteMaterial[oaMision] = App.currentPlanId;
                    }
                } catch (e) {}
            }
            try {
                if (diferida) {
                    // No se completa todavía: la tarjeta sigue visible con su botón de Material de apoyo
                    setTimeout(function () { alert('¡Lo hiciste genial! 🌟 Ahora toca 📺 Material de apoyo para verlo, y así la misión queda lista.'); }, 400);
                } else if (App.currentPlanId) {
                    await supabaseClient.from('plan_estudio')
                        .update({ estado: 'completado', fecha_completada: new Date().toISOString() })
                        .eq('id', App.currentPlanId);
                } else {
                    await supabaseClient.rpc('completar_mision_dia', { p_user: USER_ID, p_asignatura: subjectKey });
                }
            } catch (e) { console.error('Error marcando misión:', e); }
            App.currentPlanId = null;
            App.currentSesionId = null;
            // Refrescar pizarra
            try { Fase1API.renderMisiones(); Fase1API.renderStats(); Fase1API.renderMiProgreso(); } catch (e) {}
        }

        // Guardar lección como completada (local)
        const completed = ParentDashboard.getCompletedLessons();
        if (lesson.id && !completed.includes(lesson.id)) {
            completed.push(lesson.id);
            localStorage.setItem('eliu_aprende_lecciones_completas', JSON.stringify(completed));
        }

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
                            const answer = (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0] && data.candidates[0].content.parts[0].text);
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
                                        const answer = (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0] && data.candidates[0].content.parts[0].text);
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
                                const txt = (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0] && data.candidates[0].content.parts[0].text);
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
                                            const answer = (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0] && data.candidates[0].content.parts[0].text);
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

    // Mostrar SIEMPRE la pizarra principal al cargar (Eliú quiere ver su progreso).
    // El check-in de hábitos queda disponible pero no bloquea la entrada.
    App.showView('kids-dashboard-view');
});
