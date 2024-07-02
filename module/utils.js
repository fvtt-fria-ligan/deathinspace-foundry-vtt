export const byName = (a, b) =>
  a.name > b.name ? 1 : b.name > a.name ? -1 : 0;

// https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
export function shuffle(array) {
  let currentIndex = array.length,
    randomIndex;
  // While there remain elements to shuffle.
  while (currentIndex != 0) {
    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }
  return array;
}

export function sample(array) {
  if (!array) {
    return;
  }
  return array[Math.floor(Math.random() * array.length)];
}

export function d20Formula(modifier) {
  return rollFormula("d20", modifier);
}

export function rollFormula(roll, modifier) {
  if (modifier < 0) {
    return `${roll}-${-modifier}`;
  } else if (modifier > 0) {
    return `${roll}+${modifier}`;
  } else {
    return roll;
  }
}

export async function evalRoll(formula) {
  return await new Roll(formula).evaluate();
}

export async function rollTotal(formula, rollData = {}) {
  const roll = new Roll(formula, rollData);
  await roll.evaluate();
  return roll.total;
}

export function rollTotalSync(formula, rollData = {}) {
  return new Roll(formula, rollData).evaluateSync().total;
}

export function upperCaseFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function lowerCaseFirst(str) {
  return str.charAt(0).toLowerCase() + str.slice(1);
}
