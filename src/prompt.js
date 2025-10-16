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
