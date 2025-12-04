import readline from 'readline';

/**
 * Prompts the user for a yes/no answer.
 * @param {string} question - The question to ask
 * @param {boolean} defaultAnswer - The default answer if user presses Enter or if non-TTY
 * @returns {Promise<boolean>} - True for yes, false for no
 */
export async function promptYesNo(question, defaultAnswer) {
  // If not TTY, return default immediately
  if (!process.stdin.isTTY) {
    return defaultAnswer;
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    const defaultHint = defaultAnswer ? 'Y/n' : 'y/N';
    rl.question(`${question} (${defaultHint}): `, (answer) => {
      rl.close();

      const normalized = answer.trim().toLowerCase();

      // Empty answer uses default
      if (normalized === '') {
        resolve(defaultAnswer);
        return;
      }

      // Accept y, yes, n, no
      if (normalized === 'y' || normalized === 'yes') {
        resolve(true);
      } else if (normalized === 'n' || normalized === 'no') {
        resolve(false);
      } else {
        // Invalid input, use default
        resolve(defaultAnswer);
      }
    });
  });
}

/**
 * Prompts the user to select from multiple choices.
 * @param {string} question - The question to ask
 * @param {Array<{value: string, label: string}>} choices - Array of choices with value and label
 * @param {string} defaultValue - The default value if user presses Enter or if non-TTY
 * @returns {Promise<string>} - The selected value
 */
export async function promptChoice(question, choices, defaultValue) {
  // If not TTY, return default immediately
  if (!process.stdin.isTTY) {
    return defaultValue;
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    // Build the prompt with choices
    const choicesText = choices.map((choice, index) =>
      `${index + 1}. ${choice.label}${choice.value === defaultValue ? ' (default)' : ''}`
    ).join('\n  ');

    const promptText = `${question}\n  ${choicesText}\nSelect (1-${choices.length}): `;

    rl.question(promptText, (answer) => {
      rl.close();

      const normalized = answer.trim();

      // Empty answer uses default
      if (normalized === '') {
        resolve(defaultValue);
        return;
      }

      // Try to parse as number
      const choiceIndex = parseInt(normalized, 10) - 1;

      // Check if valid number choice
      if (!isNaN(choiceIndex) && choiceIndex >= 0 && choiceIndex < choices.length) {
        resolve(choices[choiceIndex].value);
        return;
      }

      // Try to match by value directly
      const matchedChoice = choices.find(c => c.value.toLowerCase() === normalized.toLowerCase());
      if (matchedChoice) {
        resolve(matchedChoice.value);
        return;
      }

      // Invalid input, use default
      resolve(defaultValue);
    });
  });
}
