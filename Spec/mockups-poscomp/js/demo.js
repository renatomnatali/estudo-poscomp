(function () {
  const flashcards = document.querySelectorAll('[data-flashcard]');
  flashcards.forEach((card) => {
    card.addEventListener('click', () => {
      card.classList.toggle('is-flipped');
    });
  });

  const speedSlider = document.querySelector('[data-speed-slider]');
  const speedOutput = document.querySelector('[data-speed-output]');
  if (speedSlider && speedOutput) {
    speedOutput.textContent = `${speedSlider.value}x`;
    speedSlider.addEventListener('input', () => {
      speedOutput.textContent = `${speedSlider.value}x`;
    });
  }

  const simulateButton = document.querySelector('[data-run-simulation]');
  if (simulateButton) {
    simulateButton.addEventListener('click', () => {
      const currentStatus = document.querySelector('[data-current-status]');
      const statusLabel = document.querySelector('[data-current-status-label]');
      const lastUpdate = document.querySelector('[data-last-update]');
      if (!currentStatus || !statusLabel || !lastUpdate) return;

      currentStatus.className = 'status-dot running';
      statusLabel.textContent = 'running';
      lastUpdate.textContent = new Date().toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      });

      window.setTimeout(() => {
        currentStatus.className = 'status-dot completed';
        statusLabel.textContent = 'completed';
        lastUpdate.textContent = new Date().toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
        });
      }, 1200);
    });
  }
})();
