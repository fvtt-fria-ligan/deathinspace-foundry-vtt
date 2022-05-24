export const configureHandlebars = () => {
  /**
   * Formats a Roll as either the total or x + y + z = total if the roll has multiple terms.
   */
  Handlebars.registerHelper("xtotal", (roll) => {
    // collapse addition of negatives into just subtractions
    // e.g., 15 +  - 1 => 15 - 1
    // Also: apparently roll.result uses 2 spaces as separators?
    // We replace both 2- and 1-space varieties
    const result = roll.result.replace("+  -", "-").replace("+ -", "-");

    // roll.result is a string of terms. E.g., "16" or "1 + 15".
    if (result !== roll.total.toString()) {
      return `${result} = ${roll.total}`;
    } else {
      return result;
    }
  });

  // TODO: can we just use Foundry's "eq" helper? verify.
  Handlebars.registerHelper("ifEq", function (arg1, arg2, options) {
    // TODO: verify whether we want == or === for this equality check
    return arg1 == arg2 ? options.fn(this) : options.inverse(this);
  });

  Handlebars.registerHelper("add", function (num1, num2) {
    return num1 + num2;
  });
};
