// 游戏状态
const game = {
  stats: {
    military: 50,
    tech: 50,
    morale: 50,
    resources: 50
  },
  currentCard: 0,
  isAnimating: false
};

// DOM 元素
const elements = {
  card: document.getElementById('card'),
  cardSpeaker: document.querySelector('.card-speaker'),
  cardText: document.querySelector('.card-text'),
  choiceLeft: document.querySelector('.choice-left'),
  choiceRight: document.querySelector('.choice-right'),
  overlay: document.getElementById('overlay'),
  endingOverlay: document.getElementById('ending-overlay'),
  startBtn: document.getElementById('start-btn'),
  restartBtn: document.getElementById('restart-btn'),
  endingIcon: document.getElementById('ending-icon'),
  endingTitle: document.getElementById('ending-title'),
  endingText: document.getElementById('ending-text'),
  gameContainer: document.getElementById('game-container')
};

// 拖拽状态
let dragState = {
  isDragging: false,
  startX: 0,
  currentX: 0,
  cardStartX: 0
};

// 初始化
function init() {
  elements.startBtn.addEventListener('click', startGame);
  elements.restartBtn.addEventListener('click', restartGame);
  
  // 触摸事件
  elements.card.addEventListener('touchstart', onDragStart, { passive: true });
  elements.card.addEventListener('touchmove', onDragMove, { passive: true });
  elements.card.addEventListener('touchend', onDragEnd);
  
  // 鼠标事件
  elements.card.addEventListener('mousedown', onDragStart);
  document.addEventListener('mousemove', onDragMove);
  document.addEventListener('mouseup', onDragEnd);
  
  // 键盘事件
  document.addEventListener('keydown', onKeyDown);
}

function startGame() {
  elements.overlay.classList.remove('active');
  game.currentCard = 0;
  game.stats = { military: 50, tech: 50, morale: 50, resources: 50 };
  updateStats();
  showCard();
}

function restartGame() {
  elements.endingOverlay.classList.remove('active');
  elements.overlay.classList.add('active');
}

function showCard() {
  if (game.currentCard >= STORY.cards.length) {
    checkEnding();
    return;
  }
  
  const card = STORY.cards[game.currentCard];
  elements.cardSpeaker.textContent = card.speaker;
  elements.cardText.textContent = card.text;
  elements.choiceLeft.textContent = `← ${card.left.text}`;
  elements.choiceRight.textContent = `${card.right.text} →`;
  
  // 重置卡片位置
  elements.card.style.transform = '';
  elements.card.classList.remove('swipe-left', 'swipe-right', 'drag-left', 'drag-right');
}

function onDragStart(e) {
  if (game.isAnimating) return;
  
  dragState.isDragging = true;
  elements.card.classList.add('dragging');
  
  const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
  dragState.startX = clientX;
  dragState.currentX = clientX;
}

function onDragMove(e) {
  if (!dragState.isDragging) return;
  
  const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
  dragState.currentX = clientX;
  
  const diff = dragState.currentX - dragState.startX;
  const rotation = diff * 0.1;
  
  elements.card.style.transform = `translateX(${diff}px) rotate(${rotation}deg)`;
  
  // 显示选项提示
  if (diff < -30) {
    elements.card.classList.add('drag-left');
    elements.card.classList.remove('drag-right');
  } else if (diff > 30) {
    elements.card.classList.add('drag-right');
    elements.card.classList.remove('drag-left');
  } else {
    elements.card.classList.remove('drag-left', 'drag-right');
  }
}

function onDragEnd(e) {
  if (!dragState.isDragging) return;
  
  dragState.isDragging = false;
  elements.card.classList.remove('dragging');
  
  const diff = dragState.currentX - dragState.startX;
  const threshold = 80;
  
  if (diff < -threshold) {
    swipe('left');
  } else if (diff > threshold) {
    swipe('right');
  } else {
    // 弹回
    elements.card.style.transform = '';
    elements.card.classList.remove('drag-left', 'drag-right');
  }
}

function onKeyDown(e) {
  if (game.isAnimating) return;
  if (elements.overlay.classList.contains('active')) return;
  if (elements.endingOverlay.classList.contains('active')) return;
  
  if (e.key === 'ArrowLeft') {
    swipe('left');
  } else if (e.key === 'ArrowRight') {
    swipe('right');
  }
}

function swipe(direction) {
  if (game.isAnimating) return;
  game.isAnimating = true;
  
  const card = STORY.cards[game.currentCard];
  const effects = direction === 'left' ? card.left.effects : card.right.effects;
  
  // 添加动画类
  elements.card.classList.add(`swipe-${direction}`);
  
  // 故障效果
  elements.gameContainer.classList.add('screen-glitch');
  setTimeout(() => {
    elements.gameContainer.classList.remove('screen-glitch');
  }, 150);
  
  // 应用效果
  applyEffects(effects);
  
  // 动画结束后显示下一张卡片
  setTimeout(() => {
    game.currentCard++;
    game.isAnimating = false;
    
    // 检查是否触发结局
    if (checkBadEnding()) {
      return;
    }
    
    showCard();
  }, 400);
}

function applyEffects(effects) {
  for (const [stat, value] of Object.entries(effects)) {
    game.stats[stat] = Math.max(0, Math.min(100, game.stats[stat] + value));
  }
  updateStats();
}

function updateStats() {
  const statElements = {
    military: document.querySelector('#stat-military .fill'),
    tech: document.querySelector('#stat-tech .fill'),
    morale: document.querySelector('#stat-morale .fill'),
    resources: document.querySelector('#stat-resources .fill')
  };
  
  for (const [stat, element] of Object.entries(statElements)) {
    const value = game.stats[stat];
    element.style.width = `${value}%`;
    
    // 更新颜色类
    element.classList.remove('medium', 'low');
    if (value <= 20) {
      element.classList.add('low');
    } else if (value <= 40) {
      element.classList.add('medium');
    }
    
    // 脉冲动画
    element.style.animation = 'none';
    element.offsetHeight; // 触发重排
    element.style.animation = '';
  }
}

function checkBadEnding() {
  const { military, tech, morale, resources } = game.stats;
  
  if (military <= 5 || morale <= 5 || resources <= 5) {
    showEnding('extinction');
    return true;
  }
  
  return false;
}

function checkEnding() {
  const endings = STORY.endings;
  
  // 按优先级检查结局
  if (endings.dawn.condition(game.stats)) {
    showEnding('dawn');
  } else if (endings.fusion.condition(game.stats)) {
    showEnding('fusion');
  } else if (endings.tyrant.condition(game.stats)) {
    showEnding('tyrant');
  } else if (endings.exodus.condition(game.stats)) {
    showEnding('exodus');
  } else {
    // 默认结局
    showEnding('dawn');
  }
}

function showEnding(endingKey) {
  const ending = STORY.endings[endingKey];
  
  elements.endingIcon.textContent = ending.icon;
  elements.endingTitle.textContent = ending.title;
  elements.endingText.textContent = ending.text;
  
  setTimeout(() => {
    elements.endingOverlay.classList.add('active');
  }, 500);
}

// 启动游戏
init();
