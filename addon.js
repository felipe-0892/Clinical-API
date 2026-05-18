// ─────────────────────────────────────────────
//  addon.js — Tabela de atendimentos, modais e toasts
//  Depende de API_URL definida em index.html
// ─────────────────────────────────────────────

/* ── Estado global ── */
let atendimentos = [];
let toastTimer   = null;

/* ── Inicialização ── */
document.addEventListener('DOMContentLoaded', () => {
  carregarAtendimentos();
});

// ─────────────────────────────────────────────
//  CARREGAR / RENDERIZAR TABELA
// ─────────────────────────────────────────────

async function carregarAtendimentos() {
  const tbody = document.getElementById('tabela-body');
  tbody.innerHTML = `
    <tr>
      <td colspan="5" class="text-center py-8 text-slate-300 text-sm">
        <span class="spinner inline-block"></span>
      </td>
    </tr>`;

  try {
    const res  = await fetch(`${API_URL}/atendimentos`);
    const data = await res.json();
    atendimentos = data.map((item, idx) => ({ ...item, _idx: idx }));
    renderizarTabela();
  } catch {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="text-center py-8 text-red-400 text-sm">
          ⚠ Não foi possível carregar os atendimentos.
        </td>
      </tr>`;
  }
}

function renderizarTabela(lista = atendimentos) {
  const tbody = document.getElementById('tabela-body');

  if (!lista.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="text-center py-10 text-slate-300 text-sm">
          Nenhum atendimento registrado ainda.
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = lista.map(a => `
    <tr class="border-b border-slate-50 hover:bg-slate-50/70 transition-colors group"
        data-idx="${a._idx}">

      <!-- Paciente -->
      <td class="px-4 py-3 text-sm text-slate-700 font-medium whitespace-nowrap">
        <div class="flex items-center gap-2">
          <span class="w-7 h-7 rounded-full bg-brand-100 text-brand-600 text-xs
                       font-semibold flex items-center justify-center shrink-0">
            ${escapeHtml(a.paciente.charAt(0).toUpperCase())}
          </span>
          ${escapeHtml(a.paciente)}
        </div>
      </td>

      <!-- Sintomas -->
      <td class="px-4 py-3 text-sm text-slate-600 max-w-[140px]">
        <div class="flex flex-wrap gap-1">
          ${(a.sintomas || '—').split(', ').map(s =>
            `<span class="inline-block bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full">${escapeHtml(s)}</span>`
          ).join('')}
        </div>
      </td>

      <!-- Médico -->
      <td class="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
        ${escapeHtml(a.medico || '—')}
      </td>

      <!-- Data -->
      <td class="px-4 py-3 text-sm text-slate-400 font-mono whitespace-nowrap">
        ${formatarData(a.data_consulta)}
      </td>

      <!-- Ações -->
      <td class="px-4 py-3 text-right">
        <div class="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">

          <!-- Olho: visualizar -->
          <button onclick="abrirModalVer(${a._idx})"
            class="p-1.5 rounded-lg text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-colors"
            title="Visualizar detalhes">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7
                   -1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
            </svg>
          </button>

          <!-- Lápis: editar -->
          <button onclick="abrirModalEditar(${a._idx})"
            class="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
            title="Editar">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5
                   m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
            </svg>
          </button>

          <!-- Lixeira: excluir -->
          <button onclick="abrirModalExcluir(${a._idx})"
            class="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            title="Excluir">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858
                   L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
            </svg>
          </button>
        </div>
      </td>
    </tr>`).join('');
}

// ─────────────────────────────────────────────
//  BUSCA / FILTRO
// ─────────────────────────────────────────────

function filtrarTabela() {
  const q = document.getElementById('tabela-busca').value.toLowerCase();
  if (!q) { renderizarTabela(); return; }
  const filtrado = atendimentos.filter(a =>
    a.paciente.toLowerCase().includes(q)  ||
    (a.sintomas || '').toLowerCase().includes(q) ||
    (a.medico   || '').toLowerCase().includes(q)
  );
  renderizarTabela(filtrado);
}

// ─────────────────────────────────────────────
//  MODAL — VER (olho)
// ─────────────────────────────────────────────

function abrirModalVer(idx) {
  const a = atendimentos[idx];
  if (!a) return;

  document.getElementById('ver-avatar').textContent   = a.paciente.charAt(0).toUpperCase();
  document.getElementById('ver-paciente').textContent = a.paciente;
  document.getElementById('ver-medico').textContent   = a.medico || '—';
  document.getElementById('ver-data').textContent     = formatarData(a.data_consulta);

  // Sintomas como pills
  const sintomasEl = document.getElementById('ver-sintomas');
  const lista = (a.sintomas || '—').split(', ');
  sintomasEl.innerHTML = lista.map(s =>
    `<span class="inline-flex items-center gap-1 bg-brand-50 text-brand-700 border border-brand-100
                  text-xs font-medium px-2.5 py-1 rounded-full">
      <svg class="w-2.5 h-2.5 text-brand-400" fill="currentColor" viewBox="0 0 8 8">
        <circle cx="4" cy="4" r="3"/>
      </svg>
      ${escapeHtml(s)}
    </span>`
  ).join('');

  // Prontuário
  const pront = (a.prontuario || '').trim();
  const prontuarioEl = document.getElementById('ver-prontuario');
  if (pront) {
    prontuarioEl.textContent = pront;
    prontuarioEl.classList.remove('text-slate-400');
    prontuarioEl.classList.add('text-slate-700');
    prontuarioEl.style.fontStyle = 'normal';
  } else {
    prontuarioEl.textContent = 'Nenhuma observação registrada.';
    prontuarioEl.classList.remove('text-slate-700');
    prontuarioEl.classList.add('text-slate-400');
    prontuarioEl.style.fontStyle = 'italic';
  }

  // Botão editar do modal leva ao modal de edição
  document.getElementById('ver-editar-btn').onclick = () => {
    fecharModal('modal-ver');
    setTimeout(() => abrirModalEditar(idx), 220);
  };

  abrirModal('modal-ver');
}

// ─────────────────────────────────────────────
//  MODAL — EDITAR  →  PUT /api/atendimento/:id
// ─────────────────────────────────────────────

function abrirModalEditar(idx) {
  const a = atendimentos[idx];
  if (!a) return;

  document.getElementById('edit-idx').value        = idx;
  document.getElementById('edit-id').value         = a.id;
  document.getElementById('edit-nome').value       = a.paciente;
  document.getElementById('edit-sintoma').value    = a.sintomas   || '';
  document.getElementById('edit-medico').value     = a.medico     || '';
  document.getElementById('edit-prontuario').value = a.prontuario || '';
  document.getElementById('edit-erro').textContent = '';

  abrirModal('modal-editar');
}

async function confirmarEdicao() {
  const idx        = parseInt(document.getElementById('edit-idx').value);
  const id         = parseInt(document.getElementById('edit-id').value);
  const nome       = document.getElementById('edit-nome').value.trim();
  const sintoma    = document.getElementById('edit-sintoma').value.trim();
  const medico     = document.getElementById('edit-medico').value.trim();
  const prontuario = document.getElementById('edit-prontuario').value.trim();
  const erroEl     = document.getElementById('edit-erro');

  erroEl.textContent = '';

  if (!nome || !sintoma || !medico) {
    erroEl.textContent = 'Preencha paciente, sintoma e médico.';
    return;
  }

  const btn = document.getElementById('edit-confirmar');
  setLoadingBtn(btn, true);

  try {
    const res  = await fetch(`${API_URL}/atendimento/${id}`, {
      method : 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body   : JSON.stringify({ nome, sintoma, medico, prontuario: prontuario || undefined }),
    });
    const data = await res.json();

    if (!res.ok) {
      erroEl.textContent = data.error ?? 'Erro ao salvar.';
      return;
    }

    // Atualiza cache local
    atendimentos[idx] = {
      ...atendimentos[idx],
      paciente : nome,
      sintomas : sintoma,
      medico,
      prontuario,
    };
    renderizarTabela();
    fecharModal('modal-editar');
    mostrarToast('Atendimento atualizado com sucesso!', 'success');
  } catch {
    erroEl.textContent = 'Erro ao conectar com a API.';
  } finally {
    setLoadingBtn(btn, false);
  }
}

// ─────────────────────────────────────────────
//  MODAL — EXCLUIR  →  DELETE /api/atendimento/:id
// ─────────────────────────────────────────────

function abrirModalExcluir(idx) {
  const a = atendimentos[idx];
  if (!a) return;

  document.getElementById('del-idx').value           = idx;
  document.getElementById('del-id').value            = a.id;
  document.getElementById('del-nome').textContent    = a.paciente;
  document.getElementById('del-sintoma').textContent = a.sintomas || '—';
  document.getElementById('del-medico').textContent  = a.medico   || '—';

  abrirModal('modal-excluir');
}

async function confirmarExclusao() {
  const idx = parseInt(document.getElementById('del-idx').value);
  const id  = parseInt(document.getElementById('del-id').value);
  const a   = atendimentos[idx];
  if (!a) return;

  const btn = document.getElementById('del-confirmar');
  setLoadingBtn(btn, true);

  try {
    const res  = await fetch(`${API_URL}/atendimento/${id}`, { method: 'DELETE' });
    const data = await res.json();

    if (!res.ok) {
      mostrarToast(data.error ?? 'Erro ao excluir.', 'danger');
      return;
    }

    const nome = a.paciente;
    atendimentos.splice(idx, 1);
    atendimentos = atendimentos.map((item, i) => ({ ...item, _idx: i }));
    renderizarTabela();
    fecharModal('modal-excluir');
    mostrarToast(`Atendimento de "${nome}" excluído do banco.`, 'danger');
  } catch {
    mostrarToast('Erro ao conectar com a API.', 'danger');
  } finally {
    setLoadingBtn(btn, false);
  }
}

// ─────────────────────────────────────────────
//  HELPERS — MODAL
// ─────────────────────────────────────────────

function abrirModal(id) {
  const el = document.getElementById(id);
  el.classList.remove('hidden');
  requestAnimationFrame(() => {
    const panel = el.querySelector('.modal-panel');
    panel.classList.remove('scale-95', 'opacity-0');
    panel.classList.add('scale-100', 'opacity-100');
  });
}

function fecharModal(id) {
  const el    = document.getElementById(id);
  const panel = el.querySelector('.modal-panel');
  panel.classList.remove('scale-100', 'opacity-100');
  panel.classList.add('scale-95', 'opacity-0');
  setTimeout(() => el.classList.add('hidden'), 200);
}

document.addEventListener('click', (e) => {
  ['modal-ver', 'modal-editar', 'modal-excluir'].forEach(id => {
    const el = document.getElementById(id);
    if (el && e.target === el) fecharModal(id);
  });
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    ['modal-ver', 'modal-editar', 'modal-excluir'].forEach(id => {
      const el = document.getElementById(id);
      if (el && !el.classList.contains('hidden')) fecharModal(id);
    });
  }
});

// ─────────────────────────────────────────────
//  TOAST
// ─────────────────────────────────────────────

function mostrarToast(mensagem, tipo = 'success') {
  const toast = document.getElementById('toast');
  const icon  = document.getElementById('toast-icon');
  const text  = document.getElementById('toast-text');
  const bar   = document.getElementById('toast-bar');

  clearTimeout(toastTimer);
  text.textContent      = mensagem;
  toast.style.opacity   = '';
  toast.style.transform = '';

  const isSuccess = tipo === 'success';
  toast.className = `fixed bottom-6 right-6 z-50 flex items-center gap-3
    bg-white border ${isSuccess ? 'border-emerald-200' : 'border-red-200'}
    text-slate-700 shadow-lg rounded-xl px-4 py-3 min-w-64 max-w-sm
    relative overflow-hidden transition-all duration-300`;

  icon.innerHTML = isSuccess
    ? `<svg class="w-5 h-5 text-emerald-500 shrink-0" fill="none" stroke="currentColor"
        stroke-width="2" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>`
    : `<svg class="w-5 h-5 text-red-400 shrink-0" fill="none" stroke="currentColor"
        stroke-width="2" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round"
          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7
             m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>`;

  bar.className = `absolute bottom-0 left-0 h-0.5 bg-${isSuccess ? 'emerald' : 'red'}-400 rounded-b-xl toast-bar`;
  bar.style.animation = 'none';
  bar.offsetHeight;
  bar.style.animation = '';

  toast.style.display = 'flex';
  toastTimer = setTimeout(() => {
    toast.style.opacity   = '0';
    toast.style.transform = 'translateY(1rem)';
    setTimeout(() => {
      toast.style.display   = 'none';
      toast.style.opacity   = '';
      toast.style.transform = '';
    }, 300);
  }, 3500);
}

// ─────────────────────────────────────────────
//  UTILS
// ─────────────────────────────────────────────

function formatarData(iso) {
  if (!iso || iso === '—') return '—';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function setLoadingBtn(btn, loading) {
  if (loading) {
    btn.disabled = true;
    btn.dataset.original = btn.innerHTML;
    btn.innerHTML = '<span class="spinner inline-block"></span>';
  } else {
    btn.disabled  = false;
    btn.innerHTML = btn.dataset.original ?? btn.innerHTML;
  }
}

function recarregarTabelaAposRegistro() {
  carregarAtendimentos();
}