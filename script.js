const state = { date: '', time: '17:00', food: '', activity: '' };
const screens = [...document.querySelectorAll('.screen')];

function show(id) {
  screens.forEach(screen => screen.classList.toggle('active', screen.id === id));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.querySelectorAll('[data-next]').forEach(btn => {
  btn.addEventListener('click', () => show(btn.dataset.next));
});

const declineBtn = document.getElementById('declineBtn');
const toast = document.getElementById('toast');
let escapes = 0;

declineBtn.addEventListener('mouseenter', () => {
  if (window.innerWidth < 700 || escapes > 3) return;
  escapes += 1;
  declineBtn.style.transform = `translate(${Math.random() * 160 - 80}px, ${Math.random() * 80 - 40}px)`;
});

declineBtn.addEventListener('click', () => {
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 1600);
});

document.getElementById('timeForm').addEventListener('submit', event => {
  event.preventDefault();
  state.date = document.getElementById('dateInput').value;
  state.time = document.getElementById('timeInput').value;
  show('screen-food');
});

function setupChoiceGrid({ gridId, buttonAttribute, stateKey, customInputId, customButtonId, nextButtonId, nextScreen }) {
  const grid = document.getElementById(gridId);
  const customInput = document.getElementById(customInputId);
  const customButton = document.getElementById(customButtonId);
  const nextButton = document.getElementById(nextButtonId);
  const selector = `button[${buttonAttribute}]`;

  function clearSelection() {
    grid.querySelectorAll(selector).forEach(button => button.classList.remove('selected'));
  }

  function choose(value, button = null) {
    const cleanValue = value.trim();
    if (!cleanValue) {
      customInput.focus();
      return;
    }
    clearSelection();
    if (button) button.classList.add('selected');
    state[stateKey] = cleanValue;
    nextButton.disabled = false;
  }

  grid.addEventListener('click', event => {
    const button = event.target.closest(selector);
    if (!button) return;
    customInput.value = '';
    choose(button.getAttribute(buttonAttribute), button);
  });

  customButton.addEventListener('click', () => choose(customInput.value));

  customInput.addEventListener('keydown', event => {
    if (event.key === 'Enter') {
      event.preventDefault();
      choose(customInput.value);
    }
  });

  customInput.addEventListener('input', () => {
    if (customInput.value.trim()) {
      clearSelection();
      state[stateKey] = '';
      nextButton.disabled = true;
    }
  });

  nextButton.addEventListener('click', () => {
    if (!state[stateKey]) return;
    if (nextScreen) show(nextScreen);
  });

  return { clearSelection, customInput, nextButton };
}

const foodControls = setupChoiceGrid({
  gridId: 'foodGrid',
  buttonAttribute: 'data-food',
  stateKey: 'food',
  customInputId: 'customFood',
  customButtonId: 'useCustomFood',
  nextButtonId: 'foodNext',
  nextScreen: 'screen-activity'
});

const activityControls = setupChoiceGrid({
  gridId: 'activityGrid',
  buttonAttribute: 'data-activity',
  stateKey: 'activity',
  customInputId: 'customActivity',
  customButtonId: 'useCustomActivity',
  nextButtonId: 'activityNext'
});

document.getElementById('activityNext').addEventListener('click', () => {
  if (!state.activity) return;
  const selectedDate = state.date ? new Date(`${state.date}T00:00:00`) : null;

  document.getElementById('finalDate').textContent = selectedDate
    ? `${selectedDate.getMonth() + 1}月${selectedDate.getDate()}日`
    : '待定';
  document.getElementById('finalTime').textContent = state.time || '待定';
  document.getElementById('finalFood').textContent = state.food || '待定';
  document.getElementById('finalActivity').textContent = state.activity || '待定';
  document.getElementById('summaryText').textContent =
    `已经把“吃${state.food}，然后${state.activity}”的约会记进小本本啦 💕`;
  show('screen-final');
});

document.getElementById('restartBtn').addEventListener('click', () => {
  state.date = '';
  state.time = '17:00';
  state.food = '';
  state.activity = '';

  document.getElementById('timeForm').reset();
  document.getElementById('timeInput').value = '17:00';
  foodControls.clearSelection();
  activityControls.clearSelection();
  foodControls.customInput.value = '';
  activityControls.customInput.value = '';
  foodControls.nextButton.disabled = true;
  activityControls.nextButton.disabled = true;
  declineBtn.style.transform = '';
  escapes = 0;
  show('screen-intro');
});

const tomorrow = new Date(Date.now() + 86400000);
document.getElementById('dateInput').min = new Date().toISOString().split('T')[0];
document.getElementById('dateInput').value = tomorrow.toISOString().split('T')[0];
