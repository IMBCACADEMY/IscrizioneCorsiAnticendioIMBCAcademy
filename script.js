const corsiPrezzi = {
  "Antincendio livello 1 – 4 ore": 60,
  "Antincendio livello 2 – 8 ore": 85,
  "Antincendio livello 3 – 16 ore": 170,
  "Aggiornamento livello 1 – 2 ore": 45,
  "Aggiornamento livello 2 – 5 ore": 60,
  "Aggiornamento livello 3 – 8 ore": 90
};

const corsoSelect = document.getElementById("corso");
const prezzoInput = document.getElementById("prezzo");
const totaleInput = document.getElementById("totale");
const totaleContainer = document.getElementById("totale-container");

// Tipo Iscrizione elements
const tipoPrivato = document.getElementById("tipo-privato");
const tipoAzienda = document.getElementById("tipo-azienda");
const datiAziendaSection = document.getElementById("dati-azienda-section");
const aggiungiPartecipanteContainer = document.getElementById("aggiungi-partecipante-container");
const partecipantiContainer = document.getElementById("partecipanti-container");
const firmaLegaleSection = document.getElementById("firma-legale-section");

// Track signature pads
let signaturePads = [];
let partecipanteCount = 1;
let legaleSignaturePad = null;

// Signature type tracking
let signatureTypes = ['draw']; // Track whether each participant uses draw or text signature
let privacySignatureType = 'draw';
let legaleSignatureType = 'draw';

// Store generated PDF for download
let lastGeneratedPDF = null;
let lastGeneratedFileName = null;

// Payment method elements
const pagamentoBonifico = document.getElementById('pagamento-bonifico');
const pagamentoCarta = document.getElementById('pagamento-carta');
const bonificoDetails = document.getElementById('bonifico-details');
const cartaDetails = document.getElementById('carta-details');

// Payment method toggle function
function togglePaymentMethod() {
  if (pagamentoBonifico && pagamentoBonifico.checked) {
    bonificoDetails.style.display = 'block';
    cartaDetails.style.display = 'none';
    // Clear email for pagamento when bonifico is selected
    const emailPagamentoInput = document.getElementById('email-pagamento');
    if (emailPagamentoInput) {
      emailPagamentoInput.value = '';
    }
  } else if (pagamentoCarta && pagamentoCarta.checked) {
    bonificoDetails.style.display = 'none';
    cartaDetails.style.display = 'block';
  } else {
    // Neither selected, hide both
    bonificoDetails.style.display = 'none';
    cartaDetails.style.display = 'none';
  }
}

// Add event listeners for payment method
if (pagamentoBonifico) {
  pagamentoBonifico.addEventListener('change', togglePaymentMethod);
}
if (pagamentoCarta) {
  pagamentoCarta.addEventListener('change', togglePaymentMethod);
}

// Contatti Modal Functions
function openContattiModal() {
  document.getElementById('contatti-modal').style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeContattiModal() {
  document.getElementById('contatti-modal').style.display = 'none';
  document.body.style.overflow = '';
}

function submitContattiForm(event) {
  event.preventDefault();

  const problema = document.getElementById('contatti-problema').value;
  const email = document.getElementById('contatti-email').value;
  const telefono = document.getElementById('contatti-telefono').value;

  // Construct mailto link
  const subject = encodeURIComponent('Segnalazione problema - Modulo Iscrizione Corsi');
  const body = encodeURIComponent(
    `Problema segnalato:\n${problema}\n\n` +
    `Email: ${email}\n` +
    `Telefono: ${telefono || 'Non specificato'}`
  );

  window.location.href = `mailto:info@imbcacademy.it?subject=${subject}&body=${body}`;

  // Close modal and reset form
  closeContattiModal();
  document.getElementById('contatti-form').reset();

  alert('La tua segnalazione verrà inviata via email. Si aprirà il tuo client di posta.');
}

// Close modal on outside click
document.addEventListener('click', function(event) {
  const modal = document.getElementById('contatti-modal');
  if (event.target === modal) {
    closeContattiModal();
  }
});

// Close modal on Escape key
document.addEventListener('keydown', function(event) {
  if (event.key === 'Escape') {
    closeContattiModal();
  }
});

// Initialize first signature pad
function initializeFirstSignaturePad() {
  const canvas = document.querySelector('.partecipante-signature-pad');
  if (canvas) {
    const pad = new SignaturePad(canvas);
    signaturePads = [pad];
  }

  // Initialize legale signature pad
  const legaleCanvas = document.getElementById('legale-signature-pad');
  if (legaleCanvas) {
    legaleSignaturePad = new SignaturePad(legaleCanvas);
  }

  // Setup signature type toggles for first participant
  setupSignatureTypeToggle(1);
  setupPrivacySignatureTypeToggle();
  setupLegaleSignatureTypeToggle();
}

// Setup signature type toggle for a participant
function setupSignatureTypeToggle(partecipanteNum) {
  const radioName = `partecipante-${partecipanteNum}-signature-type`;
  const radios = document.querySelectorAll(`input[name="${radioName}"]`);

  radios.forEach(radio => {
    radio.addEventListener('change', function() {
      const section = this.closest('.partecipante-firma-container');
      const drawContainer = section.querySelector('.signature-draw-container');
      const textContainer = section.querySelector('.signature-text-container');
      const index = partecipanteNum - 1;

      if (this.value === 'draw') {
        drawContainer.style.display = 'block';
        textContainer.style.display = 'none';
        signatureTypes[index] = 'draw';
      } else {
        drawContainer.style.display = 'none';
        textContainer.style.display = 'block';
        signatureTypes[index] = 'text';
        // Initialize text signature preview
        const textInput = section.querySelector('.signature-text-input');
        updateTextSignaturePreview(textInput);
      }
    });
  });

  // Setup text input listener
  const section = document.querySelector(`[data-partecipante="${partecipanteNum}"]`);
  if (section) {
    const textInput = section.querySelector('.signature-text-input');
    if (textInput) {
      textInput.addEventListener('input', function() {
        updateTextSignaturePreview(this);
      });
    }
  }
}

// Setup privacy signature type toggle
function setupPrivacySignatureTypeToggle() {
  const radios = document.querySelectorAll('input[name="privacy-signature-type"]');
  const section = document.querySelector('.privacy-section .signature-container');

  radios.forEach(radio => {
    radio.addEventListener('change', function() {
      const drawContainer = section.querySelector('.signature-draw-container');
      const textContainer = section.querySelector('.signature-text-container');

      if (this.value === 'draw') {
        drawContainer.style.display = 'block';
        textContainer.style.display = 'none';
        privacySignatureType = 'draw';
      } else {
        drawContainer.style.display = 'none';
        textContainer.style.display = 'block';
        privacySignatureType = 'text';
        updatePrivacyTextSignaturePreview();
      }
    });
  });

  // Setup text input listener
  const textInput = document.getElementById('privacy-signature-text');
  if (textInput) {
    textInput.addEventListener('input', updatePrivacyTextSignaturePreview);
  }
}

// Setup legale signature type toggle
function setupLegaleSignatureTypeToggle() {
  const radios = document.querySelectorAll('input[name="legale-signature-type"]');
  const section = firmaLegaleSection.querySelector('.signature-container');

  radios.forEach(radio => {
    radio.addEventListener('change', function() {
      const drawContainer = section.querySelector('.signature-draw-container');
      const textContainer = section.querySelector('.signature-text-container');
      const certifiedContainer = section.querySelector('.signature-certified-container');

      // Hide all containers first
      drawContainer.style.display = 'none';
      textContainer.style.display = 'none';
      if (certifiedContainer) certifiedContainer.style.display = 'none';

      if (this.value === 'draw') {
        drawContainer.style.display = 'block';
        legaleSignatureType = 'draw';
      } else if (this.value === 'text') {
        textContainer.style.display = 'block';
        legaleSignatureType = 'text';
        updateLegaleTextSignaturePreview();
      } else if (this.value === 'certified') {
        if (certifiedContainer) certifiedContainer.style.display = 'block';
        legaleSignatureType = 'certified';
      }
    });
  });

  // Setup text input listener
  const textInput = document.getElementById('legale-signature-text');
  if (textInput) {
    textInput.addEventListener('input', updateLegaleTextSignaturePreview);
  }
}

// Generate signature from text
function generateTextSignature(text, canvas) {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!text.trim()) return;

  // Background
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Signature style
  ctx.font = 'italic 40px "Brush Script MT", cursive, "Segoe Script", "Lucida Handwriting"';
  ctx.fillStyle = '#1a237e';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Draw the signature
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);

  // Add a subtle underline
  const textWidth = ctx.measureText(text).width;
  ctx.strokeStyle = '#1a237e';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo((canvas.width - textWidth) / 2 - 10, canvas.height / 2 + 25);
  ctx.lineTo((canvas.width + textWidth) / 2 + 10, canvas.height / 2 + 25);
  ctx.stroke();
}

