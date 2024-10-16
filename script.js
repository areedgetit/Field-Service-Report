document.addEventListener('DOMContentLoaded', function() {
  const submitBtn = document.getElementById('submitBtn');
  const inputDivs = document.querySelectorAll('.input-div');

  const style = document.createElement('style');
  style.textContent = `
    .pdf-input {
      min-height: 30px !important;
      line-height: 30px !important;
      padding: 5px !important;
      margin-bottom: 5px !important;
      border: 1px solid #ccc !important;
      box-sizing: border-box !important;
      overflow: visible !important;
      resize: none;
    }
    .input-div {
      min-height: 30px !important;
      line-height: 30px !important;
      padding: 5px !important;
      margin-bottom: 5px !important;
      border: 1px solid #ccc !important;
      box-sizing: border-box !important;
      white-space: pre-wrap;
      word-wrap: break-word;
      overflow-wrap: break-word;
      overflow: visible !important;
    }
  `;
  document.head.appendChild(style);

  function adjustHeight() {
    this.style.height = 'auto';
    this.style.height = this.scrollHeight + 'px';
  }

  inputDivs.forEach(inputDiv => {
    inputDiv.addEventListener('input', adjustHeight);
    inputDiv.addEventListener('mousedown', function(e) {
      e.preventDefault();
      this.focus();
    });
  });

  function autoResizeTextareas() {
    const textareas = document.querySelectorAll('textarea');
    textareas.forEach(textarea => {
      textarea.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = this.scrollHeight + 'px';
      });
    });
  }

  autoResizeTextareas();

  submitBtn.addEventListener('click', function(event) {
    event.preventDefault();

    const form = document.querySelector('form');
    form.querySelectorAll('input, select, textarea, [contenteditable="true"]').forEach(el => {
      el.classList.add('pdf-input');
    });

    html2canvas(form, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: true,
      onclone: function(clonedDoc) {
        clonedDoc.querySelectorAll('.pdf-input').forEach(el => {
          if (el.getAttribute('contenteditable') === 'true') {
            el.style.color = 'black';
            el.style.fontSize = '16px';
            el.textContent = el.textContent;
          } else if (el.value) {
            el.style.color = 'black';
            el.style.fontSize = '16px';
          }
        });
      }
    }).then(canvas => {
      const ctx = new C2S(canvas.width, canvas.height);
      ctx.drawImage(canvas, 0, 0);
      const svgString = ctx.getSerializedSvg();
      console.log('SVG String:', svgString); // Log SVG for debugging

      const doc = new PDFDocument({size: [canvas.width, canvas.height]});
      const stream = doc.pipe(blobStream());

      SVGtoPDF(doc, svgString, 0, 0, {width: canvas.width, height: canvas.height});

      doc.end();

      stream.on('finish', function() {
        const blob = stream.toBlob('application/pdf');
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'form-data.pdf';
        link.click();
      });

      form.querySelectorAll('.pdf-input').forEach(el => {
        el.classList.remove('pdf-input');
      });
    }).catch(error => {
      console.error('Error in PDF generation:', error);
      alert('An error occurred while generating the PDF. Please check the console for more details.');
    });
  });
});
