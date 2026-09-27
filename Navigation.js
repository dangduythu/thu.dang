// Android system Back / edge-swipe routing for MathKid. Pure and testable.
export function backDestination(screen, mode) {
  if (screen === 'home') return null;
  const paths = {
    curriculumLesson:'curriculum', curriculum:'home', lesson:'topics', topics:'home',
    gameChoose:'map', map:'home', mini:'map', shark:'sharkChoose',
    sharkChoose:'home', dragGame:'home', wordSteps:'home', result:'home',
    history:'home', pastResult:'history', backup:'parent', parent:'home',
    shop:'home', mental:'home', bank:'home', coach:'home', reviewPlan:'home', mistakes:'home', daily:'home',
    book:'home', choose:'home', testChoose:'home'
  };
  if (screen === 'quiz') {
    return mode === 'mental' ? 'mental' : mode === 'bank' ? 'bank' : mode === 'game' ? 'gameChoose' : mode === 'test' ? 'testChoose'
      : mode === 'review' ? 'reviewPlan' : 'choose';
  }
  return paths[screen] || 'home';
}