// Update text signature preview for a participant
function updateTextSignaturePreview(input) {
  const container = input.closest('.signature-text-container');
  const canvas = container.querySelector('.signature-text-preview');
  generateTextSignature(input.value, canvas);
}

// Update privacy text signature preview
function updatePrivacyTextSignaturePreview() {
  const input = document.getElementById('privacy-signature-text');
  const canvas = document.getElementById('privacy-signature-text-preview');
  generateTextSignature(input.value, canvas);
}

// Update legale text signature preview
function updateLegaleTextSignaturePreview() {
  const input = document.getElementById('legale-signature-text');
  const canvas = document.getElementById('legale-signature-text-preview');
  generateTextSignature(input.value, canvas);
}

// Clear legale signature
function clearLegaleSignature() {
  if (legaleSignaturePad) {
    legaleSignaturePad.clear();
  }
  const textInput = document.getElementById('legale-signature-text');
  if (textInput) {
    textInput.value = '';
    updateLegaleTextSignaturePreview();
  }
}

// Toggle azienda/privato sections
function toggleTipoIscrizione() {
  const isAzienda = tipoAzienda.checked;

  if (isAzienda) {
    datiAziendaSection.style.display = 'block';
    aggiungiPartecipanteContainer.style.display = 'block';
    totaleContainer.style.display = 'block';
    firmaLegaleSection.style.display = 'block';

    // Make azienda fields required
    document.getElementById('ragione-sociale').required = true;
    document.getElementById('partita-iva').required = true;
    document.getElementById('email-referente').required = true;
    document.getElementById('settore-azienda').required = true;

    // Update title for first participant
    updatePartecipantiTitles();

    // Show remove button if more than 1 participant
    updateRemoveButtons();

    // Hide participant signatures for azienda
    hidePartecipanteSignatures();

    // Hide telefono and settore fields for partecipanti (azienda)
    hidePrivatoOnlyFields();
  } else {
    datiAziendaSection.style.display = 'none';
    aggiungiPartecipanteContainer.style.display = 'none';
    totaleContainer.style.display = 'none';
    firmaLegaleSection.style.display = 'none';

    // Make azienda fields not required
    document.getElementById('ragione-sociale').required = false;
    document.getElementById('partita-iva').required = false;
    document.getElementById('email-referente').required = false;
    document.getElementById('settore-azienda').required = false;

    // Reset to single participant if privato
    resetToSinglePartecipante();

    // Show participant signature for privato
    showPartecipanteSignatures();

    // Show telefono and settore fields for partecipanti (privato)
    showPrivatoOnlyFields();
  }

  updateTotale();
}

// Hide privato-only fields (telefono, settore) for azienda
function hidePrivatoOnlyFields() {
  const fields = document.querySelectorAll('.privato-only-field');
  fields.forEach(field => {
    field.style.display = 'none';
    // Make the input/select not required when hidden
    const input = field.querySelector('input, select');
    if (input) {
      input.required = false;
    }
  });
}

