(() => {
  'use strict';

  const MAX_PHOTOS = 8;
  const MAX_FILE = 5 * 1024 * 1024;
  const MAX_TOTAL = 6 * 1024 * 1024;
  const photos = [];

  let documentFile = null;
  let busy = false;
  let submissionCompleted = false;
  let finalTimer = null;

  const $ = id => document.getElementById(id);

  function msg(text, kind = 'info') {
    const box = $('g7UploadMessage');
    if (!box) return;
    box.className = `g7-message ${kind}`;
    box.textContent = text;
    box.classList.remove('hidden');
  }

  function clearMessage() {
    const box = $('g7UploadMessage');
    if (!box) return;
    box.textContent = '';
    box.classList.add('hidden');
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, character => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[character]);
  }

  function formatSize(bytes) {
    return bytes < 1048576
      ? `${Math.round(bytes / 1024)} KB`
      : `${(bytes / 1048576).toFixed(1)} MB`;
  }

  function fileKey(file) {
    return `${file.name}|${file.size}|${file.lastModified}`;
  }

  function renderPhotos() {
    const grid = $('g7PhotoPreview');
    const counter = $('g7PhotoCount');
    if (!grid || !counter) return;

    counter.textContent = `${photos.length} of ${MAX_PHOTOS} photos added`;
    grid.innerHTML = '';

    photos.forEach((file, index) => {
      const card = document.createElement('figure');
      card.className = 'g7-preview-card';

      const image = document.createElement('img');
      image.alt = `Load photo ${index + 1}`;
      image.src = URL.createObjectURL(file);
      image.onload = () => URL.revokeObjectURL(image.src);

      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'g7-remove';
      remove.textContent = '×';
      remove.setAttribute('aria-label', `Remove photo ${index + 1}`);
      remove.onclick = () => {
        photos.splice(index, 1);
        renderPhotos();
      };

      const caption = document.createElement('figcaption');
      caption.textContent = file.name;

      card.append(image, remove, caption);
      grid.append(card);
    });
  }

  function addPhotos(fileList) {
    clearMessage();

    for (const file of [...(fileList || [])]) {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        msg(`${file.name}: JPG, PNG or WEBP only.`, 'error');
        continue;
      }

      if (file.size > MAX_FILE) {
        msg(`${file.name} is larger than 5 MB.`, 'error');
        continue;
      }

      if (photos.some(existing => fileKey(existing) === fileKey(file))) {
        continue;
      }

      if (photos.length >= MAX_PHOTOS) {
        msg('Maximum 8 photos allowed.', 'error');
        break;
      }

      photos.push(file);
    }

    renderPhotos();
  }

  function setDocument(file) {
    if (!file) {
      documentFile = null;
      renderDocument();
      return;
    }

    if (file.type !== 'application/pdf') {
      msg('The optional document must be a PDF.', 'error');
      return;
    }

    if (file.size > MAX_FILE) {
      msg('The PDF is larger than 5 MB.', 'error');
      return;
    }

    documentFile = file;
    renderDocument();
  }

  function renderDocument() {
    const box = $('g7DocumentPreview');
    if (!box) return;

    box.innerHTML = documentFile
      ? `<div class="g7-document-chip"><span>PDF: ${escapeHtml(documentFile.name)} (${formatSize(documentFile.size)})</span><button type="button" id="g7RemoveDocument">Remove</button></div>`
      : '';

    $('g7RemoveDocument')?.addEventListener('click', () => {
      documentFile = null;
      const input = $('g7Document');
      if (input) input.value = '';
      renderDocument();
    });
  }

  function loadBitmap(file) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      const objectUrl = URL.createObjectURL(file);

      image.onload = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(image);
      };

      image.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error(`Cannot process ${file.name}`));
      };

      image.src = objectUrl;
    });
  }

  async function compressPhoto(file) {
    const image = await loadBitmap(file);
    const maximumDimension = 1280;
    const scale = Math.min(
      1,
      maximumDimension / Math.max(image.naturalWidth, image.naturalHeight)
    );

    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d', { alpha: false });
    context.fillStyle = '#fff';
    context.fillRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);

    let quality = 0.76;
    let dataUrl = canvas.toDataURL('image/jpeg', quality);

    while (dataUrl.length > 800000 && quality > 0.42) {
      quality -= 0.08;
      dataUrl = canvas.toDataURL('image/jpeg', quality);
    }

    return {
      kind: 'LOAD_PHOTO',
      name: file.name.replace(/\.[^.]+$/, '.jpg'),
      mimeType: 'image/jpeg',
      data: dataUrl.split(',')[1],
      bytes: Math.round(dataUrl.length * 0.75)
    };
  }

  function readDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error(`Cannot read ${file.name}`));
      reader.readAsDataURL(file);
    });
  }

  async function prepareUploads() {
    const result = [];
    let totalBytes = 0;

    for (let index = 0; index < photos.length; index++) {
      msg(`Preparing photo ${index + 1} of ${photos.length}...`);
      const prepared = await compressPhoto(photos[index]);
      prepared.position = index + 1;
      totalBytes += prepared.bytes;

      if (totalBytes > MAX_TOTAL) {
        throw new Error(
          'The selected photos are too large together. Remove one or two photos.'
        );
      }

      result.push(prepared);
    }

    if (documentFile) {
      msg('Preparing PDF...');
      const dataUrl = await readDataUrl(documentFile);
      const bytes = Math.round(dataUrl.length * 0.75);
      totalBytes += bytes;

      if (totalBytes > MAX_TOTAL) {
        throw new Error('Photos and PDF are too large together.');
      }

      result.push({
        kind: 'PRIVATE_DOCUMENT',
        name: documentFile.name,
        mimeType: 'application/pdf',
        data: dataUrl.split(',')[1],
        bytes,
        position: 1
      });
    }

    return result;
  }

  function setBusy(isBusy, label = 'Uploading...') {
    busy = isBusy;
    const button = document.querySelector(
      '#leadForm button[type="submit"], #leadForm button:not([type])'
    );

    if (button) {
      button.disabled = isBusy;
      button.dataset.label = button.dataset.label || button.textContent;
      button.textContent = isBusy ? label : button.dataset.label;
    }

    $('g7Progress')?.classList.toggle('hidden', !isBusy);
  }

  function postRequest(payload) {
    let frame = $('g7frame');

    if (!frame) {
      frame = document.createElement('iframe');
      frame.id = 'g7frame';
      frame.name = 'g7frame';
      frame.className = 'hidden';
      document.body.append(frame);
    }

    const form = document.createElement('form');
    form.method = 'POST';
    form.action = (window.HAULMATCH_CONFIG || {}).appsScriptUrl;
    form.target = 'g7frame';
    form.className = 'hidden';

    const input = document.createElement('input');
    input.name = 'payload';
    input.value = JSON.stringify(payload);

    form.append(input);
    document.body.append(form);
    form.submit();
    setTimeout(() => form.remove(), 1200);
  }

  function responseConfirmsRequest(response, reference) {
    if (!response) return false;
    if (response.ok === true || response.found === true) return true;
    if (response.reference === reference) return true;
    if (response.request?.reference === reference) return true;
    if (response.item?.reference === reference) return true;
    if (
      response.status &&
      String(response.status).toUpperCase() !== 'NOT FOUND'
    ) {
      return true;
    }
    return false;
  }

  function finish(reference, confirmed = true) {
    if (submissionCompleted) return;
    submissionCompleted = true;

    if (finalTimer) {
      clearTimeout(finalTimer);
      finalTimer = null;
    }

    setBusy(false);

    const form = $('leadForm');
    const successBox = $('successBox');

    if (form) {
      form.reset();
      form.classList.add('hidden');
    }

    photos.length = 0;
    documentFile = null;
    renderPhotos();
    renderDocument();
    clearMessage();

    if (successBox) {
      successBox.innerHTML = `
        <div class="g7-success-card" role="status" aria-live="polite">
          <div class="g7-success-icon">✓</div>
          <h2>Transport request received</h2>
          <p>${confirmed
            ? 'Your request and photos were uploaded successfully.'
            : 'Your request was submitted and is being checked.'}</p>
          <p>The request is now waiting for HaulMatch admin approval.</p>
          <div class="g7-reference-box">
            <span>Request reference</span>
            <strong id="referenceText">${escapeHtml(reference)}</strong>
          </div>
          <p><strong>Status:</strong> Pending Admin Review</p>
          <p>Save this reference. Use Track Request to view updates or check whether more information is required.</p>
          <div class="actions">
            <a class="btn primary" href="/request-status/?reference=${encodeURIComponent(reference)}">Track Request</a>
            <a class="btn ghost" href="/">Return Home</a>
          </div>
        </div>`;
      successBox.classList.remove('hidden');
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function pollSavedRequest(reference, email) {
    let attempts = 0;
    const maximumAttempts = 15;
    const intervalMilliseconds = 1500;

    const checkRequest = () => {
      if (submissionCompleted || !busy) return;
      attempts++;

      const callbackName =
        `g7status_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const script = document.createElement('script');
      let settled = false;

      const cleanUp = () => {
        if (settled) return;
        settled = true;
        try {
          delete window[callbackName];
        } catch (error) {
          window[callbackName] = undefined;
        }
        script.remove();
      };

      const retry = () => {
        cleanUp();
        if (submissionCompleted || !busy) return;

        if (attempts < maximumAttempts) {
          setTimeout(checkRequest, intervalMilliseconds);
        } else {
          finish(reference, false);
        }
      };

      window[callbackName] = response => {
        if (responseConfirmsRequest(response, reference)) {
          cleanUp();
          finish(reference, true);
        } else {
          retry();
        }
      };

      script.onerror = retry;

      const configuration = window.HAULMATCH_CONFIG || {};
      if (!configuration.appsScriptUrl) {
        cleanUp();
        setBusy(false);
        msg('The HaulMatch backend URL is not configured.', 'error');
        return;
      }

      const parameters = new URLSearchParams({
        action: 'status',
        reference,
        email,
        callback: callbackName,
        _: Date.now()
      });

      script.src =
        configuration.appsScriptUrl + '?' + parameters.toString();
      document.body.appendChild(script);
    };

    setTimeout(checkRequest, 1200);

    // Absolute UI finish: the page can never remain stuck on Uploading.
    finalTimer = setTimeout(() => finish(reference, false), 30000);
  }

  async function send(event) {
    if (busy) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    clearMessage();
    submissionCompleted = false;

    try {
      if ($('website')?.value) throw new Error('Submission blocked.');
      if (!$('consent')?.checked) {
        throw new Error('Accept consent before submitting.');
      }

      setBusy(true, 'Preparing files...');
      const payload = common();
      payload.formType = 'request';
      payload.reference = ref('HMREQ');
      payload.submittedAt = new Date().toISOString();
      payload.uploads = await prepareUploads();
      payload.responseMode = 'postMessage';

      msg(
        payload.uploads.length
          ? `Uploading ${payload.uploads.length} file(s)...`
          : 'Submitting request...'
      );

      setBusy(true, 'Uploading...');
      window.__g7Ref = payload.reference;
      window.__g7Email = payload.email;
      postRequest(payload);
      pollSavedRequest(payload.reference, payload.email);
    } catch (error) {
      setBusy(false);
      msg(error.message || 'Upload failed.', 'error');
    }
  }

  window.addEventListener('message', event => {
    const response = event.data || {};
    if (
      response.source !== 'HAULMATCH_UPLOAD' ||
      submissionCompleted
    ) {
      return;
    }

    if (response.ok === true) {
      finish(response.reference || window.__g7Ref, true);
    }
  });

  document.addEventListener('DOMContentLoaded', () => {
    const form = $('leadForm');
    if (!form || document.body.dataset.form !== 'request') return;

    $('g7PhotoCamera').onchange = event => {
      addPhotos(event.target.files);
      event.target.value = '';
    };

    $('g7PhotoPicker').onchange = event => {
      addPhotos(event.target.files);
      event.target.value = '';
    };

    $('g7Document').onchange = event => {
      setDocument(event.target.files?.[0]);
    };

    const dropzone = $('g7Dropzone');
    if (dropzone) {
      ['dragenter', 'dragover'].forEach(name => {
        dropzone.addEventListener(name, event => {
          event.preventDefault();
          dropzone.classList.add('drag');
        });
      });

      ['dragleave', 'drop'].forEach(name => {
        dropzone.addEventListener(name, event => {
          event.preventDefault();
          dropzone.classList.remove('drag');
        });
      });

      dropzone.addEventListener('drop', event => {
        addPhotos(event.dataTransfer.files);
      });
    }

    form.addEventListener('submit', send, true);
    renderPhotos();
  });
})();
