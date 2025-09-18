document.addEventListener('DOMContentLoaded', function() {
  const dwnBtn = document.getElementById('dwnBtn');
  const sbmt = document.getElementById('sbmt');
  const inputDivs = document.querySelectorAll('.input-div');
  const number = document.getElementById('Machine-Number');
  const date = document.getElementById('date');
  const gang = document.getElementById('gang-number'); 

  function addCustomStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .pdf-input {
        min-height: 30px !important;
        line-height: 30px !important;
        padding: 5px !important;
        margin-bottom: 5px !important;
        border: 1px solid #ccc !important;
        box-sizing: border-box !important;
        overflow: hidden;
        resize: none;
      }
      .input-div {
        border: 1px solid #ccc;
        padding: 5px;
        min-height: 30px;
        width: 300px; 
        white-space: pre-wrap;
        word-wrap: break-word;
        overflow-wrap: break-word;
        line-height: 1.5;
        max-height: 300px;
        overflow-y: auto;
        overflow: hidden;
        padding-bottom: 40px;
      }
      #submitBtn {
        min-height: 30px !important;
        line-height: 30px !important;
        padding: 5px !important;
        margin-bottom: 5px !important;
        border: 1px solid #ccc !important;
        box-sizing: border-box !important;
        overflow: hidden;
        resize: none;  
      }  
      #main-info label > input[type="checkbox"] {
        margin-left: 5px; 
        margin-top: 20px;
      }  
    `;
    document.head.appendChild(style);
  }

  function adjustHeight(inputDiv) {
    inputDiv.style.height = 'auto';
    inputDiv.style.height = inputDiv.scrollHeight + 'px';
  }

  inputDivs.forEach(inputDiv => {
    inputDiv.addEventListener('input', () => adjustHeight(inputDiv));
    inputDiv.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); inputDiv.focus(); });
    inputDiv.addEventListener('mousedown', e => { e.preventDefault(); inputDiv.focus(); });
    adjustHeight(inputDiv);
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

  async function generateAndUploadPDF(machine) {
    if (!machine) { alert("Please select a machine type"); return; }
    addCustomStyles();
    const form = document.querySelector('form');

    form.querySelectorAll('input, select, textarea, [contenteditable="true"]').forEach(el => {
      el.classList.add('pdf-input');
    });

    const formHeight = form.scrollHeight;
    const formWidth = form.offsetWidth;

    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.top = '0';
    tempContainer.style.left = '0';
    tempContainer.style.width = formWidth + 'px';
    tempContainer.style.height = formHeight + 'px';
    tempContainer.style.overflow = 'hidden';
    tempContainer.style.pointerEvents = 'none';

    const clonedForm = form.cloneNode(true);
    tempContainer.appendChild(clonedForm);
    document.body.appendChild(tempContainer);

    setTimeout(async () => {
      const aspectRatio = formHeight / formWidth;
      const { jsPDF } = window.jspdf;
      const pdfWidth = 210;
      const pdfHeight = pdfWidth * aspectRatio;
      const doc = new jsPDF({
        orientation: pdfHeight > pdfWidth ? 'portrait' : 'landscape',
        unit: 'mm',
        format: [pdfWidth, pdfHeight]
      });

      html2canvas(tempContainer, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        height: formHeight,
        windowHeight: formHeight,
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
      }).then(async canvas => {
        const imgData = canvas.toDataURL('image/png');
        doc.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

        const fileName = `${machine.value}-${number.value}-${gang.value}-${date.value}.pdf`;
        const pdfBlob = doc.output('blob');

        // Download PDF locally
        doc.save(fileName);
        console.log("Downloaded PDF:", fileName);

        // Upload PDF to Netlify
        try {
          console.log("Uploading PDF:", fileName);
          const response = await fetch(`/.netlify/functions/uploadfile?fileName=${encodeURIComponent(fileName)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/pdf' },
            body: pdfBlob
          });

          const text = await response.text();
          let result;
          try { result = JSON.parse(text); } catch { result = { message: text }; }

          if (!response.ok) throw new Error(result.message || `Upload failed (${response.status})`);
          console.log("Upload successful:", result);
          alert(result.message || 'PDF uploaded successfully!');
        } catch (error) {
          console.error("Upload error:", error);
          alert("Error uploading PDF: " + error.message);
        } finally {
          document.body.removeChild(tempContainer);
          form.querySelectorAll('.pdf-input').forEach(el => el.classList.remove('pdf-input'));
        }
      }).catch(error => {
        console.error("html2canvas error:", error);
        alert("Error generating PDF: " + error.message);
        document.body.removeChild(tempContainer);
        form.querySelectorAll('.pdf-input').forEach(el => el.classList.remove('pdf-input'));
      });
    }, 100);
  }

  dwnBtn.addEventListener('click', e => {
    e.preventDefault();
    const machine = document.querySelector('input[name="machineType"]:checked');
    generateAndUploadPDF(machine);
  });

  sbmt.addEventListener('click', e => {
    e.preventDefault();
    const machine = document.querySelector('input[name="machineType"]:checked');
    generateAndUploadPDF(machine);
  });
});