// Show privato-only fields (telefono, settore) for privato
function showPrivatoOnlyFields() {
  const fields = document.querySelectorAll('.privato-only-field');
  fields.forEach(field => {
    field.style.display = 'block';
    // Make the input/select required when visible
    const input = field.querySelector('input, select');
    if (input) {
      input.required = true;
    }
  });
}

// Hide participant signatures (for azienda)
function hidePartecipanteSignatures() {
  const signatures = document.querySelectorAll('.privato-only-signature');
  signatures.forEach(sig => {
    sig.style.display = 'none';
  });
}

// Show participant signatures (for privato)
function showPartecipanteSignatures() {
  const signatures = document.querySelectorAll('.privato-only-signature');
  signatures.forEach(sig => {
    sig.style.display = 'block';
  });
}

// Reset to single participant
function resetToSinglePartecipante() {
  const sections = partecipantiContainer.querySelectorAll('.partecipante-section');

  // Keep only the first one
  for (let i = sections.length - 1; i > 0; i--) {
    sections[i].remove();
  }

  // Reset signaturePads array
  signaturePads = [signaturePads[0]];
  signatureTypes = ['draw'];
  partecipanteCount = 1;

  // Update title
  const firstTitle = partecipantiContainer.querySelector('.partecipante-title');
  if (firstTitle) {
    firstTitle.textContent = 'Dati Personali';
  }

  // Hide remove button
  const removeBtn = partecipantiContainer.querySelector('.btn-remove-partecipante');
  if (removeBtn) {
    removeBtn.style.display = 'none';
  }
}

// Update partecipanti titles
function updatePartecipantiTitles() {
  const sections = partecipantiContainer.querySelectorAll('.partecipante-section');
  sections.forEach((section, index) => {
    const title = section.querySelector('.partecipante-title');
    if (title) {
      title.textContent = `Partecipante ${index + 1}`;
    }
    section.dataset.partecipante = index + 1;
  });
}

// Update remove buttons visibility
function updateRemoveButtons() {
  const sections = partecipantiContainer.querySelectorAll('.partecipante-section');
  const isAzienda = tipoAzienda.checked;

  sections.forEach((section, index) => {
    const removeBtn = section.querySelector('.btn-remove-partecipante');
    if (removeBtn) {
      // Show remove button only if azienda and more than 1 participant
      removeBtn.style.display = (isAzienda && sections.length > 1) ? 'block' : 'none';
    }
  });
}

// Add new participant
function addPartecipante() {
  partecipanteCount++;
  const currentNum = partecipantiContainer.querySelectorAll('.partecipante-section').length + 1;

  const newSection = document.createElement('div');
  newSection.className = 'form-section partecipante-section new-partecipante';
  newSection.dataset.partecipante = currentNum;

  // For azienda, don't include signature in participant section
  const isAzienda = tipoAzienda.checked;

  newSection.innerHTML = `
    <h3 class="section-title">
      <span class="partecipante-title">Partecipante ${currentNum}</span>
      <button type="button" class="btn-remove-partecipante" onclick="removePartecipante(this)">Rimuovi</button>
    </h3>

    <div class="form-group">
      <label>Nome:</label>
      <input type="text" class="partecipante-nome" name="partecipante-${currentNum}-nome" placeholder="Inserisci il nome" required>
    </div>

    <div class="form-group">
      <label>Cognome:</label>
      <input type="text" class="partecipante-cognome" name="partecipante-${currentNum}-cognome" placeholder="Inserisci il cognome" required>
    </div>

    <div class="form-group">
      <label>Email:</label>
      <input type="email" class="partecipante-email" name="partecipante-${currentNum}-email" placeholder="Inserisci l'email" required>
    </div>

    <div class="form-group privato-only-field" style="${isAzienda ? 'display: none;' : ''}">
      <label>Telefono:</label>
      <input type="text" class="partecipante-telefono" name="partecipante-${currentNum}-telefono" placeholder="Inserisci il numero di telefono" ${isAzienda ? '' : 'required'}>
    </div>

    <div class="form-group">
      <label>Codice Fiscale:</label>
      <input type="text" class="partecipante-codice-fiscale" name="partecipante-${currentNum}-codice-fiscale" placeholder="Inserisci il codice fiscale" maxlength="16" required>
      <div class="error-message codice-fiscale-error" style="display: none;">
        Il codice fiscale deve contenere esattamente 16 caratteri.
      </div>
    </div>

    <div class="form-group">
      <label>Profilo Professionale / Mansione:</label>
      <input type="text" class="partecipante-profilo" name="partecipante-${currentNum}-profilo" placeholder="Es. Responsabile sicurezza, Operaio, Tecnico..." required>
    </div>

    <div class="form-group privato-only-field" style="${isAzienda ? 'display: none;' : ''}">
      <label>Settore di Appartenenza:</label>
      <select class="partecipante-settore" name="partecipante-${currentNum}-settore" ${isAzienda ? '' : 'required'}>
        <option value="" disabled selected>Seleziona settore</option>
        <option value="Industria manifatturiera">Industria manifatturiera</option>
        <option value="Edilizia e costruzioni">Edilizia e costruzioni</option>
        <option value="Commercio">Commercio</option>
        <option value="Sanità">Sanità</option>
        <option value="Istruzione">Istruzione</option>
        <option value="Trasporti e logistica">Trasporti e logistica</option>
        <option value="Alberghiero e ristorazione">Alberghiero e ristorazione</option>
        <option value="Servizi">Servizi</option>
        <option value="Pubblica Amministrazione">Pubblica Amministrazione</option>
        <option value="Agricoltura">Agricoltura</option>
        <option value="Altro">Altro</option>
      </select>
    </div>

    <div class="signature-container partecipante-firma-container privato-only-signature" style="${isAzienda ? 'display: none;' : ''}">
      <label>Firma del Partecipante:</label>
      <div class="signature-type-toggle">
        <label class="signature-type-option">
          <input type="radio" name="partecipante-${currentNum}-signature-type" value="draw" checked>
          <span>Disegna firma</span>
        </label>
        <label class="signature-type-option">
          <input type="radio" name="partecipante-${currentNum}-signature-type" value="text">
          <span>Scrivi il testo</span>
        </label>
      </div>
      <div class="signature-draw-container">
        <canvas class="partecipante-signature-pad" width="400" height="150"></canvas>
        <button type="button" class="btn-secondary" onclick="clearPartecipanteSignature(this)">Cancella firma</button>
      </div>
      <div class="signature-text-container" style="display: none;">
        <input type="text" class="signature-text-input" placeholder="Scrivi nome e cognome per generare la firma">
        <canvas class="signature-text-preview" width="400" height="150"></canvas>
      </div>
    </div>
  `;

  partecipantiContainer.appendChild(newSection);

  // Initialize signature pad for new participant
  const newCanvas = newSection.querySelector('.partecipante-signature-pad');
  const newPad = new SignaturePad(newCanvas);
  signaturePads.push(newPad);
  signatureTypes.push('draw');

  // Setup signature type toggle for new participant
  setupSignatureTypeToggle(currentNum);

  // Add codice fiscale validation
  const cfInput = newSection.querySelector('.partecipante-codice-fiscale');
  cfInput.addEventListener('input', function() { validateCodiceFiscaleInput(this); });
  cfInput.addEventListener('blur', function() { validateCodiceFiscaleInput(this); });

  // Update remove buttons
  updateRemoveButtons();

  // Update totale
  updateTotale();

  // Scroll to new section
  newSection.scrollIntoView({ behavior: 'smooth', block: 'center' });

  // Remove animation class after animation completes
  setTimeout(() => {
    newSection.classList.remove('new-partecipante');
  }, 300);
}

