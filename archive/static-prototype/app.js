'use strict';
const $ = (id) => document.getElementById(id);
const form = $('birth-form');
const today = new Date();
const localDate = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
$('birth-date').max = localDate;
function syncFields() {
  const lunar = form.elements.calendar.value === 'lunar';
  $('leap-row').hidden = !lunar;
  if (!lunar) $('leap').checked = false;
  $('birth-time').disabled = $('unknown-time').checked;
  $('birth-time').required = !$('unknown-time').checked;
}
form.addEventListener('change', syncFields);
function showSample() {
  $('form-error').hidden = true;
  if (!form.reportValidity()) return false;
  const date = $('birth-date').value;
  if (date < '1900-01-01' || date > localDate) {
    $('form-error').textContent = '1900년부터 오늘 사이의 날짜를 입력해주세요.';
    $('form-error').hidden = false;
    return false;
  }
  const name = $('nickname').value.trim();
  $('reader-name').textContent = name ? `${name}님` : '당신';
  const calendar = form.elements.calendar.value === 'solar' ? '양력' : `음력${$('leap').checked ? ' · 윤달' : ''}`;
  $('birth-summary').textContent = `${date.replaceAll('-','.')} · ${calendar} · ${$('unknown-time').checked ? '출생시간 모름' : $('birth-time').value}`;
  $('full-report').hidden = true;
  $('unlock-card').hidden = false;
  $('input-view').hidden = true;
  $('result-view').hidden = false;
  window.scrollTo(0,0);
  $('result-title').focus({preventScroll:true});
  return true;
}
form.addEventListener('submit', (event) => {event.preventDefault();showSample();});
function showFullSample() {
  if ($('result-view').hidden) throw new Error('먼저 입력을 마치고 무료 요약을 확인해주세요.');
  $('unlock-card').hidden = true;
  $('full-report').hidden = false;
  $('full-title').focus();
  return {view:'full-report',sample:true,paymentRequired:false};
}
$('unlock-button').addEventListener('click', showFullSample);
function backToInput(reset) {
  if (reset) {form.reset();syncFields();}
  $('result-view').hidden = true;
  $('input-view').hidden = false;
  $('full-report').hidden = true;
  $('form-error').hidden = true;
  $('reader-name').textContent = '당신';
  $('birth-summary').textContent = '';
  window.scrollTo(0,0);
  $('nickname').focus({preventScroll:true});
}
$('edit-button').addEventListener('click', () => backToInput(false));
$('restart-button').addEventListener('click', () => backToInput(true));
syncFields();
if (document.modelContext?.registerTool) {
  try {
    Promise.resolve(document.modelContext.registerTool({
      name:'open_full_sample_report',
      description:'무료 요약을 본 뒤 상세 샘플 리포트를 엽니다. 실제 분석이나 결제를 하지 않습니다.',
      inputSchema:{type:'object',properties:{},additionalProperties:false},
      annotations:{readOnlyHint:false},
      execute(input){if(!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).length) throw new Error('빈 객체를 전달해주세요.');return showFullSample();}
    })).catch(()=>{});
  } catch { /* Browsers without WebMCP keep the same visible flow. */ }
}