// Remove participant
function removePartecipante(button) {
  const section = button.closest('.partecipante-section');
  const index = Array.from(partecipantiContainer.querySelectorAll('.partecipante-section')).indexOf(section);

  // Remove signature pad from array
  signaturePads.splice(index, 1);
  signatureTypes.splice(index, 1);

  // Remove section
  section.remove();

  // Update titles and buttons
  updatePartecipantiTitles();
  updateRemoveButtons();

  // Update totale
  updateTotale();
}

// Clear participant signature
function clearPartecipanteSignature(button) {
  const container = button.closest('.partecipante-firma-container');
  const canvas = container.querySelector('.partecipante-signature-pad');
  const section = button.closest('.partecipante-section');
  const index = Array.from(partecipantiContainer.querySelectorAll('.partecipante-section')).indexOf(section);

  if (signaturePads[index]) {
    signaturePads[index].clear();
  }

  // Also clear text input if exists
  const textInput = container.querySelector('.signature-text-input');
  if (textInput) {
    textInput.value = '';
    updateTextSignaturePreview(textInput);
  }
}

// Validate codice fiscale input
function validateCodiceFiscaleInput(input) {
  const value = input.value.trim();
  const errorDiv = input.parentElement.querySelector('.codice-fiscale-error');

  if (value.length > 0 && value.length < 16) {
    errorDiv.style.display = 'block';
    input.style.borderColor = '#c62828';
    return false;
  } else {
    errorDiv.style.display = 'none';
    input.style.borderColor = '';
    return true;
  }
}

// Update price on course selection
corsoSelect.addEventListener("change", () => {
  const corso = corsoSelect.value;
  prezzoInput.value = corsiPrezzi[corso] ? corsiPrezzi[corso] : "";
  updateTotale();
});

// Update totale based on number of participants
function updateTotale() {
  const corso = corsoSelect.value;
  const prezzoUnitario = corsiPrezzi[corso] || 0;
  const numPartecipanti = partecipantiContainer.querySelectorAll('.partecipante-section').length;
  const totale = prezzoUnitario * numPartecipanti;

  totaleInput.value = totale > 0 ? totale : '';
}

// Tipo iscrizione event listeners
tipoPrivato.addEventListener('change', toggleTipoIscrizione);
tipoAzienda.addEventListener('change', toggleTipoIscrizione);

// Initialize first codice fiscale validation
document.addEventListener('DOMContentLoaded', () => {
  initializeFirstSignaturePad();
  toggleTipoIscrizione();
  togglePaymentMethod();
  updateTotale();

  const firstCfInput = document.querySelector('.partecipante-codice-fiscale');
  if (firstCfInput) {
    firstCfInput.addEventListener('input', function() { validateCodiceFiscaleInput(this); });
    firstCfInput.addEventListener('blur', function() { validateCodiceFiscaleInput(this); });
  }
});

// Signature Pad - Firma Privacy
const privacyCanvas = document.getElementById('privacy-signature-pad');
const privacySignaturePad = new SignaturePad(privacyCanvas);

function clearPrivacySignature() {
  privacySignaturePad.clear();
  const textInput = document.getElementById('privacy-signature-text');
  if (textInput) {
    textInput.value = '';
    updatePrivacyTextSignaturePreview();
  }
}

// Auto-fill privacy date with current date
function setPrivacyDate() {
  const today = new Date();
  const day = String(today.getDate()).padStart(2, '0');
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const year = today.getFullYear();
  const formattedDate = `${day}/${month}/${year}`;
  document.getElementById('data-privacy').value = formattedDate;
}

// Set privacy date on page load
document.addEventListener('DOMContentLoaded', setPrivacyDate);

// Privacy consent validation
const privacyAutorizza = document.getElementById('privacy-autorizza');
const privacyNonAutorizza = document.getElementById('privacy-non-autorizza');
const privacyErrorMessage = document.getElementById('privacy-error-message');

function checkPrivacyConsent() {
  if (privacyNonAutorizza.checked) {
    privacyErrorMessage.style.display = 'block';
    return false;
  } else {
    privacyErrorMessage.style.display = 'none';
    return true;
  }
}

privacyNonAutorizza.addEventListener('change', checkPrivacyConsent);
privacyAutorizza.addEventListener('change', checkPrivacyConsent);

// Get signature data URL based on type
function getSignatureDataURL(index) {
  if (signatureTypes[index] === 'text') {
    const section = partecipantiContainer.querySelectorAll('.partecipante-section')[index];
    const canvas = section.querySelector('.signature-text-preview');
    return canvas.toDataURL();
  } else {
    return signaturePads[index] ? signaturePads[index].toDataURL() : null;
  }
}

// Check if signature is empty
function isSignatureEmpty(index) {
  if (signatureTypes[index] === 'text') {
    const section = partecipantiContainer.querySelectorAll('.partecipante-section')[index];
    const textInput = section.querySelector('.signature-text-input');
    return !textInput.value.trim();
  } else {
    return signaturePads[index] ? signaturePads[index].isEmpty() : true;
  }
}

// Get privacy signature
function getPrivacySignatureDataURL() {
  if (privacySignatureType === 'text') {
    const canvas = document.getElementById('privacy-signature-text-preview');
    return canvas.toDataURL();
  } else {
    return privacySignaturePad.toDataURL();
  }
}

// Check if privacy signature is empty
function isPrivacySignatureEmpty() {
  if (privacySignatureType === 'text') {
    const textInput = document.getElementById('privacy-signature-text');
    return !textInput.value.trim();
  } else {
    return privacySignaturePad.isEmpty();
  }
}

// Get legale signature
function getLegaleSignatureDataURL() {
  if (legaleSignatureType === 'text') {
    const canvas = document.getElementById('legale-signature-text-preview');
    return canvas.toDataURL();
  } else if (legaleSignatureType === 'certified') {
    // For certified signature, generate a special image with certificate info
    return generateCertifiedSignatureImage();
  } else {
    return legaleSignaturePad.toDataURL();
  }
}

// Generate certified signature image
function generateCertifiedSignatureImage() {
  const nome = document.getElementById('legale-cert-nome').value || '';
  const cf = document.getElementById('legale-cert-cf').value || '';
  const provider = document.getElementById('legale-cert-provider').value || '';

  const canvas = document.createElement('canvas');
  canvas.width = 400;
  canvas.height = 150;
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#e8f5e9';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Border
  ctx.strokeStyle = '#4caf50';
  ctx.lineWidth = 3;
  ctx.strokeRect(3, 3, canvas.width - 6, canvas.height - 6);

  // Icon/symbol
  ctx.font = 'bold 24px Arial';
  ctx.fillStyle = '#2e7d32';
  ctx.textAlign = 'center';
  ctx.fillText('✓ FIRMA CERTIFICATA', canvas.width / 2, 35);

  // Details
  ctx.font = '14px Arial';
  ctx.fillStyle = '#424242';
  ctx.textAlign = 'left';

  if (nome) {
    ctx.fillText(`Firmatario: ${nome}`, 20, 65);
  }
  if (cf) {
    ctx.fillText(`C.F.: ${cf}`, 20, 85);
  }
  if (provider) {
    ctx.fillText(`Provider: ${provider}`, 20, 105);
  }

  ctx.font = 'italic 11px Arial';
  ctx.fillStyle = '#616161';
  ctx.fillText('Firma digitale qualificata ai sensi eIDAS', 20, 130);

  return canvas.toDataURL();
}

// Check if legale signature is empty
function isLegaleSignatureEmpty() {
  if (legaleSignatureType === 'text') {
    const textInput = document.getElementById('legale-signature-text');
    return !textInput.value.trim();
  } else if (legaleSignatureType === 'certified') {
    const nome = document.getElementById('legale-cert-nome').value.trim();
    const cf = document.getElementById('legale-cert-cf').value.trim();
    const provider = document.getElementById('legale-cert-provider').value;
    return !nome || !cf || !provider;
  } else {
    return legaleSignaturePad ? legaleSignaturePad.isEmpty() : true;
  }
}

// Generate Excel file for platform import
function generateExcelFile(partecipanti, aziendaData, corso, prezzo, dataPrivacy, metodoPagamento, emailPagamento) {
  const isAzienda = aziendaData !== null;

  // Create data array for Excel
  const excelData = [];

  // For each participant, create a row with all necessary data
  partecipanti.forEach((p, index) => {
    const row = {};

    // Common participant fields
    row['Nome'] = p.nome;
    row['Cognome'] = p.cognome;
    row['Email'] = p.email;
    row['Codice Fiscale'] = p.codiceFiscale;
    row['Profilo Professionale'] = p.profilo;

    // Conditional fields based on tipo iscrizione
    if (isAzienda) {
      // Azienda fields
      row['Ragione Sociale'] = aziendaData.ragioneSociale;
      row['P.IVA / C.F. Azienda'] = aziendaData.partitaIva;
      row['Codice SDI'] = aziendaData.codiceSdi || '';
      row['Indirizzo Sede Legale'] = aziendaData.indirizzo;
      row['Email Referente'] = aziendaData.emailReferente;
      row['PEC Aziendale'] = aziendaData.pec || '';
      row['Telefono Azienda'] = aziendaData.telefono || '';
      row['Settore di Appartenenza'] = aziendaData.settore || '';
    } else {
      // Privato fields
      row['Telefono'] = p.telefono || '';
      row['Settore di Appartenenza'] = p.settore || '';
    }

    // Course info
    row['Corso'] = corso;
    row['Quota Partecipazione (€)'] = prezzo;

    // Payment info
    row['Metodo Pagamento'] = metodoPagamento === 'bonifico' ? 'Bonifico Bancario' :
                              metodoPagamento === 'carta' ? 'Carta di Credito/Debito' : '';
    if (metodoPagamento === 'carta') {
      row['Email Link Pagamento'] = emailPagamento || '';
    }

    // Privacy and consent
    row['Data Sottoscrizione Privacy'] = dataPrivacy;
    row['Consenso Privacy'] = 'Autorizzato';
    row['Tipo Iscrizione'] = isAzienda ? 'Azienda' : 'Privato';

    excelData.push(row);
  });

  // Create workbook and worksheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(excelData);

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Iscrizioni');

  // Generate filename with timestamp
  const now = new Date();
  const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
  const fileName = isAzienda ?
    `iscrizione_${aziendaData.ragioneSociale.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}.xlsx` :
    `iscrizione_${partecipanti[0].cognome}_${partecipanti[0].nome}_${timestamp}.xlsx`;

  // Generate and download Excel file
  XLSX.writeFile(wb, fileName);

  return fileName;
}

// Collect all participants data
function collectPartecipantiData() {
  const partecipanti = [];
  const sections = partecipantiContainer.querySelectorAll('.partecipante-section');
  const isAzienda = tipoAzienda.checked;

  sections.forEach((section, index) => {
    const data = {
      nome: section.querySelector('.partecipante-nome').value,
      cognome: section.querySelector('.partecipante-cognome').value,
      email: section.querySelector('.partecipante-email').value,
      telefono: isAzienda ? '' : section.querySelector('.partecipante-telefono').value,
      codiceFiscale: section.querySelector('.partecipante-codice-fiscale').value,
      profilo: section.querySelector('.partecipante-profilo').value,
      settore: isAzienda ? '' : section.querySelector('.partecipante-settore').value,
      // Only include signature for privato
      firma: !isAzienda ? getSignatureDataURL(index) : null
    };
    partecipanti.push(data);
  });

  return partecipanti;
}

// jsPDF + Netlify Forms Submission
document.getElementById('iscrizione-form').addEventListener('submit', async function(e){
  e.preventDefault();

  const isAzienda = tipoAzienda.checked;
  const partecipanti = collectPartecipantiData();

  // Validate participant signatures only for privato
  if (!isAzienda) {
    for (let i = 0; i < partecipanti.length; i++) {
      if (isSignatureEmpty(i)) {
        alert(`Per favore inserisci la firma del partecipante ${i + 1}`);
        return;
      }
    }
  }

  // Validate legale signature for azienda
  if (isAzienda && isLegaleSignatureEmpty()) {
    if (legaleSignatureType === 'certified') {
      alert("Per favore compila tutti i campi della firma certificata (Nome, Codice Fiscale e Provider)");
    } else {
      alert("Per favore inserisci la firma del legale rappresentante e/o responsabile aziendale");
    }
    return;
  }

  // Check privacy signature
  if(isPrivacySignatureEmpty()){
    alert("Per favore inserisci la firma per il consenso privacy");
    return;
  }

  // Check privacy consent
  if(privacyNonAutorizza.checked){
    privacyErrorMessage.style.display = 'block';
    alert("È impossibile procedere all'iscrizione al corso senza autorizzazione al trattamento dei dati personali.");
    return;
  }

  if(!privacyAutorizza.checked){
    alert("Per favore seleziona l'autorizzazione al trattamento dei dati personali");
    return;
  }

  // Validate all codice fiscale
  let cfValid = true;
  partecipanti.forEach((p, index) => {
    if (p.codiceFiscale.length < 16) {
      cfValid = false;
      const section = partecipantiContainer.querySelectorAll('.partecipante-section')[index];
      const cfInput = section.querySelector('.partecipante-codice-fiscale');
      const errorDiv = section.querySelector('.codice-fiscale-error');
      errorDiv.style.display = 'block';
      cfInput.style.borderColor = '#c62828';
    }
  });

  if (!cfValid) {
    alert("Uno o più codici fiscali non sono validi. Devono contenere esattamente 16 caratteri.");
    return;
  }

  // Validate payment method selection
  const metodoPagamento = pagamentoBonifico && pagamentoBonifico.checked ? 'bonifico' :
                          (pagamentoCarta && pagamentoCarta.checked ? 'carta' : null);

  if (!metodoPagamento) {
    alert("Per favore seleziona un metodo di pagamento (Bonifico Bancario o Carta di Credito)");
    return;
  }

  // If carta, validate email for payment link
  const emailPagamento = document.getElementById('email-pagamento').value;
  if (metodoPagamento === 'carta' && !emailPagamento) {
    alert("Per favore inserisci l'email per ricevere il link di pagamento");
    return;
  }

  const corso = corsoSelect.value;
  const prezzo = prezzoInput.value;
  const dataPrivacy = document.getElementById('data-privacy').value;
  const firmaPrivacyDataURL = getPrivacySignatureDataURL();

  // Azienda data (if applicable)
  let aziendaData = null;
  if (isAzienda) {
    aziendaData = {
      ragioneSociale: document.getElementById('ragione-sociale').value,
      partitaIva: document.getElementById('partita-iva').value,
      codiceSdi: document.getElementById('codice-sdi').value,
      indirizzo: document.getElementById('indirizzo-azienda').value,
      emailReferente: document.getElementById('email-referente').value,
      pec: document.getElementById('pec-azienda').value,
      telefono: document.getElementById('telefono-azienda').value,
      settore: document.getElementById('settore-azienda').value,
      firmaLegale: getLegaleSignatureDataURL(),
      tipoFirmaLegale: legaleSignatureType,
      firmaCertificata: legaleSignatureType === 'certified' ? {
        nome: document.getElementById('legale-cert-nome').value,
        cf: document.getElementById('legale-cert-cf').value,
        provider: document.getElementById('legale-cert-provider').value
      } : null
    };
  }

  // Show loading state on button
  const submitBtn = document.querySelector('.btn-submit');
  const originalBtnText = submitBtn.textContent;
  submitBtn.textContent = 'Invio in corso...';
  submitBtn.disabled = true;

  try {
    // Genera PDF using jsPDF from window.jspdf
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Scheda iscrizione corsi antincendio IMBC", 20, 20);

    let yPosition = 35;

    // If azienda, add company info first
    if (isAzienda && aziendaData) {
      doc.setFontSize(14);
      doc.text("Dati Azienda", 20, yPosition);
      yPosition += 10;

      doc.setFontSize(12);
      doc.text(`Ragione Sociale: ${aziendaData.ragioneSociale}`, 20, yPosition);
      yPosition += 8;
      doc.text(`P.IVA / C.F.: ${aziendaData.partitaIva}`, 20, yPosition);
      yPosition += 8;
      if (aziendaData.codiceSdi) {
        doc.text(`Codice SDI: ${aziendaData.codiceSdi}`, 20, yPosition);
        yPosition += 8;
      }
      doc.text(`Indirizzo: ${aziendaData.indirizzo}`, 20, yPosition);
      yPosition += 8;
      doc.text(`Email Referente: ${aziendaData.emailReferente}`, 20, yPosition);
      yPosition += 8;
      if (aziendaData.pec) {
        doc.text(`PEC: ${aziendaData.pec}`, 20, yPosition);
        yPosition += 8;
      }
      if (aziendaData.telefono) {
        doc.text(`Telefono: ${aziendaData.telefono}`, 20, yPosition);
        yPosition += 8;
      }
      if (aziendaData.settore) {
        doc.text(`Settore di Appartenenza: ${aziendaData.settore}`, 20, yPosition);
        yPosition += 8;
      }

      yPosition += 10;

      // Course info
      doc.setFontSize(14);
      doc.text("Dettagli Corso", 20, yPosition);
      yPosition += 10;
      doc.setFontSize(12);
      doc.text(`Titolo Corso: ${corso}`, 20, yPosition);
      yPosition += 8;
      doc.text(`Quota per partecipante: EUR ${prezzo}`, 20, yPosition);
      yPosition += 8;
      doc.text(`Numero partecipanti: ${partecipanti.length}`, 20, yPosition);
      yPosition += 8;
      doc.text(`Totale: EUR ${parseInt(prezzo) * partecipanti.length}`, 20, yPosition);
      yPosition += 15;
    }

    // Add each participant on separate page (or continue on same if privato)
    partecipanti.forEach((p, index) => {
      if (isAzienda && index > 0) {
        doc.addPage();
        yPosition = 20;
      } else if (!isAzienda) {
        // For privato, continue where we left off
        doc.setFontSize(14);
        doc.text("Dati Personali", 20, yPosition);
        yPosition += 10;
      } else {
        doc.setFontSize(14);
        doc.text(`Partecipante ${index + 1}`, 20, yPosition);
        yPosition += 10;
      }

      doc.setFontSize(12);
      doc.text(`Nome: ${p.nome}`, 20, yPosition);
      yPosition += 8;
      doc.text(`Cognome: ${p.cognome}`, 20, yPosition);
      yPosition += 8;
      doc.text(`Codice Fiscale: ${p.codiceFiscale}`, 20, yPosition);
      yPosition += 8;
      doc.text(`Email: ${p.email}`, 20, yPosition);
      yPosition += 8;
      // Only include telefono for privato
      if (!isAzienda && p.telefono) {
        doc.text(`Telefono: ${p.telefono}`, 20, yPosition);
        yPosition += 8;
      }
      doc.text(`Profilo Professionale: ${p.profilo}`, 20, yPosition);
      yPosition += 8;
      // Only include settore for privato
      if (!isAzienda && p.settore) {
        doc.text(`Settore: ${p.settore}`, 20, yPosition);
        yPosition += 8;
      }
      yPosition += 2;

      // For privato, add course info and signature
      if (!isAzienda) {
        doc.text(`Titolo Corso: ${corso}`, 20, yPosition);
        yPosition += 8;
        doc.text(`Quota di partecipazione: EUR ${prezzo}`, 20, yPosition);
        yPosition += 15;

        // Add payment method info
        if (metodoPagamento === 'bonifico') {
          doc.text(`Metodo di pagamento: Bonifico Bancario`, 20, yPosition);
          yPosition += 8;
          doc.text(`Intestatario: MICHELA COCCO`, 20, yPosition);
          yPosition += 8;
          doc.text(`Banca: BANCA FINDOMESTIC`, 20, yPosition);
          yPosition += 8;
          doc.text(`IBAN: IT65U0311514000000000005566`, 20, yPosition);
          yPosition += 15;
        } else if (metodoPagamento === 'carta' && emailPagamento) {
          doc.text(`Metodo di pagamento: Carta di Credito/Debito/Google Pay`, 20, yPosition);
          yPosition += 8;
          doc.text(`Email per link pagamento: ${emailPagamento}`, 20, yPosition);
          yPosition += 15;
        }

        doc.text(`Firma del Partecipante:`, 20, yPosition);
        if (p.firma) {
          doc.addImage(p.firma, 'PNG', 20, yPosition + 5, 100, 50);
        }
        doc.text("Firma apposta elettronicamente tramite modulo online", 20, yPosition + 60);
      }
    });

    // For azienda, add payment method and legale signature
    if (isAzienda) {
      doc.addPage();
      yPosition = 20;

      // Add payment method info
      if (metodoPagamento === 'bonifico') {
        doc.text(`Metodo di pagamento: Bonifico Bancario`, 20, yPosition);
        yPosition += 8;
        doc.text(`Intestatario: MICHELA COCCO`, 20, yPosition);
        yPosition += 8;
        doc.text(`Banca: BANCA FINDOMESTIC`, 20, yPosition);
        yPosition += 8;
        doc.text(`IBAN: IT65U0311514000000000005566`, 20, yPosition);
        yPosition += 15;
      } else if (metodoPagamento === 'carta' && emailPagamento) {
        doc.text(`Metodo di pagamento: Carta di Credito/Debito/Google Pay`, 20, yPosition);
        yPosition += 8;
        doc.text(`Email per link pagamento: ${emailPagamento}`, 20, yPosition);
        yPosition += 15;
      }

      doc.setFontSize(14);
      doc.text("Firma del Legale Rappresentante e/o Responsabile Aziendale", 20, yPosition);
      yPosition += 15;

      if (aziendaData.firmaLegale) {
        doc.addImage(aziendaData.firmaLegale, 'PNG', 20, yPosition, 100, 50);
      }
      doc.setFontSize(10);
      if (aziendaData.tipoFirmaLegale === 'certified') {
        doc.text("Firma digitale certificata ai sensi del Regolamento eIDAS (UE 910/2014)", 20, yPosition + 55);
        yPosition += 65;
        if (aziendaData.firmaCertificata) {
          doc.text(`Firmatario: ${aziendaData.firmaCertificata.nome}`, 20, yPosition);
          yPosition += 6;
          doc.text(`Codice Fiscale: ${aziendaData.firmaCertificata.cf}`, 20, yPosition);
          yPosition += 6;
          doc.text(`Provider Firma: ${aziendaData.firmaCertificata.provider}`, 20, yPosition);
        }
      } else {
        doc.text("Firma apposta elettronicamente tramite modulo online", 20, yPosition + 55);
      }
    }

    // Privacy section in PDF
    doc.addPage();
    doc.setFontSize(14);
    doc.text("Consenso Privacy", 20, 20);
    doc.setFontSize(12);
    doc.text(`Data sottoscrizione: ${dataPrivacy}`, 20, 35);
    doc.text(`Autorizzazione: Autorizzo il trattamento dei dati personali`, 20, 45);
    doc.text(`Firma per consenso privacy:`, 20, 60);
    doc.addImage(firmaPrivacyDataURL, 'PNG', 20, 65, 100, 50);

    // Store the PDF document for later download
    lastGeneratedPDF = doc;

    // Generate filename with timestamp
    const now = new Date();
    const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
    const fileName = isAzienda ?
      `iscrizione_${aziendaData.ragioneSociale.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}` :
      `iscrizione_${partecipanti[0].cognome}_${partecipanti[0].nome}_${timestamp}`;

    // Store filename for PDF download
    lastGeneratedFileName = fileName;

    // Prepare form data for Netlify Forms submission
    const formData = new FormData();
    formData.append('form-name', 'iscrizione-corsi');
    formData.append('tipo-iscrizione', isAzienda ? 'azienda' : 'privato');
    formData.append('corso', corso);
    formData.append('prezzo', prezzo);
    formData.append('metodo-pagamento', metodoPagamento);
    formData.append('data-privacy', dataPrivacy);
    formData.append('privacy-consent', 'autorizza');

    if (metodoPagamento === 'carta') {
      formData.append('email-pagamento', emailPagamento);
    }

    // Add azienda data if applicable
    if (isAzienda && aziendaData) {
      formData.append('ragione-sociale', aziendaData.ragioneSociale);
      formData.append('partita-iva', aziendaData.partitaIva);
      formData.append('codice-sdi', aziendaData.codiceSdi || '');
      formData.append('indirizzo-azienda', aziendaData.indirizzo);
      formData.append('email-referente', aziendaData.emailReferente);
      formData.append('pec-azienda', aziendaData.pec || '');
      formData.append('telefono-azienda', aziendaData.telefono || '');
      formData.append('settore-azienda', aziendaData.settore || '');
      formData.append('totale', parseInt(prezzo) * partecipanti.length);
      formData.append('numero-partecipanti', partecipanti.length);
    }

    // Add participants data
    partecipanti.forEach((p, index) => {
      const num = index + 1;
      formData.append(`partecipante-${num}-nome`, p.nome);
      formData.append(`partecipante-${num}-cognome`, p.cognome);
      formData.append(`partecipante-${num}-email`, p.email);
      formData.append(`partecipante-${num}-codice-fiscale`, p.codiceFiscale);
      formData.append(`partecipante-${num}-profilo`, p.profilo);
      if (!isAzienda) {
        formData.append(`partecipante-${num}-telefono`, p.telefono || '');
        formData.append(`partecipante-${num}-settore`, p.settore || '');
      }
    });

    // Submit to Netlify Forms
    const response = await fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(formData).toString()
    });

    if (response.ok) {
      // Show success modal
      showSuccessModal();
      // Lock the form
      lockForm();
    } else {
      throw new Error('Errore durante l\'invio dell\'iscrizione');
    }

  } catch (error) {
    console.error('Error submitting form:', error);
    alert("Errore durante l'invio dell'iscrizione: " + error.message);
    // Reset button state
    submitBtn.textContent = originalBtnText;
    submitBtn.disabled = false;
  }
});

// Success Modal Functions
function showSuccessModal() {
  document.getElementById('success-modal').style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeSuccessModal() {
  document.getElementById('success-modal').style.display = 'none';
  document.body.style.overflow = '';
  // Optionally reload page for a fresh form
  // window.location.reload();
}

// Download registration PDF
function downloadRegistrationPDF() {
  if (lastGeneratedPDF && lastGeneratedFileName) {
    lastGeneratedPDF.save(`${lastGeneratedFileName}.pdf`);
  } else {
    alert('Nessun PDF disponibile per il download.');
  }
}

// Lock form after successful submission
function lockForm() {
  const form = document.getElementById('iscrizione-form');

  // Disable all inputs
  const inputs = form.querySelectorAll('input, select, textarea, button');
  inputs.forEach(input => {
    input.disabled = true;
  });

  // Add visual indicator that form is locked
  form.classList.add('form-locked');

  // Change submit button text
  const submitBtn = form.querySelector('.btn-submit');
  if (submitBtn) {
    submitBtn.textContent = 'Iscrizione Completata';
    submitBtn.style.backgroundColor = '#4caf50';
  }
}
